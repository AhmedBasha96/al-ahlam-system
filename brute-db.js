
const { PrismaClient } = require('@prisma/client');

async function testConnection(url) {
    const prisma = new PrismaClient({
        datasources: { db: { url } }
    });
    try {
        await prisma.$connect();
        console.log(`SUCCESS: ${url}`);
        return true;
    } catch (e) {
        console.log(`FAILED: ${url} - ${e.code}`);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    const passwords = ['', 'password', 'root', '1234', '123456', '12345678', 'admin'];
    const users = ['root'];

    for (const user of users) {
        for (const pwd of passwords) {
            const url = `mysql://${user}:${pwd}@localhost:3306/al_ahlam_db`;
            if (await testConnection(url)) {
                process.exit(0);
            }
        }
    }
}

main();
