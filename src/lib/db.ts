import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    console.log('[DB] Initializing Prisma Client...');
    if (process.env.TURSO_AUTH_TOKEN && process.env.DATABASE_URL) {
        console.log('[DB] Using Turso/LibSQL adapter');
        try {
            const libsql = createClient({
                url: process.env.DATABASE_URL,
                authToken: process.env.TURSO_AUTH_TOKEN,
            })
            const adapter = new PrismaLibSql(libsql)
            return new PrismaClient({ adapter })
        } catch (error) {
            console.error('[DB] Failed to initialize Turso adapter:', error);
            return new PrismaClient()
        }
    }
    console.log('[DB] Using default Prisma Client (SQLite)');
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
