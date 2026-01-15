const { createClient } = require('@libsql/client');
// Initializing without uuid

const url = "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NzQyNDgsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.x1vlueR05-q3ErHnBy9wN9sNqfxwDJ39ew0SJbw2EASsosAGPlCGcWCOmOUXSRz7HL8CkqU0EBiZeIZBHxiaDA";

async function seed() {
    const client = createClient({ url, authToken });

    try {
        const userId = '00000000-0000-0000-0000-000000000000'; // Static ID for admin
        const username = 'admin';
        const password = '12345'; // Matching page.tsx expected password
        const name = 'مدير النظام';

        console.log("Checking if admin user exists...");
        const result = await client.execute({
            sql: "SELECT * FROM User WHERE username = ?",
            args: [username]
        });

        if (result.rows.length === 0) {
            console.log("Creating admin user...");
            await client.execute({
                sql: "INSERT INTO User (id, username, password, name, role, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
                args: [userId, username, password, name, 'ADMIN', new Date().toISOString()]
            });
            console.log("Admin user created successfully!");
        } else {
            console.log("Admin user exists. Updating password...");
            await client.execute({
                sql: "UPDATE User SET password = ? WHERE username = ?",
                args: [password, username]
            });
            console.log("Admin password updated successfully.");
        }
    } catch (e) {
        console.error("Error seeding database:", e);
    } finally {
        client.close();
    }
}

seed();
