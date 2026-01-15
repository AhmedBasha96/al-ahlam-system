import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const prismaClientSingleton = () => {
    // Logic:
    // 1. If we are in PRODUCTION (Vercel), use Turso (LibSQL).
    // 2. If we are in DEVELOPMENT (Local), use SQLite (File).

    // Logic:
    // 1. ALWAYS try to connect to Turso (Cloud) first, as requested.
    // 2. If it fails (e.g. no internet), fallback to Local SQLite.

    console.log('[DB] Attempting to connect to Turso (Cloud)...');

    // HARDCODED CREDENTIALS (TURSO)
    const url = "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NzQyNDgsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.x1vlueR05-q3ErHnBy9wN9sNqfxwDJ39ew0SJbw2EASsosAGPlCGcWCOmOUXSRz7HL8CkqU0EBiZeIZBHxiaDA";

    try {
        const libsql = createClient({ url, authToken });
        const adapter = new PrismaLibSQL(libsql as any);
        console.log('[DB] Connected to Turso successfully.');
        return new PrismaClient({ adapter });
    } catch (error) {
        console.error('[DB] Failed to initialize Turso adapter. Falling back to Local SQLite.', error);
        return new PrismaClient();
    }
};

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
