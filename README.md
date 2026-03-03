# 🧠 Bitespeed Identity Reconciliation API

## 📌 Overview

This project implements an **Identity Reconciliation API** that links customer contacts based on shared email and/or phone numbers.

The system ensures:
- No duplicate primary contacts
- Proper linking of secondary contacts
- Merging of multiple primary records when needed
- Clean and normalized data storage

---

## 🎯 Objective

When a user provides an email and/or phone number:

- If no matching contact exists → create a new **Primary Contact**
- If matching contact exists → link as **Secondary Contact**
- If multiple primary contacts exist → merge them under the oldest primary
- Return consolidated contact information

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express.js  
- **Language:** TypeScript  
- **Database:** PostgreSQL  
- **Driver:** pg (node-postgres)  
- **Environment Management:** dotenv  
- **Containerization:** Docker & Docker Compose  

---

## 📂 Project Structure

```bash
bitespeed-assignment-main
│
├── src
│   ├── server.ts
│   ├── db
│   │   └── index.ts
│   └── routes
│       └── identify.ts
│
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

---

## 🔍 API Endpoint

### POST `/identify`

### Request Body

```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```

### Response Format

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## 🗄️ Database Schema (Contact Table)

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| email | varchar | Email address |
| phoneNumber | varchar | Phone number |
| linkedId | integer | Links to primary contact |
| linkPrecedence | primary/secondary | Contact type |
| createdAt | timestamp | Record creation time |
| updatedAt | timestamp | Last update time |
| deletedAt | timestamp | Soft delete field |

---

## 🚀 How to Run Locally

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Setup Environment Variables

Create a `.env` file:

```env
PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=bitespeed
DB_PORT=5432
```

### 3️⃣ Run Development Server

```bash
npm run dev
```

Server runs at:

```
http://localhost:3000
```

---

## 🐳 Run Using Docker

```bash
docker-compose up --build
```

This will:
- Build the Node container  
- Start PostgreSQL  
- Run the backend service  

---

## 🧪 Testing the API

Using curl:

```bash
curl -X POST http://localhost:3000/identify \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com","phoneNumber":"1234567890"}'
```

---

## 📊 Key Features

✔ Identity reconciliation  
✔ Primary-secondary linking  
✔ Automatic merging of primary contacts  
✔ Duplicate prevention  
✔ Transaction-safe database operations  
✔ Dockerized setup  

---

## 📈 Future Improvements

- Add unit testing (Jest)  
- Add request validation (Zod / Joi)  
- Add API documentation (Swagger)  
- Deploy to cloud (AWS / Render / Railway)  

---

## 👤 Author

**Nikhil Kumar**  
B.Tech Computer Science & Engineering  
Backend Developer
