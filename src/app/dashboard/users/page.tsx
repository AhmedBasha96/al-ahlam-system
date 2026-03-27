import { createUser, getAgencies, getUsers, getCurrentUser } from "@/lib/actions";
import CreateUserForm from "./create-user-form";
import UsersList from "./users-list";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
    let agencies: any[] = [];
    let users: any[] = [];
    let warehouses: any[] = [];

    let currentUser: any = null;

    try {
        currentUser = await getCurrentUser();
        agencies = await getAgencies();
        const rawUsers = await getUsers();
        users = rawUsers.map((u: any) => ({
            ...u,
            agencyId: u.agencyId || undefined,
            agencyIds: u.agencies?.map((a: any) => a.id) || [],
            pricingType: u.pricingType || undefined,
            warehouseId: u.warehouseId || undefined
        }));

        // Fetch all warehouses (excluding virtual rep warehouses)
        const rawWarehouses = await prisma.warehouse.findMany({
            where: { name: { not: { startsWith: 'عهدة المندوب:' } } },
            select: { id: true, name: true, agencyId: true },
            orderBy: { name: 'asc' }
        });
        warehouses = rawWarehouses;
    } catch (error) {
        console.error("Build/Runtime error fetching users:", error);
    }

    const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create User Form - Client Component */}
                {canCreate && (
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                            <h3 className="text-lg font-bold mb-4 text-emerald-800">إضافة مستخدم جديد</h3>
                            <CreateUserForm agencies={agencies} warehouses={warehouses} createUserAction={createUser} />
                        </div>
                    </div>
                )}

                {/* Users List - Client Component */}
                <div className={canCreate ? "lg:col-span-2" : "lg:col-span-3"}>
                    <UsersList users={users} agencies={agencies} warehouses={warehouses} currentUserRole={currentUser?.role} />
                </div>
            </div>
        </div>
    );
}
