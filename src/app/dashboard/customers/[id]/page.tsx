import { getCustomerDetails } from "@/lib/actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import DebtCollectionForm from "./debt-collection-form";
import { OpeningBalanceModal } from "@/components/accounts/opening-balance-modal";

export const dynamic = 'force-dynamic';

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const customer = await getCustomerDetails(id);

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

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">البيان / التاريخ</th>
                                    <th className="px-6 py-4">الحالة/الطريقة</th>
                                    <th className="px-6 py-4">قيمة العملية</th>
                                    <th className="px-6 py-4 text-emerald-700">المحصل/المدفوع</th>
                                    <th className="px-6 py-4 text-red-600">المتبقي (دين)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {customer.transactions.map((transaction: any) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">
                                                {transaction.type === 'COLLECTION' ? '💰 تحصيل مديونية' :
                                                    transaction.type === 'SALE' ? `#INV-${transaction.id.slice(0, 8)}` :
                                                        transaction.type}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(transaction.createdAt).toLocaleDateString('ar-EG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            {transaction.note && (
                                                <div className="text-[10px] text-gray-400 mt-1 italic">{transaction.note}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {transaction.type === 'COLLECTION' ? (
                                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold">تحصيل نقدي</span>
                                            ) : (
                                                <span className={`px-2 py-1 rounded-full font-black ${transaction.paymentType === 'CASH' ? 'bg-emerald-100 text-emerald-700' :
                                                    transaction.paymentType === 'CREDIT' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {transaction.paymentType === 'CASH' ? 'نقدي' :
                                                        transaction.paymentType === 'CREDIT' ? 'آجل' : 'جزئي'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold">
                                            {transaction.type === 'COLLECTION' ? '---' : Number(transaction.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-emerald-700 font-bold">
                                            {transaction.type === 'COLLECTION' ? (
                                                <span className="text-blue-600">+{Number(transaction.paidAmount).toLocaleString()}</span>
                                            ) : (
                                                Number(transaction.paidAmount || 0).toLocaleString()
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-red-600 font-black">
                                            {transaction.type === 'COLLECTION' ? '---' : Number(transaction.remainingAmount || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {customer.transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                            لا توجد مبيعات أو تحصيلات مسجلة لهذا العميل بعد
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
