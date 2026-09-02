const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace('http://localhost:54321', 'postgresql://postgres:postgres@localhost:54322/postgres') : 'postgresql://postgres:postgres@localhost:54322/postgres'
});

async function run() {
  await client.connect();
  const sql = fs.readFileSync('database/migrations/009_followup_sequences.sql', 'utf8');
  await client.query(sql);
  console.log('Migration applied successfully');
  await client.end();
}

run().catch(console.error);
