import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

console.log("DB URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
})

async function main() {
    console.log('🌱 Starting database seeding...')

    try {
        // First, test connection
        console.log('Testing database connection...')
        await prisma.$connect()
        console.log('✅ Connected to database')

        // Hash password
        console.log('Hashing password...')
        const hashedPassword = await bcrypt.hash('Ahmed3300@@', 10)
        console.log(`Password hash: ${hashedPassword.substring(0, 30)}...`)

        // Create or update default user
        console.log('Creating default user "ahmed"...')

        const user = await prisma.user.upsert({
            where: { username: 'ahmed' },
            update: {
                id: 'admin-id', // Enforce fixed ID
                password: hashedPassword,
                role: 'ADMIN'
            },
            create: {
                id: 'admin-id', // Enforce fixed ID
                username: 'ahmed',
                password: hashedPassword,
                name: 'Ahmed',
                role: 'ADMIN'
            }
        })

        console.log('✅ Default user created/updated:')
        console.log(`   Username: ${user.username}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Created: ${user.createdAt}`)

        // Create default agency (for reports + user links)
        const agency = await prisma.agency.upsert({
            where: { id: 'agency-id' },
            update: {},
            create: {
                id: 'agency-id',
                name: 'فرع الاحلام الرئيسي',
                address: 'Main branch',
                phone: '+201234567890'
            }
        });

        // Create default warehouse linked to agency
        const warehouse = await prisma.warehouse.upsert({
            where: { id: 'warehouse-id' },
            update: {},
            create: {
                id: 'warehouse-id',
                name: 'المخزن الرئيسي',
                agencyId: agency.id
            }
        });

        console.log('✅ Base infrastructure seeded (Admin, Agency, Warehouse)');

        // Verify by counting
        const userCount = await prisma.user.count()
        console.log(`📊 Total users in database: ${userCount}`)

    } catch (error: any) {
        console.error('❌ Seeding failed with error:')
        console.error('   Message:', error.message)
        console.error('   Stack:', error.stack)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
        console.log('🔌 Database connection closed')
    }
}

// Handle promise rejection
main()
    .catch((error) => {
        console.error('❌ Unhandled error in seeding:', error)
        process.exit(1)
    })