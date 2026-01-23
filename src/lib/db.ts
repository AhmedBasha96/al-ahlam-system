import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    const url = process.env.DATABASE_URL || '';
    const protocol = url.split(':')[0] || 'unknown';
    console.log(`[DB] Connecting to ${protocol} database...`);
    return new PrismaClient();
};

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
