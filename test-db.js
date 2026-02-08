
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('Testing connection to:', process.env.DATABASE_URL.split('@')[1]);
    try {
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Successfully connected to database!');
        console.log('Found users:', users.length);
    } catch (error) {
        console.error('Failed to connect to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
