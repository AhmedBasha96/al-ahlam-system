
const { createClient } = require('@libsql/client');

async function viewTables() {
    const url = "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NzQyNDgsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.x1vlueR05-q3ErHnBy9wN9sNqfxwDJ39ew0SJbw2EASsosAGPlCGcWCOmOUXSRz7HL8CkqU0EBiZeIZBHxiaDA";

    console.log("Connecting to Turso Database...");
    const client = createClient({ url, authToken });

    try {
        // List all tables
        const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name != '_prisma_migrations' ORDER BY name;");

        console.log("\n--- Database Tables ---");
        if (tablesResult.rows.length === 0) {
            console.log("No tables found.");
        } else {
            console.log(`Found ${tablesResult.rows.length} tables:`);

            for (const row of tablesResult.rows) {
                const tableName = row.name;
                // Count rows in each table
                try {
                    const countResult = await client.execute(`SELECT COUNT(*) as count FROM "${tableName}"`);
                    console.log(`- ${tableName.padEnd(20)} : ${countResult.rows[0].count} records`);
                } catch (e) {
                    console.log(`- ${tableName.padEnd(20)} : (Error counting)`);
                }
            }
        }

        console.log("\n--- Users Table Check ---");
        try {
            const users = await client.execute("SELECT username, role, password FROM User LIMIT 5");
            console.log(users.rows);
        } catch (e) {
            console.log("Could not query User table.");
        }

    } catch (e) {
        console.error("Connection failed:", e);
    }
}

viewTables();
