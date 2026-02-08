import { getCustomers, getUsers, getAgencies, createCustomer, getCurrentUser } from "@/lib/actions";
import CustomersList from "./customers-list";
import CreateCustomerForm from "./create-customer-form";

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
    let customers: any[] = [];
    let users: any[] = [];
    let agencies: any[] = [];

    try {
        const rawCustomers = await getCustomers();
        customers = rawCustomers.map((c: any) => ({
            ...c,
            representativeId: c.representativeId || undefined,
            representativeIds: c.representativeIds || (c.representativeId ? [c.representativeId] : []),
            agencyId: c.agencyId || undefined
        }));
        users = await getUsers();
        agencies = await getAgencies();
    } catch (e) { console.error("Customers/Data fetch error:", e); }

    // Only identify users who can be representatives (SALES_REPRESENTATIVE or ACCOUNTANT for now)
    const representatives = users.filter((u: any) => u.role === 'SALES_REPRESENTATIVE' || u.role === 'ACCOUNTANT');
    const user = await getCurrentUser();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">إدارة العملاء</h1>
                    <p className="text-gray-500 mt-1">إضافة وإدارة العملاء لكل مندوب ومتابعة مديونياتهم</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Customer Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                        <h3 className="text-lg font-bold mb-4 text-emerald-800 flex items-center gap-2">
                            <span className="bg-emerald-100 p-1.5 rounded-lg">👤</span>
                            إضافة عميل جديد
                        </h3>
                        <CreateCustomerForm
                            representatives={representatives}
                            agencies={agencies}
                            createCustomerAction={createCustomer}
                            userRole={user.role}
                            userAgencyId={user.agencyId}
                        />
                    </div>
                </div>

                {/* Customers List */}
                <div className="lg:col-span-2">
                    <CustomersList
                        customers={customers}
                        representatives={representatives}
                        agencies={agencies}
                        userRole={user.role}
                    />
                </div>
            </div>
        </div>
    );
}
