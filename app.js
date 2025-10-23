require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let MONGO_URI = process.env.MONGO_URI || null;

async function start() {
  try {
    if (!MONGO_URI) {
      console.log('No MONGO_URI provided — starting in-memory MongoDB');
      const mongod = await MongoMemoryServer.create();
      MONGO_URI = mongod.getUri();
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Create sample users endpoint (for testing/demo)
    async function createSampleUsersResponse(res) {
      try {
        const users = [
          { name: 'Alice', balance: 1000 },
          { name: 'Bob', balance: 500 }
        ];
        const created = await User.insertMany(users);
        return res.status(201).json({ message: 'Users created', users: created });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error creating users' });
      }
    }

    app.post('/create-users', async (req, res) => {
      return createSampleUsersResponse(res);
    });

    // Convenience: allow GET from browser to create sample users
    app.get('/create-users', async (req, res) => {
      return createSampleUsersResponse(res);
    });

    // Transfer endpoint with validation and sequential updates (no transactions)
    app.post('/transfer', async (req, res) => {
      const { fromUserId, toUserId, amount } = req.body;

      if (!fromUserId || !toUserId || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Invalid request body' });
      }

      try {
        // Step 1: Load both users (read latest)
        const [sender, receiver] = await Promise.all([
          User.findById(fromUserId),
          User.findById(toUserId)
        ]);

        if (!sender || !receiver) {
          return res.status(404).json({ message: 'One or both accounts not found' });
        }

        // Step 2: Validate balance
        if (sender.balance < amount) {
          return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Step 3: Deduct from sender and save
        sender.balance -= amount;
        await sender.save();

        // Step 4: Add to receiver and save
        receiver.balance += amount;
        await receiver.save();

        return res.status(200).json({
          message: `Transferred $${amount} from ${sender.name} to ${receiver.name}`,
          senderBalance: sender.balance,
          receiverBalance: receiver.balance
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Transfer failed due to server error' });
      }
    });

    // Basic listing endpoint for convenience
    app.get('/users', async (req, res) => {
      const users = await User.find().select('-__v');
      res.json(users);
    });

    // Simple browser UI for manual testing
    app.get('/ui', (req, res) => {
      return res.send(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Account Transfer UI</title>
        </head>
        <body>
          <h1>Account Transfer UI</h1>
          <button id="create">Create sample users</button>
          <button id="refresh">Refresh users</button>
          <div id="users"></div>
          <h2>Transfer</h2>
          <form id="transferForm">
            From ID: <input id="from" required /><br/>
            To ID: <input id="to" required /><br/>
            Amount: <input id="amount" type="number" required /><br/>
            <button type="submit">Send</button>
          </form>
          <pre id="result"></pre>
          <script>
            async function listUsers(){
              const res = await fetch('/users');
              const users = await res.json();
              document.getElementById('users').textContent = JSON.stringify(users, null, 2);
            }
            document.getElementById('create').onclick = async ()=>{
              const r = await fetch('/create-users', { method:'GET' });
              const j = await r.json();
              document.getElementById('result').textContent = JSON.stringify(j, null, 2);
              listUsers();
            }
            document.getElementById('refresh').onclick = listUsers;
            document.getElementById('transferForm').onsubmit = async (e)=>{
              e.preventDefault();
              const from = document.getElementById('from').value;
              const to = document.getElementById('to').value;
              const amount = Number(document.getElementById('amount').value);
              const r = await fetch('/transfer', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fromUserId: from, toUserId: to, amount }) });
              const j = await r.json();
              document.getElementById('result').textContent = JSON.stringify(j, null, 2);
              listUsers();
            };
            listUsers();
          </script>
        </body>
        </html>
      `);
    });

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
