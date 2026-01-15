const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const url = "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NzQyNDgsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.x1vlueR05-q3ErHnBy9wN9sNqfxwDJ39ew0SJbw2EASsosAGPlCGcWCOmOUXSRz7HL8CkqU0EBiZeIZBHxiaDA";

async function applySchema() {
    const client = createClient({ url, authToken });
    const schemaSql = fs.readFileSync(path.join(__dirname, '../prisma/turso_schema.sql'), 'utf8');

    // Split by -- CreateTable or similar markers if needed, but Turso supports multiple statements in batch
    // Actually, it's safer to split by ';' but Prisma's SQL might have comments.
    // batch() expects an array of strings or {sql, args}

    const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log(`Applying ${statements.length} statements...`);

    try {
        await client.batch(statements);
        console.log("Schema applied successfully!");
    } catch (e) {
        console.error("Error applying schema:", e);
    } finally {
        client.close();
    }
}

applySchema();
