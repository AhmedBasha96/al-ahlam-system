
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

async function main() {
    process.env.DEBUG = 'prisma*';
    process.env.DATABASE_URL = 'file:./dev.db'; // Dummy URL to satisfy schema validation
    console.log('Testing Turso Connection...');

    console.log('Env Vars Check:');
    console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'EXISTS' : 'MISSING');
    console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'EXISTS' : 'MISSING');

    const url = process.env.TURSO_DATABASE_URL || "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
    const authToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0ODU4MTUsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.XGx-46AHRgJNZ4ANn1H301tF3alm6L81tSiAx82dljJhgQZ4LPplrTdDZ0RCpLe6r6Lk_UJLZ6z71UcyRuH8BA";

    console.log('URL:', url);
    console.log('Token Length:', authToken.length);

    const libsql = createClient({ url, authToken });
    console.log('LibSQL Client keys:', Object.keys(libsql));
    try {
        console.log('Testing Turso Connection...');


        console.log('URL:', url);
        console.log('Token Length:', authToken.length);

        // This `libsql` declaration is now redundant if the outer one is used.
        // The instruction was to remove the inner `url` and `authToken` declarations,
        // implying the outer `url` and `authToken` should be used for this `createClient` call.
        // If the intent was to use the *same* libsql client, this line should also be removed.
        // For now, I'll keep it as the instruction only specified `url` and `authToken` removal.
        const libsql = createClient({ url, authToken });
        console.log('LibSQL Client created.');

        // Test Raw Query
        try {
            console.log('Testing Raw LibSQL Query...');
            const result = await libsql.execute("SELECT 1 as val");
            console.log('Raw Query Success:', result);
        } catch (e) {
            console.error('Raw Query Failed:', e);
            throw e; // Stop if raw client fails
        }

        const adapter = new PrismaLibSQL(libsql);
        console.log('Adapter created.');

        const prisma = new PrismaClient({
            adapter
        });

        console.log('Prisma Client initialized. Attempting query...');

        // Try a simple query
        const count = await prisma.user.count();
        console.log('Success! User count:', count);
    } catch (error) {
        console.error('Connection Failed:', error);
    }
}

main();
