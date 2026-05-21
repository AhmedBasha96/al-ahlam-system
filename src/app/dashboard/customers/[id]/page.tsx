import { getCustomerDetails, getCurrentUser } from "@/lib/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import DebtCollectionForm from "./debt-collection-form";
import { OpeningBalanceModal } from "@/components/accounts/opening-balance-modal";
import CustomerLedgerTable from "./customer-ledger-table";

export const dynamic = 'force-dynamic';

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const customer = await getCustomerDetails(id);
    const currentUser = await getCurrentUser();

    if (!customer) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-4 rounded-2xl text-2xl">👤</div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
                        <p className="text-gray-500">{customer.phone || 'بدون هاتف'} • {customer.address || 'بدون عنوان'}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                المندوب: {customer.representative.name}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                                التوكيل: {customer.agency.name}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <OpeningBalanceModal
                        type="CUSTOMER"
                        id={customer.id}
                        name={customer.name}
                        agencyId={customer.agencyId}
                        visible={!customer.hasInitialBalance}
                    />
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-center md:text-right min-w-[200px]">
                        <p className="text-red-700 text-sm font-bold mb-1">إجمالي المديونية المستحقة</p>
                        <p className="text-3xl font-black text-red-600">
                            {customer.totalDebt.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Collection Form & History Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Collection Form Section */}
                <div className="lg:col-span-1">
                    <DebtCollectionForm
                        customerId={customer.id}
                        customerName={customer.name}
                    />
                </div>

                {/* Invoices List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="bg-emerald-100 p-1.5 rounded-lg">📄</span>
                            سجل الحساب (فواتير وتحصيلات)
                        </h2>
                        <Link
                            href="/dashboard/customers"
                            className="text-sm text-emerald-600 hover:underline font-bold"
                        >
                            ← العودة لقائمة العملاء
                        </Link>
                    </div>

                    <CustomerLedgerTable
                        transactions={customer.transactions.map((t: any) => ({
                            ...t,
                            totalAmount: Number(t.totalAmount || 0),
                            paidAmount: Number(t.paidAmount || 0),
                            remainingAmount: Number(t.remainingAmount || 0),
                            items: (t.items || []).map((i: any) => ({
                                productId: i.productId,
                                productName: i.product?.name || "منتج غير معروف",
                                quantity: i.quantity,
                                price: Number(i.price || 0),
                                total: i.quantity * Number(i.price || 0)
                            }))
                        }))}
                        customerName={customer.name}
                        userRole={currentUser?.role}
                    />
                </div>
            </div>
        </div>
    );
}
