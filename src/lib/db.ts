import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    // HARDCODED CREDENTIALS (TURSO)
    // We are keeping these hardcoded for now to eliminate Vercel Env Var issues entirely.
    const url = "libsql://ahmed-ahmedbasha96.aws-ap-northeast-1.turso.io";
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0NzQyNDgsImlkIjoiNjA3MmVjYzEtZmMzNS00ZDU2LWI3ZWEtYjYwMzc3MGNlM2U3IiwicmlkIjoiOGNkMjQ1MGUtZmI0Yy00MDcwLWE0MWUtYmJlZWJkNDg3ZWI3In0.x1vlueR05-q3ErHnBy9wN9sNqfxwDJ39ew0SJbw2EASsosAGPlCGcWCOmOUXSRz7HL8CkqU0EBiZeIZBHxiaDA";

    console.log('[DB] Found Turso config. Initializing adapter...');

    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSQL(libsql as any)

    // We do NOT need to pass datasources URL here because it is defined in schema.prisma as "file:./dev.db"
    // The adapter will automatically intercept the connection.
    return new PrismaClient({ adapter })
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
