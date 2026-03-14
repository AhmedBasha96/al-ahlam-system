const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const w = await prisma.warehouse.findFirst();
    console.log(w ? w.id : "NO_WAREHOUSES");
}
main().catch(console.error).finally(() => prisma.$disconnect());
