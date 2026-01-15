import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    const url = process.env.DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    console.log(`[DB] Env Check: URL=${url ? `${url.substring(0, 15)}...` : 'MISSING'}, Token=${authToken ? 'PRESENT' : 'MISSING'}`);

    const isLibsql = typeof url === 'string' && (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('wss://'));

    if (isLibsql && authToken) {
        console.log('[DB] Valid Turso config found. Initializing adapter...');
        try {
            const libsql = createClient({ url: url!, authToken: authToken! })
            const adapter = new PrismaLibSQL(libsql as any)
            return new PrismaClient({ adapter })
        } catch (error: any) {
            console.error(`[DB] Error during Turso initialization: ${error.message}`);
            // Fallback to avoid complete crash
            return new PrismaClient()
        }
    }

    if (url?.startsWith('eyJ')) {
        console.error('[DB] Error: DATABASE_URL seems to contain an Auth Token instead of a URL. Please check Vercel settings.');
    }

    console.log('[DB] Falling back to default Prisma Client (SQLite)');
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
