'use server';

import prisma from "@/lib/db";
import { Role, TransactionType, PaymentType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import bcrypt from 'bcryptjs';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordJournalEntry } from "./actions/accounts";

const g = global as any;

// Mock Authentication - Set to ADMIN for user management
// To test as sales rep, change to: { id: '3', role: 'SALES_REPRESENTATIVE' }

export async function setMockUser(id: string, role: string, agencyId?: string) {
    g.mockAuthUser = { id, role, agencyId };
    revalidatePath('/', 'layout');
}

// Debug helper
function safeStringify(obj: any) {
    try {
        const cache = new Set();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) return '[Circular]';
                cache.add(value);
            }
            return value;
        }, 2);
    } catch {
        return 'Create Error Stringify Failed';
    }
}

export async function getCurrentUser() {
    const mock = g.mockAuthUser || {
        id: 'admin-id',
        role: 'ADMIN'
    };

    const dbUser = await prisma.user.findUnique({
        where: { id: mock.id },
        include: { agencies: true, warehouses: true }
    });

    if (!dbUser) {
        return {
            id: mock.id as string,
            role: mock.role as string,
            name: 'Guest',
            agencyId: mock.agencyId as string | undefined,
            agencyIds: mock.agencyId ? [mock.agencyId] : [],
            warehouseId: undefined as string | undefined,
            warehouseIds: [] as string[]
        };
    }

    const d = dbUser as any;
    const agencyIds = d.agencies?.map((a: any) => a.id) || [];
    if (d.agencyId && !agencyIds.includes(d.agencyId)) {
        agencyIds.push(d.agencyId);
    }

    return {
        id: d.id,
        role: d.role,
        name: d.name,
        agencyId: d.agencyId || undefined,
        agencyIds: agencyIds,
        warehouseId: d.warehouses?.[0]?.id || undefined,
        warehouseIds: d.warehouses?.map((w: any) => w.id) || []
    };
}

// --- Helper Functions ---

function generateId() {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

async function fileToBase64(file: File | null): Promise<string | null> {
    if (!file || file.size === 0) return null;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        return `data:${file.type};base64,${base64}`;
    } catch (error) {
        console.error('[fileToBase64] Error converting file:', error);
        return null;
    }
}

// --- Agency Actions ---

export async function getAgencies() {
    const user = await getCurrentUser();

    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        return await prisma.agency.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    // Collect all agency IDs from both direct and many-to-many relations
    const allAgencyIds = [...(user as any).agencyIds || []];
    if (user.agencyId && !allAgencyIds.includes(user.agencyId)) {
        allAgencyIds.push(user.agencyId);
    }

    if (allAgencyIds.length === 0) return [];

    return await prisma.agency.findMany({
        where: { id: { in: allAgencyIds } },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createAgency(formData: FormData) {
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name) throw new Error('Name is required');

    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error(`Unauthorized`);

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.$transaction(async (tx) => {
        // 1. Create the Agency
        const agency = await tx.agency.create({
            data: {
                name,
                image: imageBase64,
            }
        });

        // 2. Create a default Warehouse for this agency
        const warehouse = await tx.warehouse.create({
            data: {
                name: `مخزن ${name}`,
                agencyId: agency.id
            }
        });

        // 3. Populate default 38 products (from the standard template)
        const defaultProducts = [
            { n: "مياه 600 مل (20 حبة)", b: "6221001001", f: 50, q: 20, r: 70, w: 60 },
            { n: "مياه 1.5 لتر (12 حبة)", b: "6221001002", f: 45, q: 12, r: 65, w: 55 },
            { n: "ويفر شيكولاته جنيه 4*10", b: "6221001003", f: 80, q: 40, r: 120, w: 100 },
            { n: "بسكويت سادة كبير", b: "6221001004", f: 60, q: 24, r: 90, w: 80 },
            { n: "عصير برتقال 250 مل (27 حبة)", b: "6221001005", f: 120, q: 27, r: 160, w: 140 },
            { n: "شيبسي عائلي (8 قطع)", b: "6221001006", f: 75, q: 8, r: 100, w: 90 },
            { n: "كوكا كولا 330 مل كنز (24 حبة)", b: "6221001007", f: 200, q: 24, r: 280, w: 250 },
            { n: "صلصة طماطم 300 جرام (12 حبة)", b: "6221001008", f: 150, q: 12, r: 200, w: 180 },
            { n: "تونه قطع 140 جرام (48 حبة)", b: "6221001009", f: 1200, q: 48, r: 1500, w: 1400 },
            { n: "مكرونة 400 جرام (20 كيس)", b: "6221001010", f: 180, q: 20, r: 240, w: 220 },
            { n: "ارز معبأ 1 كيلو (10 اكياس)", b: "6221001011", f: 280, q: 10, r: 350, w: 320 },
            { n: "زيت خليط 700 مل (12 زجاجة)", b: "6221001012", f: 600, q: 12, r: 750, w: 700 },
            { n: "مسلي صناعي 700 جرام (6 علب)", b: "6221001013", f: 400, q: 6, r: 500, w: 450 },
            { n: "سكر معبأ 1 كيلو (10 اكياس)", b: "6221001014", f: 300, q: 10, r: 380, w: 350 },
            { n: "لبن كامل الدسم 1 لتر (12 حبة)", b: "6221001015", f: 350, q: 12, r: 450, w: 400 },
            { n: "جبنة بيضاء 250 جرام (27 حبة)", b: "6221001016", f: 400, q: 27, r: 550, w: 500 },
            { n: "صلصة ظرف صغير (100 حبة)", b: "6221001017", f: 200, q: 100, r: 300, w: 250 },
            { n: "قهوة سريعة التحضير (20 كيس)", b: "6221001018", f: 150, q: 20, r: 200, w: 180 },
            { n: "شاي عبوة كجم (50 حبة)", b: "6221001019", f: 250, q: 50, r: 350, w: 300 },
            { n: "ملح طعام 300 جرام (50 كيس)", b: "6221001020", f: 100, q: 50, r: 150, w: 120 },
            { n: "خل ابيض 1 لتر (12 زجاجة)", b: "6221001021", f: 120, q: 12, r: 180, w: 150 },
            { n: "بسكويت ويفر كبير (12 حبة)", b: "6221001022", f: 60, q: 12, r: 90, w: 80 },
            { n: "كيك محشو شيكولاته (12 حبة)", b: "6221001023", f: 60, q: 12, r: 90, w: 80 },
            { n: "كرواسون سادة (12 حبة)", b: "6221001024", f: 72, q: 12, r: 120, w: 100 },
            { n: "سوداني مملح ظرف (30 قطعة)", b: "6221001025", f: 90, q: 30, r: 150, w: 120 },
            { n: "لبان نعناع (20 عبوة)", b: "6221001026", f: 100, q: 20, r: 140, w: 120 },
            { n: "صابون وجه 125 جرام (4 حبات)", b: "6221001027", f: 60, q: 4, r: 80, w: 70 },
            { n: "مسحوق غسيل يدوي 500 جم (24 قطعة)", b: "6221001028", f: 480, q: 24, r: 600, w: 550 },
            { n: "سائل غسيل اطباق 500 مل (12 زجاجة)", b: "6221001029", f: 180, q: 12, r: 240, w: 220 },
            { n: "كلور ابيض 1 لتر (12 زجاجة)", b: "6221001030", f: 120, q: 12, r: 180, w: 150 },
            { n: "مطهر ارضيات 1 لتر (12 زجاجة)", b: "6221001031", f: 240, q: 12, r: 360, w: 300 },
            { n: "مناديل جيب (10 عبوات)", b: "6221001032", f: 50, q: 10, r: 70, w: 60 },
            { n: "مناديل مطبخ (2 رول)", b: "6221001033", f: 40, q: 2, r: 60, w: 50 },
            { n: "سلك مواعين (12 قطعة)", b: "6221001034", f: 36, q: 12, r: 60, w: 48 },
            { n: "خميرة جافة 10 جرام (60 ظرف)", b: "6221001035", f: 180, q: 60, r: 240, w: 220 },
            { n: "بيكينج بودر 16 جرام (60 ظرف)", b: "6221001036", f: 180, q: 60, r: 240, w: 220 },
            { n: "مرقة دجاج مكعبات (24 علبه)", b: "6221001037", f: 240, q: 24, r: 360, w: 300 },
            { n: "خلطة حواوشي (20 كيس)", b: "6221001038", f: 160, q: 20, r: 220, w: 200 }
        ];

        for (const p of defaultProducts) {
            await tx.product.create({
                data: {
                    name: p.n,
                    barcode: p.b,
                    factoryPrice: p.f,
                    unitsPerCarton: p.q,
                    retailPrice: p.r,
                    wholesalePrice: p.w,
                    unitFactoryPrice: p.f / p.q,
                    unitRetailPrice: p.r / p.q,
                    unitWholesalePrice: p.w / p.q,
                    agencyId: agency.id
                }
            });
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateAgency(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name) throw new Error('Name is required');
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.agency.update({
        where: { id },
        data: {
            name,
            ...(imageBase64 ? { image: imageBase64 } : {})
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function deleteAgency(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error(`Unauthorized: Admin access required`);

    await prisma.$transaction(async (tx) => {
        // 1. Delete Stock (linked to products of this agency)
        await tx.stock.deleteMany({
            where: { product: { agencyId: id } }
        });

        // 2. Delete TransactionItems (linked to transactions of this agency)
        await tx.transactionItem.deleteMany({
            where: { transaction: { agencyId: id } }
        });

        // 3. Delete Transactions
        await tx.transaction.deleteMany({
            where: { agencyId: id }
        });

        // 4. Delete Products
        await tx.product.deleteMany({
            where: { agencyId: id }
        });

        // 5. Delete Customers
        await tx.customer.deleteMany({
            where: { agencyId: id }
        });

        // 6. Delete AccountRecords
        await tx.accountRecord.deleteMany({
            where: { agencyId: id }
        });

        // 7. Unlink Users (Set agencyId to null if this was their primary agency)
        await tx.user.updateMany({
            where: { agencyId: id },
            data: { agencyId: null }
        });

        // Also remove from UserAgencies implicit table if applicable (many-to-many)
        // Note: For many-to-many relations, disconnect is handled by deleting the Agency.

        // 8. Delete Warehouses
        await tx.warehouse.deleteMany({
            where: { agencyId: id }
        });

        // 9. Finally delete the Agency
        await tx.agency.delete({
            where: { id }
        });
    });

    revalidatePath('/dashboard', 'layout');
}

export async function resetAllData() {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.$transaction([
        prisma.transactionItem.deleteMany(),
        prisma.transaction.deleteMany(),
        prisma.stock.deleteMany(),
        prisma.product.deleteMany(),
        prisma.customer.deleteMany(),
        prisma.accountRecord.deleteMany(),
        prisma.bankTransaction.deleteMany(),
        prisma.installment.deleteMany(),
        prisma.loan.deleteMany(),
        prisma.warehouse.deleteMany(),
        prisma.user.updateMany({
            data: { agencyId: null }
        })
    ]);

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

// --- Warehouse Actions ---

export async function getWarehouses() {
    const user = await getCurrentUser();
    console.log(`[getWarehouses] Fetching for user: ${user.id}, role: ${user.role}`);

    let warehouses: any[] = [];

    // Helper: build the where clause based on user role
    async function buildWhere() {
        if (user.role === 'ADMIN' || user.role === 'MANAGER') {
            return {}; // All warehouses
        }

        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { warehouses: true, agencies: true }
        }) as any;

        if (!fullUser) return null; // No access

        if (user.role === 'WAREHOUSE_KEEPER' && fullUser.warehouses?.length > 0) {
            return { id: { in: fullUser.warehouses.map((w: any) => w.id) } };
        }

        const agencyIds = fullUser.agencies?.map((a: any) => a.id) || [];
        if (fullUser.agencyId) agencyIds.push(fullUser.agencyId);

        if (agencyIds.length > 0) {
            return { agencyId: { in: agencyIds } };
        }

        return null; // No access
    }

    try {
        const where = await buildWhere();
        if (where === null) {
            return []; // User has no warehouse access
        }

        try {
            // Primary: fetch with agency included
            warehouses = await prisma.warehouse.findMany({
                where,
                include: { agency: true },
                orderBy: { createdAt: 'desc' }
            });
        } catch (includeError) {
            console.error('[getWarehouses] Include fetch failed (data inconsistency), retrying without includes:', includeError);
            // Fallback: same role-based filter but without include (handles null agency FK)
            warehouses = await prisma.warehouse.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });
        }
    } catch (error) {
        console.error('[getWarehouses] Complete fetch failure:', error);
        return []; // Return empty array instead of crashing downstream
    }

    console.log(`[getWarehouses] Total warehouses found in DB: ${warehouses.length}`);

    // Filter out representative custody warehouses
    const filtered = warehouses.filter(w => {
        const name = String(w.name || "");
        return !name.startsWith('عهدة المندوب:');
    });

    console.log(`[getWarehouses] Returning ${filtered.length} warehouses after filtering`);
    return filtered;
}

export async function getWarehouse(id: string) {
    try {
        return await prisma.warehouse.findUnique({
            where: { id },
            include: { agency: true }
        });
    } catch (error) {
        console.error('[getWarehouse] Include failed, fetching without agency:', error);
        return await prisma.warehouse.findUnique({
            where: { id }
        });
    }
}

export async function createWarehouse(formData: FormData) {
    try {
        const name = (formData.get('name') as string)?.trim();
        const agencyId = formData.get('agencyId') as string;

        console.log(`[createWarehouse] Starting... Name: "${name}", AgencyId: ${agencyId}`);

        if (!name || !agencyId) {
            console.error('[createWarehouse] Missing name or agencyId');
            throw new Error('Name and Agency are required');
        }

        const user = await getCurrentUser();
        console.log(`[createWarehouse] User Role: ${user.role}, UserId: ${user.id}`);
        
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            console.error('[createWarehouse] Unauthorized role:', user.role);
            throw new Error('Unauthorized');
        }

        const newWarehouse = await prisma.warehouse.create({
            data: {
                name,
                agencyId,
            }
        });

        console.log(`[createWarehouse] Successfully created warehouse. ID: ${newWarehouse.id}, Name: ${newWarehouse.name}`);

        revalidatePath('/dashboard/warehouses');
        revalidatePath('/dashboard', 'layout');
        
        return { success: true, id: newWarehouse.id };
    } catch (error: any) {
        console.error('[createWarehouse] Error:', error);
        throw error;
    }
}

export async function deleteWarehouse(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error('Unauthorized: Admin access required');

    await prisma.$transaction(async (tx) => {
        // 1. Delete associated stock records
        await tx.stock.deleteMany({
            where: { warehouseId: id }
        });

        // 2. Unlink users from this warehouse (if any are keepers)
        await tx.user.updateMany({
            where: { warehouses: { some: { id } } },
            data: {
                // Since it's a many-to-many, we can't easily clear it with updateMany scalar data.
                // However, deleting the warehouse will automatically clean up the join table.
            }
        });

        // 3. Unlink transactions from this warehouse
        await tx.transaction.updateMany({
            where: { warehouseId: id },
            data: { warehouseId: null }
        });

        // 4. Finally delete the warehouse
        await tx.warehouse.delete({
            where: { id }
        });
    });

    revalidatePath('/dashboard', 'layout');
}

// --- User Actions ---

export async function getUsers() {
    const user = await getCurrentUser();

    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        return await prisma.user.findMany({
            include: { agency: true, agencies: true }
        });
    }

    // Restricted roles see users in their agencies
    return await prisma.user.findMany({
        where: { agencies: { some: { id: { in: (user as any).agencyIds } } } },
        include: { agency: true, agencies: true }
    });
}

export async function getAllUsers() {
    return await prisma.user.findMany({
        include: { agency: true }
    });
}

export async function createUser(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;
    const agencyIds = formData.getAll('agencyId') as string[];
    const name = formData.get('name') as string;
    const pricingType = formData.get('pricingType') as string;
    const warehouseIds = formData.getAll('warehouseId') as string[];
    const imageFile = formData.get('image') as File | null;

    // Permission check
    const currentUser = await getCurrentUser();
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
        throw new Error('Unauthorized: Only Admins and Managers can create users');
    }

    if (!username || !role || !password) {
        throw new Error('Username, Password, and Role are required');
    }

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.$transaction(async (tx) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await tx.user.create({
            data: {
                username,
                password: hashedPassword,
                role,
                name,
                agencyId: agencyIds.length > 0 ? agencyIds[0] : null,
                pricingType: pricingType || null,
                image: imageBase64,
                agencies: {
                    connect: agencyIds.filter(id => id !== '').map(id => ({ id }))
                },
                warehouses: role === 'WAREHOUSE_KEEPER' ? {
                    connect: warehouseIds.filter(wid => wid !== '').map(wid => ({ id: wid }))
                } : undefined
            }
        });

        // If user is a sales rep, create a virtual warehouse for them
        if (role === 'SALES_REPRESENTATIVE' && agencyIds.length > 0 && agencyIds[0] !== '') {
            await tx.warehouse.create({
                data: {
                    id: user.id,
                    name: `عهدة المندوب: ${name}`,
                    agencyId: agencyIds[0],
                }
            });
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateUser(id: string, formData: FormData) {
    // Permission check
    const currentUser = await getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can update users');
    }

    const username = formData.get('username') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as Role;
    const agencyIds = formData.getAll('agencyId') as string[];
    const pricingType = formData.get('pricingType') as string;
    const warehouseIds = formData.getAll('warehouseId') as string[];
    const imageFile = formData.get('image') as File | null;

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.user.update({
        where: { id },
        data: {
            username,
            name,
            role,
            agencyId: agencyIds.length > 0 ? agencyIds[0] : null,
            pricingType: pricingType || null,
            ...(imageBase64 ? { image: imageBase64 } : {}),
            agencies: {
                set: agencyIds.filter(id => id !== '').map(id => ({ id }))
            },
            warehouses: role === 'WAREHOUSE_KEEPER' ? {
                set: warehouseIds.filter(wid => wid !== '').map(wid => ({ id: wid }))
            } : { set: [] }
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function resetUserPassword(userId: string, formData: FormData) {
    const currentUser = await getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can reset passwords');
    }

    const newPassword = formData.get('password') as string;
    if (!newPassword) throw new Error('Password is required');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    revalidatePath('/dashboard/users');
    return { success: true };
}

export async function deleteUser(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error('Unauthorized: Admin access required');

    const userRole = user.role;

    await prisma.$transaction(async (tx) => {
        // Find if user is a rep to delete their virtual warehouse
        const user = await tx.user.findUnique({ where: { id } });

        // Delete stock and transactions first (due to FKs)
        await tx.stock.deleteMany({ where: { warehouseId: id } });

        // Delete virtual warehouse if it exists
        await tx.warehouse.deleteMany({ where: { id } });

        await tx.user.delete({ where: { id } });
    });

    revalidatePath('/dashboard', 'layout');
}

export async function toggleRepPricing(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) throw new Error('User not found');

    const newType = currentUser.pricingType === 'WHOLESALE' ? 'RETAIL' : 'WHOLESALE';

    await prisma.user.update({
        where: { id },
        data: { pricingType: newType }
    });

    revalidatePath('/dashboard', 'layout');
}

// --- Customer Actions ---

export async function getCustomers() {
    const user = await getCurrentUser();
    const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
    const isRestricted = !isAdminOrManager || user.role === 'SALES_RECORDER';

    let where: any = {};

    if (user.role === 'SALES_REPRESENTATIVE') {
        where = { representativeId: user.id };
    } else if (isRestricted) {
        where = { agencyId: { in: (user as any).agencyIds } };
    }

    const customers = await prisma.customer.findMany({
        where,
        include: {
            representative: true,
            agency: true,
            transactions: {
                select: {
                    remainingAmount: true
                }
            },
            accounts: {
                select: {
                    amount: true,
                    type: true
                }
            }
        } as any
    });

    // Calculate total debt for each customer
    return (customers as any[]).map(customer => {
        const transactionDebt = customer.transactions.reduce((sum: number, t: any) => sum + Number(t.remainingAmount || 0), 0);
        const accountDebt = customer.accounts.reduce((sum: number, acc: any) => {
            return sum + (acc.type === 'INCOME' ? Number(acc.amount) : -Number(acc.amount));
        }, 0);

        // Remove transactions and accounts to avoid serialization issues
        const { transactions, accounts, ...customerData } = customer;

        return {
            ...customerData,
            representativeIds: customer.representativeId ? [customer.representativeId] : [],
            totalDebt: transactionDebt + accountDebt
        };
    });
}

export async function getCustomerDetails(id: string) {
    if (!id) return null;
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            representative: true,
            agency: true,
            accounts: {
                orderBy: { createdAt: 'desc' }
            },
            transactions: {
                include: {
                    user: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            } as any
        }
    });

    if (!customer) return null;

    const c = customer as any;
    const transactionDebt = c.transactions.reduce((sum: number, t: any) => sum + Number(t.remainingAmount || 0), 0);
    const accountDebt = c.accounts.reduce((sum: number, acc: any) => {
        // INCOME for a customer means they owed us that money (Initial Balance or manual debit)
        // EXPENSE for a customer would mean we paid/credited them (Manual credit)
        // For simplicity: INCOME = Debt (+), EXPENSE = Credit (-)
        return sum + (acc.type === 'INCOME' ? Number(acc.amount) : -Number(acc.amount));
    }, 0);

    const mergedLedger = [
        ...c.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            createdAt: t.createdAt,
            totalAmount: Number(t.totalAmount),
            paidAmount: Number(t.paidAmount || 0),
            remainingAmount: Number(t.remainingAmount || 0),
            note: t.note,
            paymentType: t.paymentType,
            items: t.items.map((item: any) => ({
                ...item,
                price: Number(item.price),
                originalPrice: Number(item.originalPrice || item.price),
                discountPercentage: Number(item.discountPercentage || 0),
                cost: Number(item.cost || 0)
            }))
        })),
        ...c.accounts.map((acc: any) => ({
            id: acc.id,
            type: 'ACCOUNT_ADJUSTMENT',
            createdAt: acc.createdAt,
            totalAmount: acc.type === 'INCOME' ? Number(acc.amount) : 0,
            paidAmount: acc.type === 'EXPENSE' ? Number(acc.amount) : 0,
            remainingAmount: acc.type === 'INCOME' ? Number(acc.amount) : -Number(acc.amount),
            note: acc.description,
            paymentType: 'MANUAL',
            items: []
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const hasInitialBalance = (c.accounts || []).some((acc: any) => acc.category === 'رصيد بداية المدة');

    return {
        ...customer,
        totalDebt: transactionDebt + accountDebt,
        transactions: mergedLedger, // Reusing transactions name for UI compatibility
        hasInitialBalance
    };
}

export async function getRepCustomers(repId: string) {
    return await prisma.customer.findMany({
        where: { representativeId: repId },
        include: { representative: true, agency: true }
    });
}

export async function createCustomer(formData: FormData) {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const representativeIds = formData.getAll('representativeIds') as string[];
    const agencyId = formData.get('agencyId') as string;

    if (!name || representativeIds.length === 0 || !agencyId) throw new Error('Name, Representative, and Agency are required');

    const representativeId = representativeIds[0];

    await prisma.customer.create({
        data: {
            name,
            phone,
            address,
            representativeId,
            agencyId
        }
    });
    revalidatePath('/dashboard', 'layout');
}

export async function updateCustomer(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const representativeIds = formData.getAll('representativeIds') as string[];

    const representativeId = representativeIds[0];

    await prisma.customer.update({
        where: { id },
        data: {
            name,
            phone,
            address,
            representativeId
        }
    });
    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard', 'layout');
}

export async function deleteCustomer(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error(`Unauthorized: Admin access required`);

    await prisma.customer.delete({ where: { id } });
    revalidatePath('/dashboard/customers');
}

export async function deleteTransaction(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error(`Unauthorized: Admin access required`);

    // We use a transaction to ensure all related records are cleaned up or the deletion fails
    await prisma.$transaction(async (tx) => {
        // 0. Fetch transaction with items to revert stock
        const transaction = await tx.transaction.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!transaction) throw new Error("Transaction not found");

        // Revert Stock Changes
        for (const item of transaction.items) {
            if (transaction.type === 'SALE') {
                // Check if it was a Load to Rep (Transfer)
                if (transaction.warehouseId && transaction.note?.includes('تحميل للمندوب')) {
                    // Source Warehouse was decremented, Target Rep was incremented
                    // REVERT: Source Warehouse +, Target Rep -
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId: transaction.warehouseId, productId: item.productId } },
                        create: { warehouseId: transaction.warehouseId, productId: item.productId, quantity: item.quantity },
                        update: { quantity: { increment: item.quantity } }
                    });
                    // For decrement, we must ensure we don't go negative if possible, but for revert we just do it
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId: transaction.userId, productId: item.productId } },
                        create: { warehouseId: transaction.userId, productId: item.productId, quantity: -item.quantity },
                        update: { quantity: { decrement: item.quantity } }
                    });
                } else {
                    // Direct Sale: Rep was decremented
                    // REVERT: Rep +
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId: transaction.userId, productId: item.productId } },
                        create: { warehouseId: transaction.userId, productId: item.productId, quantity: item.quantity },
                        update: { quantity: { increment: item.quantity } }
                    });
                }
            } else if (transaction.type === 'PURCHASE') {
                // Supply: Warehouse was incremented
                // REVERT: Warehouse -
                if (transaction.warehouseId) {
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId: transaction.warehouseId, productId: item.productId } },
                        create: { warehouseId: transaction.warehouseId, productId: item.productId, quantity: -item.quantity },
                        update: { quantity: { decrement: item.quantity } }
                    });
                }
            } else if (transaction.type === 'RETURN_OUT') {
                // Return to Supplier -> REVERT: Warehouse +
                if (transaction.warehouseId) {
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId: transaction.warehouseId, productId: item.productId } },
                        create: { warehouseId: transaction.warehouseId, productId: item.productId, quantity: item.quantity },
                        update: { quantity: { increment: item.quantity } }
                    });
                }
            } else if (transaction.type === 'RETURN_IN') {
                // Return from Customer: Rep was incremented -> REVERT: Rep -
                await tx.stock.upsert({
                    where: { warehouseId_productId: { warehouseId: transaction.userId, productId: item.productId } },
                    create: { warehouseId: transaction.userId, productId: item.productId, quantity: -item.quantity },
                    update: { quantity: { decrement: item.quantity } }
                });
            }
        }

        // 1. Delete associated journal entries
        await tx.journalEntry.deleteMany({
            where: { referenceId: id }
        });

        // 2. Delete transaction items
        await tx.transactionItem.deleteMany({
            where: { transactionId: id }
        });

        // 3. Delete the transaction itself
        await tx.transaction.delete({
            where: { id }
        });
    });

    revalidatePath('/dashboard/reports/sales');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/accounts/treasury');
}

// --- Product Actions ---

export async function getProducts() {
    const user = await getCurrentUser();
    let products: any[] = [];

    try {
        if (user.role === 'ADMIN' || user.role === 'MANAGER') {
            products = await (prisma as any).product.findMany({
                include: { agency: true, supplier: true, stocks: true },
                orderBy: { name: 'asc' }
            });
        } else {
            products = await (prisma as any).product.findMany({
                where: { agencyId: user.agencyId },
                include: { agency: true, supplier: true, stocks: true },
                orderBy: { name: 'asc' }
            });
        }
    } catch (error) {
        console.error('[getProducts] Fetch failed with includes, falling back:', error);
        // Fallback: fetch without potentially broken relations
        products = await (prisma as any).product.findMany({
            orderBy: { name: 'asc' }
        });
    }

    return products;
}

export async function getProductsWithStock(warehouseId: string) {
    const warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId }
    });

    if (!warehouse) return [];

    const products = await prisma.product.findMany({
        where: { agencyId: warehouse.agencyId },
        include: {
            stocks: {
                where: { warehouseId }
            }
        }
    });

    return products.map(p => ({
        ...p,
        stock: p.stocks[0]?.quantity || 0,
        factoryPrice: Number(p.factoryPrice),
        wholesalePrice: Number(p.wholesalePrice),
        retailPrice: Number(p.retailPrice)
    }));
}

export async function createProduct(formData: FormData) {
    try {
        console.log('[createProduct] Starting product creation...');
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const barcode = formData.get('barcode') as string;
        const factoryPrice = Number(formData.get('factoryPrice'));
        const wholesalePrice = Number(formData.get('wholesalePrice'));
        const retailPrice = Number(formData.get('retailPrice'));
        const agencyId = formData.get('agencyId') as string;
        const supplierId = formData.get('supplierId') as string;
        const imageFile = formData.get('image') as File | null;

        if (!name || !agencyId || !supplierId) throw new Error('الاسم والتوكيل والمورد حقول مطلوبة');

        console.log(`[createProduct] Validating supplier ${supplierId} for agency ${agencyId}`);
        // Validate supplier-agency hierarchy
        const supplier = await (prisma as any).supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier || supplier.agencyId !== agencyId) {
            throw new Error('المورد المختار لا ينتمي إلى التوكيل المحدد');
        }

        const imageBase64 = await fileToBase64(imageFile);
        const unitsPerCarton = Number(formData.get('unitsPerCarton')) || 1;
        const unitFactoryPrice = Number(formData.get('unitFactoryPrice')) || 0;
        const unitWholesalePrice = Number(formData.get('unitWholesalePrice')) || 0;
        const unitRetailPrice = Number(formData.get('unitRetailPrice')) || 0;
        const wholesaleDiscount = Number(formData.get('wholesaleDiscount')) || 0;
        const retailDiscount = Number(formData.get('retailDiscount')) || 0;

        console.log('[createProduct] Creating product in database...');
        const product = await (prisma as any).product.create({
            data: {
                name,
                description,
                barcode: barcode || undefined,
                factoryPrice: new Decimal(factoryPrice),
                wholesalePrice: new Decimal(wholesalePrice),
                retailPrice: new Decimal(retailPrice),
                agencyId,
                supplierId,
                image: imageBase64,
                unitsPerCarton,
                unitFactoryPrice: new Decimal(unitFactoryPrice),
                unitWholesalePrice: new Decimal(unitWholesalePrice),
                unitRetailPrice: new Decimal(unitRetailPrice),
                wholesaleDiscount: new Decimal(wholesaleDiscount),
                retailDiscount: new Decimal(retailDiscount),
            } as any
        });

        console.log(`[createProduct] Product created successfully: ${product.id}`);
        revalidatePath('/dashboard', 'layout');
    } catch (error) {
        console.error('[createProduct] Fatal Error:', error);
        throw error;
    }
}

export async function updateProduct(id: string, formData: FormData) {
    try {
        console.log(`[updateProduct] Starting update for product ${id}...`);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const barcode = formData.get('barcode') as string;
        const factoryPrice = Number(formData.get('factoryPrice'));
        const wholesalePrice = Number(formData.get('wholesalePrice'));
        const retailPrice = Number(formData.get('retailPrice'));
        const agencyId = formData.get('agencyId') as string;
        const supplierId = formData.get('supplierId') as string;
        const imageFile = formData.get('image') as File | null;

        if (!name || !agencyId || !supplierId) throw new Error('الاسم والتوكيل والمورد حقول مطلوبة');

        console.log(`[updateProduct] Validating supplier ${supplierId} for agency ${agencyId}`);
        // Validate supplier-agency hierarchy
        const supplier = await (prisma as any).supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier || supplier.agencyId !== agencyId) {
            throw new Error('المورد المختار لا ينتمي إلى التوكيل المحدد');
        }

        const imageBase64 = await fileToBase64(imageFile);
        const unitsPerCarton = Number(formData.get('unitsPerCarton')) || 1;
        const unitFactoryPrice = Number(formData.get('unitFactoryPrice')) || 0;
        const unitWholesalePrice = Number(formData.get('unitWholesalePrice')) || 0;
        const unitRetailPrice = Number(formData.get('unitRetailPrice')) || 0;
        const wholesaleDiscount = Number(formData.get('wholesaleDiscount')) || 0;
        const retailDiscount = Number(formData.get('retailDiscount')) || 0;

        console.log('[updateProduct] Updating product in database...');
        await (prisma as any).product.update({
            where: { id },
            data: {
                name,
                description,
                barcode: barcode || null,
                factoryPrice: new Decimal(factoryPrice),
                wholesalePrice: new Decimal(wholesalePrice),
                retailPrice: new Decimal(retailPrice),
                agencyId,
                supplierId,
                unitsPerCarton,
                unitFactoryPrice: new Decimal(unitFactoryPrice),
                unitWholesalePrice: new Decimal(unitWholesalePrice),
                unitRetailPrice: new Decimal(unitRetailPrice),
                wholesaleDiscount: new Decimal(wholesaleDiscount),
                retailDiscount: new Decimal(retailDiscount),
                ...(imageBase64 ? { image: imageBase64 } : {})
            } as any
        });

        console.log(`[updateProduct] Product ${id} updated successfully`);
        revalidatePath('/dashboard', 'layout');
    } catch (error) {
        console.error('[updateProduct] Fatal Error:', error);
        throw error;
    }
}

export async function deleteProduct(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error('Unauthorized: Admin access required');

    await prisma.product.delete({ where: { id } });
    revalidatePath('/dashboard', 'layout');
}

// --- Stock Actions ---

export async function getStocks() {
    return await prisma.stock.findMany({
        include: { product: true, warehouse: true }
    });
}

export async function updateStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    note?: string,
    factoryPrice?: number,
    updateBasePrice?: boolean,
    wholesalePrice?: number,
    retailPrice?: number
) {
    const existingStock = await prisma.stock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } }
    });

    const previousQuantity = existingStock?.quantity || 0;
    const quantityChange = quantity - previousQuantity;

    // Get warehouse and user info for transaction logging
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    const currentUser = await getCurrentUser();

    await prisma.$transaction(async (tx) => {
        // Update stock
        await tx.stock.upsert({
            where: { warehouseId_productId: { warehouseId, productId } },
            update: { quantity },
            create: { warehouseId, productId, quantity }
        });

        // Update product prices if requested
        if (updateBasePrice) {
            await tx.product.update({
                where: { id: productId },
                data: {
                    factoryPrice: factoryPrice,
                    wholesalePrice: wholesalePrice,
                    retailPrice: retailPrice,
                }
            });
        }

        // Log transaction if there's a quantity change
        if (quantityChange !== 0 && warehouse?.agencyId) {
            const transactionType = quantityChange > 0 ? 'PURCHASE' : 'SALE';
            const absChange = Math.abs(quantityChange);

            await tx.transaction.create({
                data: {
                    type: transactionType,
                    totalAmount: factoryPrice ? absChange * factoryPrice : 0,
                    userId: currentUser.id,
                    agencyId: warehouse.agencyId,
                    warehouseId: warehouseId,
                    note: note || (quantityChange > 0 ? `زيادة مخزون: +${absChange}` : `نقص مخزون: -${absChange}`),
                    items: {
                        create: [{
                            productId: productId,
                            quantity: absChange,
                            price: factoryPrice || 0,
                            cost: factoryPrice || 0
                        }]
                    }
                }
            });
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function supplyStock(
    warehouseId: string,
    productId: string,
    addedQuantity: number,
    factoryPrice?: number,
    updateBasePrice?: boolean,
    wholesalePrice?: number,
    retailPrice?: number
) {
    if (addedQuantity <= 0) throw new Error("Quantity must be greater than zero");

    const currentStockRecord = await prisma.stock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } }
    });
    const currentStock = currentStockRecord?.quantity || 0;
    const newQuantity = currentStock + addedQuantity;

    const note = `توريد كمية جديدة: +${addedQuantity}`;

    await updateStock(
        warehouseId,
        productId,
        newQuantity,
        note,
        factoryPrice,
        updateBasePrice,
        wholesalePrice,
        retailPrice
    );
}

export async function getTransactions(warehouseId: string) {
    return await prisma.transaction.findMany({
        where: { warehouseId },
        include: {
            items: { include: { product: true } },
            user: true,
            customer: true,
            supplier: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function performWarehouseAudit(
    warehouseId: string,
    auditData: { productId: string, actualQuantity: number }[]
) {
    try {
        await prisma.$transaction(async (tx) => {
            for (const data of auditData) {
                await tx.stock.upsert({
                    where: { warehouseId_productId: { warehouseId, productId: data.productId } },
                    update: { quantity: data.actualQuantity },
                    create: { warehouseId, productId: data.productId, quantity: data.actualQuantity }
                });
            }
        });
        revalidatePath('/dashboard/warehouses/[id]', 'page');
        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// --- Sales Representative Actions ---

export async function getRepStocks(repId: string) {
    return await prisma.stock.findMany({
        where: { warehouseId: repId },
        include: { product: true }
    });
}

export async function getAllRepStocks() {
    // Get all sales representative IDs
    const reps = await prisma.user.findMany({
        where: { role: 'SALES_REPRESENTATIVE' },
        select: { id: true }
    });

    const repIds = reps.map(r => r.id);

    // Get stock records where warehouseId is a rep ID
    return await prisma.stock.findMany({
        where: { warehouseId: { in: repIds } },
        include: { product: true }
    });
}

export async function loadStockToRep(data: FormData) {
    const repId = data.get('repId') as string;
    const warehouseId = data.get('warehouseId') as string;
    const itemsJson = data.get('items') as string;

    if (!repId || !warehouseId || !itemsJson) throw new Error("Invalid Data");

    // Expecting items to have { productId: string, cartons: number, units: number, quantity: number (total) }
    let items: { productId: string; cartons?: number; units?: number; quantity: number }[] = JSON.parse(itemsJson);
    if (items.length === 0) throw new Error("No items to load");

    const rep = await prisma.user.findUnique({ where: { id: repId } });
    if (!rep) throw new Error("Representative not found");
    if (!rep.agencyId) throw new Error("Representative is not assigned to an agency");

    await prisma.$transaction(async (tx) => {
        let grandTotal = 0;
        const transactionItems = [];

        for (const item of items) {
            if (item.quantity <= 0) continue;

            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) throw new Error(`Product not found: ${item.productId}`);

            // 1. Check if source stock exists and has enough quantity
            const sourceStock = await tx.stock.findUnique({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } }
            });

            if (!sourceStock || sourceStock.quantity < item.quantity) {
                throw new Error(`الرصيد غير كافٍ للصنف: ${product.name}`);
            }

            // 2. Decrement from source warehouse
            await tx.stock.update({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                data: { quantity: { decrement: item.quantity } }
            });

            // 3. Increment for representative
            await tx.stock.upsert({
                where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                update: { quantity: { increment: item.quantity } },
                create: { warehouseId: repId, productId: item.productId, quantity: item.quantity }
            });

            // Determine pricing based on rep type
            const pricing = rep.pricingType === 'WHOLESALE'
                ? { carton: Number(product.wholesalePrice), unit: Number(product.unitWholesalePrice) }
                : { carton: Number(product.retailPrice), unit: Number(product.unitRetailPrice) };

            // Calculate cost for this line item based on units and cartons
            const cartons = item.cartons || 0;
            const units = item.units || 0;

            const itemTotalValue = (cartons * pricing.carton) + (units * pricing.unit);
            grandTotal += itemTotalValue;

            // Store the effective unit price in the transaction item
            // Since quantity is in units, price MUST be unit price for (qty * price) to be correct
            const effectiveUnitPrice = item.quantity > 0 ? (itemTotalValue / item.quantity) : 0;

            transactionItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: effectiveUnitPrice,
                cost: Number(product.unitFactoryPrice || 0)
            });
        }

        // 4. Record Transaction with real calculated total
        await tx.transaction.create({
            data: {
                type: 'SALE', // Warehouse deduction
                totalAmount: grandTotal,
                userId: repId,
                agencyId: rep.agencyId!,
                warehouseId: warehouseId,
                note: `تحميل للمندوب: ${rep.name}`,
                items: {
                    create: transactionItems
                }
            }
        });
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateRepStock(repId: string, productId: string, actualQuantity: number) {
    await prisma.stock.upsert({
        where: { warehouseId_productId: { warehouseId: repId, productId } },
        update: { quantity: actualQuantity },
        create: { warehouseId: repId, productId, quantity: actualQuantity }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function finalizeRepAudit(
    repId: string,
    warehouseId: string,
    auditItems: { productId: string, actualQuantity: number }[],
    paymentInfo: { type: 'CASH' | 'CREDIT' | 'PARTIAL', paidAmount?: number },
    remainingStockAction: 'RETURN' | 'KEEP' = 'RETURN'
) {
    try {
        const user = await prisma.user.findUnique({ where: { id: repId } });
        if (!user) throw new Error("Rep not found");

        const result = await prisma.$transaction(async (tx) => {
            const soldItems: any[] = [];
            const repStocks = await tx.stock.findMany({ where: { warehouseId: repId } });

            const returnedItems: any[] = [];
            for (const item of auditItems) {
                const currentQty = repStocks.find(s => s.productId === item.productId)?.quantity || 0;
                const soldQty = currentQty - item.actualQuantity;

                if (soldQty > 0) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } }) as any;
                    if (!product) continue;

                    const upc = Number(product.unitsPerCarton) || 1;
                    const discountPercent = user.pricingType === 'WHOLESALE' ? Number(product.wholesaleDiscount || 0) : Number(product.retailDiscount || 0);
                    const discountFactor = 1 - (discountPercent / 100);

                    const pricing = user.pricingType === 'WHOLESALE'
                        ? { carton: Number(product.wholesalePrice) * discountFactor, unit: Number(product.unitWholesalePrice) * discountFactor }
                        : { carton: Number(product.retailPrice) * discountFactor, unit: Number(product.unitRetailPrice) * discountFactor };

                    const originalPricing = user.pricingType === 'WHOLESALE'
                        ? { carton: Number(product.wholesalePrice), unit: Number(product.unitWholesalePrice) }
                        : { carton: Number(product.retailPrice), unit: Number(product.unitRetailPrice) };

                    // Calculate sold value: full cartons first, then pieces
                    const soldCartons = Math.floor(soldQty / upc);
                    const soldUnitsRemaining = soldQty % upc;
                    const totalSoldRowValue = (soldCartons * pricing.carton) + (soldUnitsRemaining * pricing.unit);
                    const totalOriginalRowValue = (soldCartons * originalPricing.carton) + (soldUnitsRemaining * originalPricing.unit);

                    // Store effective unit prices
                    const effectiveUnitPrice = soldQty > 0 ? (totalSoldRowValue / soldQty) : 0;
                    const originalUnitPrice = soldQty > 0 ? (totalOriginalRowValue / soldQty) : 0;

                    soldItems.push({
                        productId: item.productId,
                        productName: product.name || "منتج غير معروف",
                        quantity: soldQty,
                        price: effectiveUnitPrice,
                        originalPrice: originalUnitPrice,
                        discountPercentage: discountPercent,
                        total: totalSoldRowValue
                    });

                    await tx.stock.update({
                        where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                        data: { quantity: { decrement: soldQty } }
                    });
                }

                if (item.actualQuantity > 0 && remainingStockAction === 'RETURN') {
                    returnedItems.push({
                        productId: item.productId,
                        quantity: item.actualQuantity
                    });

                    // Upsert to Warehouse (Target)
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                        update: { quantity: { increment: item.actualQuantity } },
                        create: { warehouseId, productId: item.productId, quantity: item.actualQuantity }
                    });

                    // Update Rep Stock (Source) - Only if record exists (currentQty > 0)
                    if (currentQty > 0) {
                        await tx.stock.update({
                            where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                            data: { quantity: 0 }
                        });
                    }
                } else if (item.actualQuantity === 0) {
                    // Only update if record actually exists
                    if (currentQty > 0) {
                        await tx.stock.update({
                            where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                            data: { quantity: 0 }
                        });
                    }
                }
            }

            // Log returned items as a transaction for the warehouse
            if (returnedItems.length > 0) {
                await tx.transaction.create({
                    data: {
                        type: 'PURCHASE', // Increase warehouse stock
                        totalAmount: 0,
                        userId: repId,
                        agencyId: user.agencyId!,
                        warehouseId: warehouseId,
                        note: `مرتجع عهدة من المندوب: ${user.name}`,
                        items: {
                            create: returnedItems.map(ri => ({
                                productId: ri.productId,
                                quantity: ri.quantity,
                                price: 0
                            }))
                        }
                    }
                });
            }

            if (soldItems.length > 0) {
                const totalAmount = soldItems.reduce((sum, item) => sum + item.total, 0);
                const transaction = await tx.transaction.create({
                    data: {
                        type: 'SALE',
                        totalAmount,
                        userId: repId,
                        agencyId: user.agencyId!,
                        paymentType: paymentInfo.type,
                        paidAmount: paymentInfo.paidAmount || 0,
                        remainingAmount: totalAmount - (paymentInfo.paidAmount || 0),
                        items: {
                            create: await Promise.all(soldItems.map(async si => {
                                const prod = await tx.product.findUnique({ where: { id: si.productId } });
                                return {
                                    productId: si.productId,
                                    quantity: si.quantity,
                                    price: si.price,
                                    originalPrice: si.originalPrice || si.price,
                                    discountPercentage: si.discountPercentage || 0,
                                    cost: si.sellUnit === 'CARTON' ? (Number(prod?.factoryPrice || 0) / (Number(prod?.unitsPerCarton) || 1)) : (prod?.unitFactoryPrice || 0)
                                };
                            }))
                        }
                    }
                });

                // Record Journal Entry (Removed: Cash stays in rep custody until manual submission)
                /*
                if ((paymentInfo.paidAmount || 0) > 0) {
                    await recordJournalEntry(tx, {
                        amount: Number(paymentInfo.paidAmount),
                        type: 'DEBIT',
                        description: `مبيعات نقدية (عن طريق المندوب ${user.name})`,
                        referenceId: transaction.id,
                        referenceType: 'SALE',
                        agencyId: user.agencyId,
                        userId: repId
                    });
                }
                */

                return { sessionId: transaction.id, soldItems: soldItems };
            }
            return { sessionId: null, soldItems: [] };
        });

        revalidatePath('/dashboard', 'layout');
        return {
            success: true,
            sessionId: result.sessionId,
            soldItems: result.soldItems
        };
    } catch (error) {
        console.error("finalizeRepAudit error:", error);
        return { success: false, error: String(error) };
    }
}

export async function recordSalesSession(
    repId: string,
    repName: string,
    items: { productId: string, quantity: number, price: number, originalPrice?: number, discountPercentage?: number }[],
    customerData?: { id: string, name: string },
    paymentInfo?: { type: 'CASH' | 'CREDIT' | 'PARTIAL', paidAmount?: number }
) {
    try {
        const user = await prisma.user.findUnique({ where: { id: repId } });
        if (!user) throw new Error("Rep not found");

        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

        const transaction = await prisma.transaction.create({
            data: {
                type: 'SALE',
                totalAmount,
                userId: repId,
                agencyId: user.agencyId!,
                customerId: customerData?.id,
                paymentType: paymentInfo?.type || 'CASH',
                paidAmount: (paymentInfo?.type === 'CASH' ? totalAmount : (paymentInfo?.type === 'CREDIT' ? 0 : (paymentInfo?.paidAmount || 0))),
                remainingAmount: (paymentInfo?.type === 'CASH' ? 0 : (paymentInfo?.type === 'CREDIT' ? totalAmount : (totalAmount - (paymentInfo?.paidAmount || 0)))),
                items: {
                    create: await Promise.all(items.map(async item => {
                        const product = await prisma.product.findUnique({ where: { id: item.productId } });
                        const upc = Number(product?.unitsPerCarton) || 1;
                        const isCarton = (item as any).sellUnit === 'CARTON';
                        return {
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price || 0,
                            originalPrice: item.originalPrice || item.price || 0,
                            discountPercentage: item.discountPercentage || 0,
                            cost: isCarton ? (Number(product?.factoryPrice || 0) / upc) : (product?.unitFactoryPrice || 0),
                            sellUnit: (item as any).sellUnit || 'PIECE',
                            unitQuantity: (item as any).unitQuantity || item.quantity
                        };
                    }))
                }
            }
        });

        revalidatePath('/dashboard/reports/sales');
        revalidatePath('/dashboard', 'layout');

        // 3. Record Journal Entry if cash was paid
        if (transaction.paidAmount && Number(transaction.paidAmount) > 0) {
            await recordJournalEntry(prisma, {
                amount: Number(transaction.paidAmount),
                type: 'DEBIT',
                description: `مبيعات نقدية (عن طريق المندوب ${repName})`,
                referenceId: transaction.id,
                referenceType: 'SALE',
                agencyId: user.agencyId,
                userId: repId
            });
        }

        return { success: true, sessionId: transaction.id };
    } catch (error) {
        console.error("recordSalesSession error:", error);
        return { success: false, error: String(error) };
    }
}

export async function recordDirectSale(
    repId: string,
    customerId: string,
    items: { productId: string, quantity: number, price: number, originalPrice?: number, discountPercentage?: number }[],
    paymentInfo: { type: 'CASH' | 'CREDIT' | 'PARTIAL', paidAmount?: number, status?: 'ACTIVE' | 'PENDING', invoiceDiscount?: number }
) {
    try {
        const user = await prisma.user.findUnique({ where: { id: repId } });
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!user || !customer) throw new Error("Invalid Rep or Customer");

        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct Stock from Rep
            for (const item of items) {
                await tx.stock.update({
                    where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                    data: { quantity: { decrement: item.quantity } }
                });
            }

            // 2. Record Session/Transaction
            const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const globalDiscount = paymentInfo.invoiceDiscount || 0;
            const totalAmount = subtotal - (subtotal * (globalDiscount / 100));

            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE',
                    totalAmount,
                    userId: repId,
                    agencyId: user.agencyId!,
                    customerId: customerId,
                    paymentType: paymentInfo.type,
                    paidAmount: (paymentInfo.type === 'CASH' ? totalAmount : (paymentInfo.type === 'CREDIT' ? 0 : (paymentInfo.paidAmount || 0))),
                    remainingAmount: (paymentInfo.type === 'CASH' ? 0 : (paymentInfo.type === 'CREDIT' ? totalAmount : (totalAmount - (paymentInfo.paidAmount || 0)))),
                    status: paymentInfo.status || 'ACTIVE',
                    note: globalDiscount > 0 ? `طلب خصم إضافي: ${globalDiscount}% بانتظار الموافقة (الإجمالي قبل الخصم: ${subtotal.toLocaleString()})` : undefined,
                    items: {
                        create: await Promise.all(items.map(async item => {
                            const product = await prisma.product.findUnique({ where: { id: item.productId } });
                            const upc = Number(product?.unitsPerCarton) || 1;
                            const isCarton = (item as any).sellUnit === 'CARTON';
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                originalPrice: item.originalPrice || item.price,
                                discountPercentage: item.discountPercentage || 0,
                                cost: isCarton ? (Number(product?.factoryPrice || 0) / upc) : (product?.unitFactoryPrice || 0),
                                sellUnit: (item as any).sellUnit || 'PIECE',
                                unitQuantity: (item as any).unitQuantity || item.quantity
                            };
                        }))
                    }
                }
            });
            // 3. Record Journal Entry if cash was paid
            if (transaction.paidAmount && Number(transaction.paidAmount) > 0) {
                await recordJournalEntry(tx, {
                    amount: Number(transaction.paidAmount),
                    type: 'DEBIT',
                    description: `مبيعات نقدية مباشرة (المندوب: ${user.name})`,
                    referenceId: transaction.id,
                    referenceType: 'SALE',
                    agencyId: user.agencyId,
                    userId: repId
                });
            }

            return { sessionId: transaction.id };
        });

        revalidatePath('/dashboard', 'layout');
        return { success: true, sessionId: result.sessionId };
    } catch (error) {
        console.error("recordDirectSale error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getSalesSessions(filters?: { repId?: string; startDate?: string; endDate?: string }) {
    const user = await getCurrentUser();

    const transactions = await prisma.transaction.findMany({
        where: {
            type: 'SALE',
            userId: user.role === 'SALES_REPRESENTATIVE' ? user.id : (filters?.repId && filters.repId !== "" ? filters.repId : undefined),
            createdAt: {
                gte: filters?.startDate && filters.startDate !== "" ? new Date(filters.startDate) : undefined,
                lte: filters?.endDate && filters.endDate !== "" ? new Date(filters.endDate) : undefined
            }
        },
        include: { user: true, customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return transactions.map((t: any) => ({
        ...t,
        totalAmount: Number(t.totalAmount),
        paidAmount: Number(t.paidAmount || 0),
        remainingAmount: Number(t.remainingAmount || 0),
        items: t.items.map((item: any) => ({
            ...item,
            price: Number(item.price),
            originalPrice: Number(item.originalPrice || item.price),
            discountPercentage: Number(item.discountPercentage || 0),
            taxPercentage: Number(item.taxPercentage || 0),
            cost: Number(item.cost || 0)
        }))
    }));
}

export async function recordDebtCollection(
    customerId: string,
    amount: number,
    note?: string,
    repId?: string
) {
    try {
        const user = await getCurrentUser();
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new Error("العميل غير موجود");

        return await prisma.$transaction(async (tx) => {
            // 1. Create the COLLECTION transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: 'COLLECTION',
                    totalAmount: 0,
                    userId: repId || customer.representativeId || user.id,
                    agencyId: customer.agencyId,
                    customerId: customerId,
                    paymentType: 'CASH',
                    paidAmount: amount,
                    remainingAmount: 0, // We will reduce the sales instead
                    note: note || `تحصيل مديونية من ${customer.name}`
                }
            });

            // 2. Find outstanding sales and reduce remainingAmount (FIFO)
            const outstandingSales = await tx.transaction.findMany({
                where: {
                    customerId,
                    type: 'SALE',
                    remainingAmount: { gt: 0 }
                },
                orderBy: { createdAt: 'asc' }
            });

            let balanceToApply = amount;
            for (const sale of outstandingSales) {
                if (balanceToApply <= 0) break;

                const saleRemaining = Number(sale.remainingAmount);
                const reduction = Math.min(saleRemaining, balanceToApply);

                await tx.transaction.update({
                    where: { id: sale.id },
                    data: {
                        paidAmount: { increment: reduction },
                        remainingAmount: { decrement: reduction }
                    }
                });

                balanceToApply -= reduction;
            }

            // 3. If there's still balance left (overpayment), we could potentially create a credit entry
            // For now, we'll just log it or adjust the transaction itself if we had a field for it
            // but standardizing on reducing sales is key.

            revalidatePath('/dashboard', 'layout');
            revalidatePath(`/dashboard/customers/${customerId}`);
            const revalidateRepId = repId || customer.representativeId;
            if (revalidateRepId) {
                revalidatePath(`/dashboard/reps/${revalidateRepId}`);
            }
            revalidatePath('/dashboard/accounts/treasury');

            // 4. Record Journal Entry (Only if collected directly by office/accountant, not rep)
            // If repId is provided or collector is a rep, it stays in their custody
            const collector = await tx.user.findUnique({ where: { id: repId || user.id } });
            const isRep = collector?.role === 'SALES_REPRESENTATIVE';

            // 4. Record Journal Entry for all collections
            // Profit reports rely on these entries for cash-basis accounting
            await recordJournalEntry(tx, {
                amount,
                type: 'DEBIT',
                description: `تحصيل مديونية من ${customer.name} - ${note || ''}`,
                referenceId: transaction.id,
                referenceType: 'COLLECTION',
                agencyId: customer.agencyId,
                userId: user.id
            });

            return { success: true, sessionId: transaction.id };
        }, { timeout: 15000 });
    } catch (error) {
        console.error("recordDebtCollection error:", error);
        return { success: false, error: String(error) };
    }
}

export async function recordAgencyPayment(
    agencyId: string,
    amount: number,
    note?: string
) {
    try {
        const user = await getCurrentUser();
        const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
        if (!agency) throw new Error("Agency not found");

        return await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    type: 'SUPPLY_PAYMENT',
                    totalAmount: 0,
                    userId: user.id,
                    agencyId: agencyId,
                    paymentType: 'CASH',
                    paidAmount: amount,
                    remainingAmount: -amount,
                    note: note || "سداد مديونية توريد"
                }
            });

            // 2. Record Journal Entry (Cash Out from Treasury)
            await recordJournalEntry(tx, {
                amount,
                type: 'CREDIT',
                description: `سداد مديونية توريد للتوكيل: ${agency.name} - ${note || ''}`,
                referenceId: transaction.id,
                referenceType: 'SUPPLY_PAYMENT',
                agencyId: agencyId,
                userId: user.id
            });

            revalidatePath('/dashboard', 'layout');
            revalidatePath('/dashboard/accounts/reports/purchases');
            revalidatePath('/dashboard/accounts/treasury');

            return { success: true, sessionId: transaction.id };
        });
    } catch (error) {
        console.error("recordAgencyPayment error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getAgencyPurchases() {
    const user = await getCurrentUser();
    const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';

    const agencies = await prisma.agency.findMany({
        where: isAdminOrManager ? {} : { id: user.agencyId || undefined },
        include: {
            transactions: {
                where: { type: { in: ['PURCHASE', 'SUPPLY_PAYMENT'] } },
                include: {
                    user: true,
                    items: { include: { product: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    return agencies.map(agency => {
        const transactions = agency.transactions.map(t => ({
            ...t,
            totalAmount: Number(t.totalAmount || 0),
            paidAmount: Number(t.paidAmount || 0),
            remainingAmount: Number(t.remainingAmount || 0),
            items: t.items.map(item => ({
                ...item,
                price: Number(item.price),
                cost: Number(item.cost || 0),
                discountPercentage: Number(item.discountPercentage || 0),
                taxPercentage: Number(item.taxPercentage || 0)
            }))
        }));

        const totalPurchases = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0);
        const totalRemaining = transactions.reduce((sum, t) => sum + t.remainingAmount, 0);

        return {
            id: agency.id,
            name: agency.name,
            totalPurchases,
            totalPaid,
            totalRemaining,
            transactions
        };
    });
}

export async function updateTransaction(
    id: string, updates: any) {
    try {
        await prisma.$transaction(async (tx) => {
            if (updates.items) {
                // Delete old items
                await tx.transactionItem.deleteMany({ where: { transactionId: id } });

                // Create new items
                await tx.transactionItem.createMany({
                    data: await Promise.all(updates.items.map(async (item: any) => {
                        const product = await prisma.product.findUnique({ where: { id: item.productId } });
                        return {
                            transactionId: id,
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            cost: item.cost || product?.factoryPrice || 0,
                            discountPercentage: Number(item.discountPercentage || 0),
                            taxPercentage: Number(item.taxPercentage || 0),
                            total: item.quantity * Number(item.price)
                        };
                    }))
                });

                // Calculate new total
                const totalAmount = updates.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

                // Fetch current session to get paidAmount for remainingAmount calculation
                const session = await tx.transaction.findUnique({ where: { id } });
                const paid = updates.paidAmount !== undefined ? updates.paidAmount : Number(session?.paidAmount || 0);

                await tx.transaction.update({
                    where: { id },
                    data: {
                        totalAmount,
                        paidAmount: paid,
                        remainingAmount: totalAmount - paid
                    }
                });
            } else if (updates.paidAmount !== undefined) {
                const session = await tx.transaction.findUnique({ where: { id } });
                const total = Number(session?.totalAmount || 0);
                await tx.transaction.update({
                    where: { id },
                    data: {
                        paidAmount: updates.paidAmount,
                        remainingAmount: total - updates.paidAmount
                    }
                });
            }
        });

        revalidatePath('/dashboard/reports/sales');
        revalidatePath('/dashboard/accounts/reports/purchases');
        revalidatePath('/dashboard/accounts/purchases');
        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error) {
        console.error("updateTransaction error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getRepDebtBreakdown(repId: string) {
    const customers = await prisma.customer.findMany({
        where: { representativeId: repId },
        include: {
            transactions: {
                select: {
                    remainingAmount: true
                }
            }
        }
    });

    return customers.map(c => {
        const debt = c.transactions.reduce((sum, t) => sum + Number(t.remainingAmount || 0), 0);
        return {
            id: c.id,
            name: c.name,
            debt: debt
        };
    }).filter(c => c.debt !== 0);
}

// --- Rep Accountability & Submission ---

export async function getRepAccountability(repId: string) {
    // 1. Total collections by this rep from customers
    const collections = await prisma.transaction.aggregate({
        where: {
            userId: repId,
            type: 'COLLECTION'
        },
        _sum: { paidAmount: true }
    });

    // 2. Total cash sales by this rep (where they received the cash)
    const cashSales = await prisma.transaction.aggregate({
        where: {
            userId: repId,
            type: 'SALE',
            paidAmount: { gt: 0 }
        },
        _sum: { paidAmount: true }
    });

    // 3. Total submissions by this rep to the office
    const submissions = await prisma.transaction.aggregate({
        where: {
            userId: repId,
            type: 'REP_SUBMISSION'
        },
        _sum: { paidAmount: true }
    });

    const totalCollected = Number(collections._sum?.paidAmount || 0) + Number(cashSales._sum?.paidAmount || 0);
    const totalSubmitted = Number(submissions._sum?.paidAmount || 0);

    return {
        totalCollected,
        totalSubmitted,
        currentCustody: totalCollected - totalSubmitted
    };
}

export async function getRepsWithCustody() {
    try {
        const reps = await prisma.user.findMany({
            where: { role: 'SALES_REPRESENTATIVE' },
            select: {
                id: true,
                name: true,
                agencyId: true,
                agency: { select: { name: true } }
            }
        });

        const repsWithData = await Promise.all(reps.map(async (rep) => {
            const data = await getRepAccountability(rep.id);

            // Get last 10 collections for detail view
            const collections = await prisma.transaction.findMany({
                where: {
                    userId: rep.id,
                    type: { in: ['COLLECTION', 'SALE'] },
                    paidAmount: { gt: 0 }
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { customer: true }
            });

            return {
                id: rep.id,
                name: rep.name,
                agencyId: rep.agencyId,
                agencyName: rep.agency?.name || "عام",
                ...data,
                recentCollections: collections.map(c => ({
                    id: c.id,
                    date: c.createdAt,
                    amount: Number(c.paidAmount),
                    customerName: c.customer?.name || "مبيعات نقدية",
                    type: c.type
                }))
            };
        }));

        return repsWithData;
    } catch (e) {
        console.error("getRepsWithCustody error:", e);
        return [];
    }
}

export async function recordRepSubmission(
    repId: string,
    amount: number,
    note?: string
) {
    try {
        const user = await getCurrentUser();
        const rep = await prisma.user.findUnique({ where: { id: repId } });
        if (!rep) throw new Error("المندوب غير موجود");

        return await prisma.$transaction(async (tx) => {
            // 0. Check custody balance before submission
            const collections = await tx.transaction.aggregate({
                where: { userId: repId, type: 'COLLECTION' },
                _sum: { paidAmount: true }
            });
            const cashSales = await tx.transaction.aggregate({
                where: { userId: repId, type: 'SALE' },
                _sum: { paidAmount: true }
            });
            const submissions = await tx.transaction.aggregate({
                where: { userId: repId, type: 'REP_SUBMISSION' },
                _sum: { paidAmount: true }
            });

            const currentCustody = (Number(collections._sum?.paidAmount || 0) + Number(cashSales._sum?.paidAmount || 0)) - Number(submissions._sum?.paidAmount || 0);

            if (amount > currentCustody) {
                throw new Error(`عذراً، المبلغ المدخل (${amount}) أكبر من إجمالي التحصيلات الموجودة مع المندوب حالياً (${currentCustody})`);
            }

            // 1. Create REP_SUBMISSION transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: 'REP_SUBMISSION',
                    totalAmount: 0,
                    userId: repId,
                    agencyId: rep.agencyId!,
                    paymentType: 'CASH',
                    paidAmount: amount,
                    remainingAmount: 0,
                    note: note || `توريد عهدة نقدية من المندوب: ${rep.name}`
                }
            });

            // 2. Record Journal Entry (Hits the office treasury)
            await recordJournalEntry(tx, {
                amount,
                type: 'DEBIT',
                description: `توريد عهدة من المندوب ${rep.name} - ${note || ''}`,
                referenceId: transaction.id,
                referenceType: 'REP_SUBMISSION',
                agencyId: rep.agencyId,
                userId: user.id
            });

            revalidatePath('/dashboard', 'layout');
            revalidatePath('/dashboard/accounts/treasury');
            return { success: true };
        });
    } catch (error) {
        console.error("recordRepSubmission error:", error);
        return { success: false, error: String(error) };
    }
}

export async function recordOpeningStock(formData: FormData) {
    try {
        const warehouseId = formData.get('warehouseId') as string;
        const productId = formData.get('productId') as string;
        const quantity = Number(formData.get('quantity'));
        const cost = Number(formData.get('cost') || 0);
        const date = formData.get('date') as string;

        if (!warehouseId || !productId || !quantity) throw new Error('بيانات غير مكتملة');

        const user = await getCurrentUser();
        const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) throw new Error("Warehouse not found");

        await prisma.$transaction(async (tx) => {
            // 1. Update/Upsert Stock
            await tx.stock.upsert({
                where: { warehouseId_productId: { warehouseId, productId } },
                update: { quantity: { increment: quantity } },
                create: { warehouseId, productId, quantity }
            });

            // 2. Record Transaction
            const cartons = Math.floor(quantity / (Number((warehouse as any).product?.unitsPerCarton) || 1));
            const units = quantity % (Number((warehouse as any).product?.unitsPerCarton) || 1);

            // We need to fetch the product again or trust the front-end breakdown if we passed it
            // For now, let's just use the quantity and optionally update the note if we want to be fancy.
            // But since recordOpeningStock is generic, let's keep it simple or fetch product details.

            const product = await tx.product.findUnique({ where: { id: productId } });
            const upc = product?.unitsPerCarton || 1;
            const noteCartons = Math.floor(quantity / upc);
            const noteUnits = quantity % upc;

            let detailedNote = "بضاعة أول المدة";
            if (upc > 1) {
                const parts = [];
                if (noteCartons > 0) parts.push(`${noteCartons} كرتونة`);
                if (noteUnits > 0) parts.push(`${noteUnits} علبة`);
                detailedNote += ` (${parts.join(' و ')})`;
            }

            await (tx as any).transaction.create({
                data: {
                    type: 'INITIAL_STOCK' as any,
                    totalAmount: quantity * cost,
                    userId: user.id,
                    agencyId: warehouse.agencyId,
                    warehouseId: warehouseId,
                    paymentType: 'CASH',
                    paidAmount: 0,
                    remainingAmount: 0,
                    note: detailedNote,
                    createdAt: date ? new Date(date) : new Date(),
                    items: {
                        create: [{
                            productId: productId,
                            quantity: quantity,
                            price: cost,
                            cost: cost
                        }]
                    }
                } as any
            });
        });

        revalidatePath('/dashboard/warehouses/[id]', 'page');
        revalidatePath('/dashboard/warehouses', 'layout');
        return { success: true };
    } catch (error) {
        console.error("recordOpeningStock error:", error);
        return { success: false, error: String(error) };
    }
}

// --- Daily Closing Actions ---

export async function openDailyClosing(agencyId: string, openingBalance: number) {
    try {
        const user = await getCurrentUser();

        // Check if there's already an open closing for this user/agency
        const existing = await prisma.dailyClosing.findFirst({
            where: { userId: user.id, agencyId, status: 'OPEN' }
        });
        if (existing) throw new Error("يوجد يومية مفتوحة بالفعل لهذا المستخدم");

        const closing = await prisma.dailyClosing.create({
            data: {
                userId: user.id,
                agencyId,
                openingBalance,
                status: 'OPEN'
            }
        });

        revalidatePath('/dashboard/accounts/daily-closing');
        return { success: true, id: closing.id };
    } catch (error) {
        console.error("openDailyClosing error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getOpenDailyClosing(agencyId: string) {
    try {
        const user = await getCurrentUser();
        const closing = await prisma.dailyClosing.findFirst({
            where: { userId: user.id, agencyId, status: 'OPEN' }
        });
        if (!closing) return null;

        // Fetch movements since opening
        const movements = await prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                agencyId,
                createdAt: { gte: closing.createdAt }
            }
        });

        let totalDebit = 0;
        let totalCredit = 0;
        movements.forEach(m => {
            if (m.type === 'DEBIT') totalDebit += Number(m.amount);
            else totalCredit += Number(m.amount);
        });

        return {
            ...closing,
            totalDebit,
            totalCredit,
            expectedBalance: Number(closing.openingBalance) + totalDebit - totalCredit,
            movementsCount: movements.length
        };
    } catch (error) {
        console.error("getOpenDailyClosing error:", error);
        return null;
    }
}

export async function finalizeDailyClosing(closingId: string, closingBalance: number, notes?: string) {
    try {
        const user = await getCurrentUser();
        const closing = await prisma.dailyClosing.findUnique({ where: { id: closingId } });
        if (!closing || closing.status !== 'OPEN') throw new Error("اليومية غير موجودة أو مغلقة بالفعل");

        // Professional way: Fetch all movements and sum with sign
        const transactionsSinceOpen = await prisma.journalEntry.findMany({
            where: {
                userId: closing.userId,
                agencyId: closing.agencyId,
                createdAt: { gte: closing.createdAt }
            }
        });

        let movement = 0;
        for (const entry of transactionsSinceOpen) {
            movement += (entry.type === 'DEBIT' ? Number(entry.amount) : -Number(entry.amount));
        }

        const expectedBalance = Number(closing.openingBalance) + movement;

        await prisma.dailyClosing.update({
            where: { id: closingId },
            data: {
                closingBalance,
                expectedBalance,
                status: 'CLOSED',
                notes,
                closedAt: new Date()
            }
        });

        revalidatePath('/dashboard/accounts/daily-closing');
        return { success: true };
    } catch (error) {
        console.error("finalizeDailyClosing error:", error);
        return { success: false, error: String(error) };
    }
}

// --- Loading Request Actions ---

export async function createLoadingRequest(data: FormData) {
    const user = await getCurrentUser();
    const warehouseId = data.get('warehouseId') as string;
    const itemsJson = data.get('items') as string;
    const note = data.get('note') as string;

    if (!warehouseId || !itemsJson) throw new Error("Invalid Data");

    let items: { productId: string; quantity: number }[] = JSON.parse(itemsJson);
    if (items.length === 0) throw new Error("No items to request");

    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new Error("Warehouse not found");

    // Server-side validation: prevent requesting out-of-stock items
    for (const item of items) {
        const stock = await prisma.stock.findUnique({
            where: { warehouseId_productId: { warehouseId, productId: item.productId } }
        });
        if (!stock || stock.quantity < item.quantity) {
            const prod = await prisma.product.findUnique({ where: { id: item.productId } });
            throw new Error(`عفواً، الصنف (${prod?.name}) غير متوفر بكمية كافية في هذا المخزن حالياً.`);
        }
    }

    await prisma.loadingRequest.create({
        data: {
            repId: user.id,
            warehouseId,
            agencyId: warehouse.agencyId,
            note,
            items: {
                create: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            }
        }
    });

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

export async function getLoadingRequests() {
    const user = await getCurrentUser();
    
    let where: any = {};
    if (user.role === 'SALES_REPRESENTATIVE') {
        where.repId = user.id;
    } else if (user.role === 'MANAGER') {
        where.agencyId = { in: user.agencyIds };
    } else if (user.role === 'WAREHOUSE_KEEPER') {
        where.warehouseId = user.warehouseId;
        where.status = { in: ['APPROVED', 'COMPLETED'] };
    } else if (user.role === 'ADMIN') {
        // Admin sees everything
    }

    return await prisma.loadingRequest.findMany({
        where,
        include: {
            representative: true,
            warehouse: true,
            agency: true,
            items: {
                include: {
                    product: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function updateLoadingRequestStatus(requestId: string, status: 'APPROVED' | 'REJECTED', adminNote?: string) {
    const user = await getCurrentUser();
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') throw new Error("Unauthorized");

    await prisma.loadingRequest.update({
        where: { id: requestId },
        data: { status, adminNote }
    });

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

export async function completeLoadingRequest(requestId: string) {
    const user = await getCurrentUser();
    if (user.role !== 'WAREHOUSE_KEEPER' && user.role !== 'ADMIN') throw new Error("Unauthorized");

    const request = await prisma.loadingRequest.findUnique({
        where: { id: requestId },
        include: { items: true, representative: true }
    });

    if (!request) throw new Error("Request not found");
    if (request.status !== 'APPROVED') throw new Error("Request must be approved first");

    // Perform the actual loading
    await prisma.$transaction(async (tx) => {
        for (const item of request.items) {
            // Check stock
            const sourceStock = await tx.stock.findUnique({
                where: { warehouseId_productId: { warehouseId: request.warehouseId, productId: item.productId } }
            });

            if (!sourceStock || sourceStock.quantity < item.quantity) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                throw new Error(`الرصيد غير كافٍ للصنف: ${product?.name}`);
            }

            // Decrement warehouse
            await tx.stock.update({
                where: { warehouseId_productId: { warehouseId: request.warehouseId, productId: item.productId } },
                data: { quantity: { decrement: item.quantity } }
            });

            // Increment rep
            await tx.stock.upsert({
                where: { warehouseId_productId: { warehouseId: request.repId, productId: item.productId } },
                update: { quantity: { increment: item.quantity } },
                create: { warehouseId: request.repId, productId: item.productId, quantity: item.quantity }
            });

            // Record transaction
            await tx.transaction.create({
                data: {
                    type: 'SALE',
                    totalAmount: 0,
                    userId: request.repId,
                    agencyId: request.agencyId,
                    warehouseId: request.warehouseId,
                    note: `تحميل للمندوب (بناء على طلب): ${request.representative.name}`,
                    items: {
                        create: [{
                            productId: item.productId,
                            quantity: item.quantity,
                            price: 0,
                            cost: Number(await tx.product.findUnique({ where: { id: item.productId } }).then(p => p?.factoryPrice || 0))
                        }]
                    }
                }
            });
        }

        // Update request status
        await tx.loadingRequest.update({
            where: { id: requestId },
            data: { status: 'COMPLETED' }
        });
    });

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

export async function approveTransaction(id: string) {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: { user: true, items: true }
        });
        if (!transaction) throw new Error("المستند غير موجود");

        // Recalculate total based on items and their discounts
        const finalTotal = transaction.items.reduce((sum, item) => {
            const base = Number(item.quantity) * Number(item.price);
            const disc = base * (Number((item as any).discountPercentage || 0) / 100);
            return sum + (base - disc);
        }, 0);

        await prisma.transaction.update({
            where: { id },
            data: { 
                status: 'ACTIVE',
                totalAmount: finalTotal,
                paidAmount: transaction.paymentType === 'CASH' ? finalTotal : transaction.paidAmount,
                remainingAmount: transaction.paymentType === 'CASH' ? 0 : (finalTotal - Number(transaction.paidAmount || 0)),
                note: transaction.note ? `${transaction.note} (تمت الموافقة)` : 'تمت الموافقة من المدير'
            }
        });

        revalidatePath('/dashboard/reports/sales');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
