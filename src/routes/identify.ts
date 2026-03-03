import { Router, Request, Response } from "express";
import { PoolClient } from "pg";
import { transaction } from "../db";

const router = Router();

/* ---------- Types ---------- */

interface Contact {
  id: number;
  email: string | null;
  phonenumber: string | null;
  linkedid: number | null;
  linkprecedence: "primary" | "secondary";
  createdat: Date;
}

/* ---------- Normalizers ---------- */

const normalizeEmail = (email?: string): string | null =>
  email ? email.trim().toLowerCase() : null;

const normalizePhone = (phone?: string): string | null =>
  phone ? phone.replace(/\D/g, "") : null;

/* ---------- DB Helpers ---------- */

const findMatches = async (
  client: PoolClient,
  email: string | null,
  phone: string | null
): Promise<Contact[]> => {
  const conditions: string[] = [];
  const values: string[] = [];

  if (email) {
    values.push(email);
    conditions.push(`LOWER(email) = LOWER($${values.length})`);
  }

  if (phone) {
    values.push(phone);
    conditions.push(`phonenumber = $${values.length}`);
  }

  if (!conditions.length) return [];

  const result = await client.query(
    `SELECT * FROM "Contact" WHERE ${conditions.join(" OR ")}`,
    values
  );

  return result.rows;
};

const getAllLinkedContacts = async (
  client: PoolClient,
  primaryId: number
): Promise<Contact[]> => {
  const result = await client.query(
    `SELECT * FROM "Contact"
     WHERE id=$1 OR linkedid=$1`,
    [primaryId]
  );
  return result.rows;
};

const insertPrimary = async (
  client: PoolClient,
  email: string | null,
  phone: string | null
): Promise<Contact> => {
  const result = await client.query(
    `INSERT INTO "Contact"(email, phonenumber, linkprecedence)
     VALUES($1,$2,'primary')
     RETURNING *`,
    [email, phone]
  );
  return result.rows[0];
};

const insertSecondary = async (
  client: PoolClient,
  email: string | null,
  phone: string | null,
  primaryId: number
) => {
  await client.query(
    `INSERT INTO "Contact"(email, phonenumber, linkedid, linkprecedence)
     VALUES($1,$2,$3,'secondary')`,
    [email, phone, primaryId]
  );
};

const mergePrimaries = async (
  client: PoolClient,
  primaryId: number,
  others: number[]
) => {
  for (const id of others) {
    await client.query(
      `UPDATE "Contact"
       SET linkedid=$1, linkprecedence='secondary'
       WHERE id=$2`,
      [primaryId, id]
    );

    await client.query(
      `UPDATE "Contact"
       SET linkedid=$1
       WHERE linkedid=$2`,
      [primaryId, id]
    );
  }
};

/* ---------- Route ---------- */

router.post("/", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);
    const phone = normalizePhone(req.body.phoneNumber);

    /* validation */
    if (!email && !phone) {
      return res.status(400).json({
        error: "email or phoneNumber required",
      });
    }

    const result = await transaction(async (client) => {
      const matches = await findMatches(client, email, phone);

      /* ---------- CASE 1: no matches ---------- */

      if (!matches.length) {
        const created = await insertPrimary(client, email, phone);

        return {
          contact: {
            primaryContactId: created.id,
            emails: email ? [email] : [],
            phoneNumbers: phone ? [phone] : [],
            secondaryContactIds: [],
          },
        };
      }

      /* ---------- find primaries ---------- */

      const primaryIds = new Set<number>();

      matches.forEach((c) => {
        if (c.linkprecedence === "primary") primaryIds.add(c.id);
        else if (c.linkedid) primaryIds.add(c.linkedid);
      });

      const primaryRecords = await client.query(
        `SELECT * FROM "Contact"
         WHERE id = ANY($1)
         ORDER BY createdat ASC`,
        [[...primaryIds]]
      );

      const primary = primaryRecords.rows[0];
      const otherPrimaries = primaryRecords.rows.slice(1).map((p) => p.id);

      /* ---------- merge primaries ---------- */

      if (otherPrimaries.length) {
        await mergePrimaries(client, primary.id, otherPrimaries);
      }

      /* ---------- duplicate check ---------- */

      const duplicate = matches.find(
        (c) => c.email === email && c.phonenumber === phone
      );

      if (!duplicate) {
        await insertSecondary(client, email, phone, primary.id);
      }

      /* ---------- final response ---------- */

      const allContacts = await getAllLinkedContacts(client, primary.id);

      const emails = new Set<string>();
      const phones = new Set<string>();
      const secondaryIds: number[] = [];

      allContacts.forEach((c) => {
        if (c.email) emails.add(c.email);
        if (c.phonenumber) phones.add(c.phonenumber);
        if (c.linkprecedence === "secondary") secondaryIds.push(c.id);
      });

      return {
        contact: {
          primaryContactId: primary.id,
          emails: [...emails],
          phoneNumbers: [...phones],
          secondaryContactIds: secondaryIds,
        },
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Identity error:", err);
    res.status(500).json({ error: "internal server error" });
  }
});

export default router;