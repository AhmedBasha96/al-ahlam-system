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

    // TRIM values to avoid whitespace issues
    url = url?.trim();
    authToken = authToken?.trim();

    console.log(`[DB] Env Check: URL=${url ? `${url.substring(0, 10)}...` : 'MISSING'}, Token=${authToken ? 'PRESENT' : 'MISSING'}`);

    // TRICK: Set DATABASE_URL to a valid local file path.
    // This satisfies Prisma's internal engine validation which expects a valid URL for the 'sqlite' provider.
    // If the adapter is working, it will intercept the queries and use Turso.
    // If we passed the LibSQL url here directly without adapter, it might fail validation if 'previewFeatures' aren't picked up.
    process.env.DATABASE_URL = "file:./dev.db";

    const isLibsql = typeof url === 'string' && (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('wss://'));

    if (isLibsql && authToken) {
        console.log('[DB] Found Turso config. Initializing adapter...');

        const libsql = createClient({ url: url!, authToken: authToken! })
        const adapter = new PrismaLibSQL(libsql as any)

        // Pass BOTH the adapter AND the explicit datasourceUrl
        // This 'file:' URL satisfies the engine validation, but the adapter INTERCEPTS the query.
        return new PrismaClient({
            adapter,
            datasourceUrl: "file:./dev.db"
        })
    }

    // Explicitly THROW to see what's wrong in the UI
    const debugInfo = `URL: '${url}' (${typeof url}), Token: '${authToken ? 'HIDDEN' : 'MISSING'}'`
    throw new Error(`DB Config Missing. ${debugInfo}. EnvDB: ${process.env.DATABASE_URL}, EnvTurso: ${process.env.TURSO_DB_URL}`)
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
