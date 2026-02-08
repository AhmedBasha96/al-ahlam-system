import { getCurrentUser, getAgencies, getUsers, getProducts, recordDirectSale } from "@/lib/actions";
import RecordSalesForm from "./record-sales-form";
import prisma from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function RecordSalesPage() {
    const user = await getCurrentUser();

    // Fetch relevant data
    const agencies = await getAgencies();
    const allUsers = await getUsers();
    const representatives = allUsers.filter(u => u.role === 'SALES_REPRESENTATIVE');

    // Convert products Decimal to number for serialization
    const rawProducts = await getProducts();
    const products = rawProducts.map(p => ({
        ...p,
        factoryPrice: Number(p.factoryPrice),
        wholesalePrice: Number(p.wholesalePrice),
        retailPrice: Number(p.retailPrice)
    }));

    const rawCustomers = await prisma.customer.findMany({
        where: user.role === 'ADMIN' || user.role === 'MANAGER' ? {} : { agencyId: { in: (user as any).agencyIds } },
        include: {
            transactions: {
                select: { remainingAmount: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    // Convert customers and calculate debt with standard numbers
    const customers = rawCustomers.map(c => {
        const totalDebt = c.transactions.reduce((sum, t) => sum + Number(t.remainingAmount || 0), 0);
        return {
            ...c,
            totalDebt,
            transactions: undefined // Remove to avoid serialization issues
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">تسجيل فاتورة مندوب</h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                <RecordSalesForm
                    representatives={representatives}
                    customers={customers}
                    products={products}
                    recordSaleAction={recordDirectSale}
                />
            </div>
        </div>
    );
}
