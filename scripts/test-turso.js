
const { createClient } = require('@libsql/client');

async function test() {
    const url = "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NzQyNDgsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.x1vlueR05-q3ErHnBy9wN9sNqfxwDJ39ew0SJbw2EASsosAGPlCGcWCOmOUXSRz7HL8CkqU0EBiZeIZBHxiaDA";

    console.log("Testing Turso connection...");
    try {
        const client = createClient({ url, authToken });
        const rs = await client.execute("SELECT 1");
        console.log("Connection successful:", rs);
    } catch (e) {
        console.error("Connection failed:", e);
    }
}

test();
