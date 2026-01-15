import { getProducts, getRepStocks, getUsers, getRepCustomers, getWarehouses, getCurrentUser, getSalesSessions } from "@/lib/actions";
import Link from "next/link";
import RepAuditForm from "./rep-audit-form";
import NewInvoiceButton from "./new-invoice-button";
import PricingToggle from "./pricing-toggle";
import DebugInfo from "./debug-info";

export const dynamic = 'force-dynamic';

export default async function RepStockPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: repId } = await params;
    const rawProducts = await getProducts();
    const allProducts = rawProducts.map((p: any) => ({
        ...p,
        factoryPrice: Number(p.factoryPrice),
        wholesalePrice: Number(p.wholesalePrice),
        retailPrice: Number(p.retailPrice)
    }));

    // Sanitize repStocks to remove nested Prisma objects (Decimal)
    const rawRepStocks = await getRepStocks(repId);
    const repStocks = rawRepStocks.map(s => ({
        productId: s.productId,
        quantity: s.quantity
    }));

    const users = await getUsers();
    const repCustomers = await getRepCustomers(repId);
    const warehouses = await getWarehouses();
    const rep = users.find((u: any) => u.id === repId);
    const currentUser = await getCurrentUser();

    if (!rep) return <div>المندوب غير موجود</div>;

    // Fetch sales sessions to calculate debts
    const salesSessions = await getSalesSessions({ repId });

    // Personal Debt: Sessions with NO customerId (Audit-based)
    const personalDebt = salesSessions
        .filter(s => !s.customerId)
        .reduce((sum, s) => sum + Number(s.remainingAmount || 0), 0);

    // Customer Debt: Sessions WITH customerId
    const customerDebt = salesSessions
        .filter(s => !!s.customerId)
        .reduce((sum, s) => sum + Number(s.remainingAmount || 0), 0);

    const totalDebt = personalDebt + customerDebt;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-emerald-100 p-2 rounded-lg">📋</span>
                        جرد عهدة المندوب وحساب المبيعات
                    </h1>
                    <div className="text-gray-500 mt-1 mr-10 flex items-center gap-2">
                        المندوب الحالي: <span className="font-bold text-emerald-700">{rep.name}</span>
                        <PricingToggle repId={rep.id} currentType={(rep.pricingType as any) || undefined} />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <NewInvoiceButton
                        repId={repId}
                        repName={rep.name}
                        customers={repCustomers}
                        products={allProducts}
                        repStocks={repStocks}
                    />
                    <Link href="/dashboard/users" className="text-emerald-600 hover:text-emerald-800 flex items-center gap-2 font-medium">
                        <span>&larr;</span> العودة لقائمة المستخدمين
                    </Link>
                </div>
            </div>

            {/* Debt Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-blue-100 p-4 rounded-xl text-2xl">👤</div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">مديونية المندوب (الجرد)</p>
                        <p className="text-xl font-black text-blue-700">{personalDebt.toLocaleString('en-US')} ج.م</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="bg-amber-100 p-4 rounded-xl text-2xl">👥</div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">إجمالي مديونيات العملاء</p>
                        <p className="text-xl font-black text-amber-700">{customerDebt.toLocaleString('en-US')} ج.م</p>
                    </div>
                </div>
                <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg border border-emerald-500 flex items-center gap-4 text-white">
                    <div className="bg-white/20 p-4 rounded-xl text-2xl">💰</div>
                    <div>
                        <p className="text-xs font-bold text-emerald-100 uppercase">الإجمالي العام للمديونية</p>
                        <p className="text-2xl font-black">{totalDebt.toLocaleString('en-US')} ج.م</p>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-800 text-sm flex items-start gap-3 shadow-sm">
                <span className="text-xl">💡</span>
                <div>
                    <p className="font-bold mb-1">كيفية الجرد:</p>
                    <p>قم بإدخال الكمية المتبقية في العربية حالياً في خانة <strong>"الكمية الموجودة فعلياً"</strong>. سيقوم النظام تلقائياً بحساب المباع بناءً على العهدة المسجلة له.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <RepAuditForm
                        repId={repId}
                        repName={rep.name}
                        pricingType={(rep.pricingType as any) || undefined}
                        products={allProducts}
                        repStocks={repStocks}
                        warehouses={warehouses}
                        userRole={currentUser.role}
                    />
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="bg-emerald-100 p-1 rounded-lg text-emerald-700 text-sm">👥</span>
                            العملاء التابعين للمندوب ({repCustomers.length})
                        </h3>
                        {repCustomers.length > 0 ? (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {repCustomers.map((customer: any) => (
                                    <div key={customer.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-emerald-50 transition-colors">
                                        <p className="font-bold text-gray-900 text-sm">{customer.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">📞 {customer.phone || 'بدون رقم'}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic text-center py-4">لا يوجد عملاء مضافين لهذا المندوب.</p>
                        )}
                        <Link href="/dashboard/customers" className="block mt-4 text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 py-2 rounded-lg transition-colors">
                            إدارة العملاء &rarr;
                        </Link>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-xs text-emerald-800">
                        <p className="font-bold mb-1">💡 ملحوظة:</p>
                        <p>يتم ربط العميل بالمندوب لتسهيل عملية التحصيل وتسجيل المديونيات بشكل دقيق عند إصدار الفاتورة.</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-gray-600 text-xs">
                <strong>ملاحظة تقنية:</strong> عند "تأكيد الجرد"، يتم تحديث رصيد المندوب ليصبح مساوياً للكمية الفعلية التي أدخلتها. لزيادة العهدة مجدداً، استخدم "إذن صرف" من شاشة المخازن.
            </div>

            <DebugInfo rep={rep} products={allProducts} />
        </div>
    );
}
