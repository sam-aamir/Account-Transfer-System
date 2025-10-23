// Simple demo script that creates users and performs successful and failed transfers
const axios = require('axios');

const port = process.env.PORT || 3000;
const base = `http://localhost:${port}`;

async function run() {
  try {
    console.log('Creating users...');
    const createRes = await axios.post(`${base}/create-users`);
    console.log('Create response:', createRes.status, createRes.data.message);
    const users = createRes.data.users;
    const alice = users.find(u => u.name === 'Alice');
    const bob = users.find(u => u.name === 'Bob');

    console.log('\nUsers:');
    console.log('Alice:', alice);
    console.log('Bob:', bob);

    console.log('\nAttempting successful transfer of $150 from Alice to Bob...');
    const t1 = await axios.post(`${base}/transfer`, {
      fromUserId: alice._id,
      toUserId: bob._id,
      amount: 150
    });
    console.log('Transfer 1 response:', t1.status, t1.data);

    console.log('\nAttempting failed transfer of $900 from Alice to Bob (should fail)...');
    try {
      await axios.post(`${base}/transfer`, {
        fromUserId: alice._id,
        toUserId: bob._id,
        amount: 900
      });
    } catch (err) {
      if (err.response) console.log('Transfer 2 response:', err.response.status, err.response.data);
      else console.error(err);
    }

    console.log('\nFinal balances:');
    const final = await axios.get(`${base}/users`);
    console.log(final.data);

  } catch (err) {
    console.error('Demo error:', err.response ? err.response.data : err.message);
  }
}

run();
