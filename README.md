# Account Transfer System (Node.js + MongoDB)

This project demonstrates a simple account transfer API implemented in Node.js and Express, using Mongoose to interact with MongoDB. It intentionally avoids database transactions and instead performs careful application-level validation before making sequential updates.

Features
- Create sample users (Alice and Bob)
- Transfer money from one user to another with balance validation
- Return meaningful errors for insufficient funds or missing users

Quick start
1. Copy `.env.example` to `.env` and update `MONGO_URI` if needed.
2. Install dependencies: `npm install`
3. Start MongoDB locally (e.g. `mongod` or run a MongoDB service)
4. Start the server: `npm run start` (or `npm run dev` for nodemon)
5. In another terminal run the demo script: `npm run demo`

What the demo does
- Calls `POST /create-users` to create Alice ($1000) and Bob ($500)
- Calls `POST /transfer` to transfer $150 from Alice to Bob (success)
- Calls `POST /transfer` to transfer $900 from Alice to Bob (failure: insufficient funds)
- Prints final balances

Notes about correctness without DB transactions
- This example reads both accounts, validates the sender's balance, then performs sequential updates (deduct then credit).
- Without DB-level transactions there is a small window for race conditions if multiple concurrent transfers run against the same account. To fully prevent that you'd use transactions, optimistic concurrency (version fields), or atomic operators with conditional updates.

Endpoints
- POST /create-users -> create sample users
- GET /users -> list users
- POST /transfer -> { fromUserId, toUserId, amount }

License: MIT
