import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    console.log('[DB] Using local SQLite database (./dev.db)');
    return new PrismaClient();
};

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
