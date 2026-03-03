import { Pool, PoolClient, QueryResult } from "pg";
import dotenv from "dotenv";

dotenv.config();


export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (
  text: string,
  params?: any[]
): Promise<QueryResult> => {
  return pool.query(text, params);
};

export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction error:", err);
    throw err;
  } finally {
    client.release();
  }
};

export const initDB = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "Contact" (
        id SERIAL PRIMARY KEY,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER REFERENCES "Contact"(id) ON DELETE SET NULL,
        linkPrecedence TEXT CHECK (linkPrecedence IN ('primary','secondary')),
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW(),
        deletedAt TIMESTAMP
      );
    `);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_contact_combo
      ON "Contact"(email, phoneNumber)
      WHERE email IS NOT NULL AND phoneNumber IS NOT NULL;
    `);

    await query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp'
        ) THEN
          CREATE TRIGGER set_timestamp
          BEFORE UPDATE ON "Contact"
          FOR EACH ROW
          EXECUTE FUNCTION update_timestamp();
        END IF;
      END
      $$;
    `);

    await query(`SELECT 1`);

    console.log("Database ready");
  } catch (err) {
    console.error("DB Init Failed:", err);
    process.exit(1);
  }
};