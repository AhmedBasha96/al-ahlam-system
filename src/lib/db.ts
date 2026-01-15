import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    // Try new unique names first, then fall back to defaults
    let url = process.env.TURSO_DB_URL || process.env.DATABASE_URL
    let authToken = process.env.TURSO_DB_TOKEN || process.env.TURSO_AUTH_TOKEN

    // Safety check for literal 'undefined' string
    if (url === 'undefined' || !url) url = undefined;
    if (authToken === 'undefined' || !authToken) authToken = undefined;

    console.log(`[DB] Env Check: URL=${url ? `${url.substring(0, 10)}...` : 'MISSING'}, Token=${authToken ? 'PRESENT' : 'MISSING'}`);

    const isLibsql = typeof url === 'string' && (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('wss://'));

    if (isLibsql && authToken) {
        console.log('[DB] Found Turso config. Initializing adapter...');
        // We do NOT use try-catch here. If this fails, we want the app to crash/error 
        // with the specific reason, rather than falling back to a broken default client.
        const libsql = createClient({ url: url!, authToken: authToken! })
        const adapter = new PrismaLibSQL(libsql as any)
        return new PrismaClient({ adapter })
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
