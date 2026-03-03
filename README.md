# Bitespeed Backend Task -- Identity Reconciliation

## Overview

This project implements the Identity Reconciliation backend task.

It exposes a POST `/identify` endpoint that links customer contacts
based on email or phone number.\
If multiple records belong to the same person, they are grouped under a
single primary contact.

The implementation is built using:

-   Node.js
-   TypeScript
-   Express
-   PostgreSQL (Docker)

------------------------------------------------------------------------

## Setup Instructions

### 1. Clone the repository

    git clone https://github.com/guts-718/bitespeed-assignment.git
    cd bitespeed_assignment

### 2. Install dependencies

    npm install

### 3. Start PostgreSQL using Docker

    docker run --name bitespeed-postgres ^
      -e POSTGRES_USER=postgres ^
      -e POSTGRES_PASSWORD=postgres ^
      -e POSTGRES_DB=bitespeed ^
      -p 5432:5432 ^
      -d postgres

### 4. Configure environment variables

Create a `.env` file in the root:

    PORT=3000
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bitespeed

### 5. Run the server

    npm run dev

The server will automatically create the required table on startup.

------------------------------------------------------------------------

## API

### POST /identify

Request body:

    {
      "email": "string (optional)",
      "phoneNumber": "string (optional)"
    }

At least one field (email or phoneNumber) is required.

Response:

    {
      "contact": {
        "primaryContactId": number,
        "emails": string[],
        "phoneNumbers": string[],
        "secondaryContactIds": number[]
      }
    }

------------------------------------------------------------------------

## Logic Summary

-   If no existing contact matches → create a new primary contact.
-   If matching contacts exist → link them under the oldest primary.
-   If multiple primaries are discovered → merge them.
-   Duplicate combinations are prevented using a database unique index.
-   All operations are executed inside a database transaction to prevent
    race conditions.

------------------------------------------------------------------------

## Testing

You can test the endpoint using Postman or curl:

    curl -X POST http://localhost:3000/identify ^
      -H "Content-Type: application/json" ^
      -d "{"email":"test@example.com","phoneNumber":"123"}"

------------------------------------------------------------------------

## Notes

-   Email matching is case-insensitive.
-   Phone numbers are normalized to digits only.
-   The solution is concurrency safe using transactions.
-   No records are deleted; linking is maintained using linkedId and
    linkPrecedence.
