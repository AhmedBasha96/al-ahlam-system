import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    // HARDCODED DEBUG CREDENTIALS
    let url = "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
    let authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NzQyNDgsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.x1vlueR05-q3ErHnBy9wN9sNqfxwDJ39ew0SJbw2EASsosAGPlCGcWCOmOUXSRz7HL8CkqU0EBiZeIZBHxiaDA";

    console.log(`[DB] Using HARDCODED credentials.`);

    // FORCE set the DATABASE_URL in the process env so Prisma Engine can find it even if it ignores the adapter
    if (url) {
        process.env.DATABASE_URL = url;
    }

    const isLibsql = typeof url === 'string' && (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('wss://'));

    if (isLibsql && authToken) {
        console.log('[DB] Found Turso config. Initializing adapter...');

        const libsql = createClient({ url: url!, authToken: authToken! })
        const adapter = new PrismaLibSQL(libsql as any)

        // Pass BOTH the adapter AND the explicit datasourceUrl
        return new PrismaClient({
            adapter,
            datasourceUrl: url
        })
    }

    console.log('[DB] No Turso config found. Using default Prisma Client (SQLite file).');
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
