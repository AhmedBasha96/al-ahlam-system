import { getProducts, getRepStocks, getUsers, getRepCustomers, getWarehouses, getCurrentUser, getSalesSessions, getRepDebtBreakdown } from "@/lib/actions";
import Link from "next/link";
import RepAuditForm from "./rep-audit-form";
import NewInvoiceButton from "./new-invoice-button";
import PricingToggle from "./pricing-toggle";
import DebugInfo from "./debug-info";
import RepDebtBreakdown from "./rep-debt-breakdown";
import RepSessionTable from "./rep-session-table";

export const dynamic = 'force-dynamic';

export default async function RepStockPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: repId } = await params;

    let rawProducts: any[] = [];
    let rawRepStocks: any[] = [];
    let users: any[] = [];
    let repCustomers: any[] = [];
    let warehouses: any[] = [];
    let salesSessions: any[] = [];
    let rep: any = null;
    let currentUser = { role: 'GUEST' } as any;
    let customerDebtBreakdown: any[] = [];

    try {
        rawProducts = await getProducts();
        rawRepStocks = await getRepStocks(repId);
        const rawUsers = await getUsers();
        users = rawUsers.map((u: any) => ({
            id: String(u.id),
            name: String(u.name || ""),
            email: String(u.email || ""),
            role: String(u.role || ""),
            agencyId: u.agencyId ? String(u.agencyId) : undefined,
            pricingType: u.pricingType ? String(u.pricingType) : undefined,
            warehouseId: u.warehouseId ? String(u.warehouseId) : undefined
        }));
        const rawRepCustomers = await getRepCustomers(repId);
        repCustomers = rawRepCustomers.map((c: any) => ({
            id: String(c.id),
            name: String(c.name || ""),
            phone: c.phone ? String(c.phone) : undefined,
            address: c.address ? String(c.address) : undefined
        }));
        const rawWarehouses = await getWarehouses();
        warehouses = rawWarehouses.map((w: any) => ({
            id: String(w.id),
            name: String(w.name || ""),
            agencyId: String(w.agencyId || "")
        }));
        salesSessions = await getSalesSessions({ repId });
        rep = users.find((u: any) => u.id === repId);
        currentUser = await getCurrentUser();
        customerDebtBreakdown = await getRepDebtBreakdown(repId);
    } catch (e) { console.error("RepPage data fetch error:", e); }

    const allProducts = rawProducts.map((p: any) => ({
        id: String(p.id),
        name: String(p.name || ""),
        image: p.image ? String(p.image) : null,
        factoryPrice: Number(p.factoryPrice || 0),
        wholesalePrice: Number(p.wholesalePrice || 0),
        retailPrice: Number(p.retailPrice || 0),
        unitsPerCarton: Number(p.unitsPerCarton || 1),
        unitFactoryPrice: Number(p.unitFactoryPrice || 0),
        unitWholesalePrice: Number(p.unitWholesalePrice || 0),
        unitRetailPrice: Number(p.unitRetailPrice || 0),
        wholesaleDiscount: Number(p.wholesaleDiscount || 0),
        retailDiscount: Number(p.retailDiscount || 0),
        agencyId: String(p.agencyId || "")
    }));
    const repStocks = rawRepStocks.map(s => ({ productId: s.productId, quantity: s.quantity }));

    if (!rep) return <div>المندوب غير موجود (أو خطأ في الخادم)</div>;

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
                        pricingType={rep.pricingType}
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
                <div className="lg:col-span-3 space-y-6">
                    <RepAuditForm
                        repId={repId}
                        repName={rep.name}
                        pricingType={(rep.pricingType as any) || undefined}
                        products={allProducts}
                        repStocks={repStocks}
                        warehouses={warehouses}
                        userRole={currentUser.role}
                    />

                    <RepSessionTable
                        sessions={salesSessions}
                        userRole={currentUser.role}
                    />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Debt Breakdown Component */}
                    <RepDebtBreakdown repId={repId} customers={customerDebtBreakdown} />

                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-xs text-emerald-800">
                        <p className="font-bold mb-1">💡 ملحوظة:</p>
                        <p>يتم عرض ديون العملاء المرتبطين بك هنا. عند تحصيل أي مبلغ، سيتم خصمه من مديونيتك الإجمالية ومن حساب العميل في نفس الوقت.</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-gray-600 text-xs text-center">
                <strong>ملاحظة تقنية:</strong> عند "تأكيد الجرد"، يتم تحديث رصيد المندوب ليصبح مساوياً للكمية الفعلية التي أدخلتها. لزيادة العهدة مجدداً، استخدم "إذن صرف" من شاشة المخازن.
            </div>

            <DebugInfo rep={rep} products={allProducts} />
        </div>
    );
}
