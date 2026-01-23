
import { createClient } from '@libsql/client';
import crypto from 'crypto';

async function main() {
    console.log('Creating user ahmed...');

    const url = "https://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0ODU4MTUsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.XGx-46AHRgJNZ4ANn1H301tF3alm6L81tSiAx82dljJhgQZ4LPplrTdDZ0RCpLe6r6Lk_UJLZ6z71UcyRuH8BA";

    const client = createClient({ url, authToken });

    const id = crypto.randomUUID();
    const username = 'ahmed';
    const password = '1';
    const name = 'Ahmed'; // Arabic name or just Ahmed
    const role = 'ADMIN';

    // Check if user exists
    const existing = await client.execute({
        sql: "SELECT * FROM \"User\" WHERE username = ?",
        args: [username]
    });

    if (existing.rows.length > 0) {
        console.log('User already exists. Updating password/role...');
        await client.execute({
            sql: "UPDATE \"User\" SET password = ?, role = ? WHERE username = ?",
            args: [password, role, username]
        });
        console.log('User updated.');
    } else {
        await client.execute({
            sql: `INSERT INTO "User" ("id", "username", "password", "name", "role", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [id, username, password, name, role]
        });
        console.log('User created successfully!');
    }
}

main();
