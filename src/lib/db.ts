import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    let url = process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    // Safety check for literal 'undefined' string which can happen in some environments
    if (url === 'undefined') url = undefined;

    const isLibsql = url?.startsWith('libsql://') || url?.startsWith('https://') || url?.startsWith('wss://');

    if (isLibsql || authToken) {
        if (!url || !authToken) {
            console.error(`[DB] Configuration Error: Missing required variables for Turso. URL: ${url ? 'OK' : 'MISSING'}, Token: ${authToken ? 'OK' : 'MISSING'}`);
            // Fallback to default Prisma which will try to use local SQLite if DATABASE_URL is not set or fail with a clearer message
            return new PrismaClient()
        }

        console.log('[DB] Attempting to initialize Turso/LibSQL adapter...');
        try {
            const libsql = createClient({ url, authToken })
            const adapter = new PrismaLibSql(libsql as any)
            return new PrismaClient({ adapter })
        } catch (error: any) {
            console.error(`[DB] Failed to initialize Turso adapter: ${error.message}`);
            return new PrismaClient()
        }
    }

    console.log('[DB] Using default Prisma Client (Local SQLite)');
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
