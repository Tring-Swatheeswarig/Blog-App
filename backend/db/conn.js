import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'blogdb',
    password: '1234', 
    port: 5432,
});

client.connect()
    .then(() => console.log("✅ Connected to PostgreSQL"))
    .catch(err => console.error("❌ Database connection error:", err.stack));

export default client;
