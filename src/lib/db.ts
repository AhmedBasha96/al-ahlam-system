import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    const url = process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    console.log(`[DB] Initialization attempt (URL: ${url ? 'Present' : 'Missing'}, Token: ${authToken ? 'Present' : 'Missing'})`);

    if (url?.startsWith('libsql://') || authToken) {
        if (!url || !authToken) {
            console.error(`[DB] Configuration Error: One of DATABASE_URL or TURSO_AUTH_TOKEN is missing for Turso.`);
            return new PrismaClient()
        }

        console.log('[DB] Attempting to use Turso/LibSQL adapter');
        try {
            const libsql = createClient({ url, authToken })
            const adapter = new PrismaLibSql(libsql as any)
            return new PrismaClient({ adapter })
        } catch (error) {
            console.error('[DB] Failed to initialize Turso adapter.', error);
            return new PrismaClient()
        }
    }

    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
