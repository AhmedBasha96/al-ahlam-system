import { getProducts, getStocks, getAgencies, getUsers, getWarehouse, getTransactions, getAllRepStocks, getCustomers, getWarehouses, getCurrentUser } from "@/lib/actions";
import Link from 'next/link';
import WarehouseOperations from "./warehouse-operations";

export const dynamic = 'force-dynamic';

export default async function WarehouseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: warehouseId } = await params;

    const warehouse = await getWarehouse(warehouseId);
    const user = await getCurrentUser();
    if (!warehouse || !user) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300 m-8">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg font-medium">المخزن غير موجود أو لا تملك صلاحية الوصول إليه</p>
                <Link href="/dashboard/warehouses" className="text-emerald-600 hover:underline mt-4 inline-block font-bold">
                    العودة لقائمة المخازن
                </Link>
            </div>
        );
    }

    let allProducts: any[] = [];
    let allStocks: any[] = [];
    let allUsers: any[] = [];
    let transactions: any[] = [];
    let allRepStocks: any[] = [];
    let allCustomers: any[] = [];
    let allWarehouses: any[] = [];

    try {
        // Fetch everything else
        const [
            productsData,
            stocksData,
            usersData,
            transactionsData,
            repStocksData,
            customersData,
            warehousesData
        ] = await Promise.all([
            getProducts(),
            getStocks(),
            getUsers(),
            getTransactions(warehouseId),
            getAllRepStocks(),
            getCustomers(),
            getWarehouses()
        ]);

        allProducts = productsData || [];
        allStocks = stocksData || [];
        allUsers = usersData || [];
        transactions = transactionsData || [];
        allRepStocks = repStocksData || [];
        allCustomers = customersData || [];
        allWarehouses = (warehousesData || []).map((w: any) => ({
            id: w.id,
            name: w.name,
            agencyId: w.agencyId
        }));
    } catch (e) {
        console.error("Warehouse details fetch error:", e);
    }

    // Map products to convert Decimal to number
    const agencyProducts = allProducts
        .filter((p: any) => p && p.agencyId === warehouse.agencyId)
        .map((p: any) => ({
            id: p.id,
            name: p.name,
            image: p.image,
            factoryPrice: Number(p.factoryPrice || 0),
            wholesalePrice: Number(p.wholesalePrice || 0),
            retailPrice: Number(p.retailPrice || 0),
            unitsPerCarton: Number(p.unitsPerCarton || 1),
            unitFactoryPrice: Number(p.unitFactoryPrice || 0),
            unitWholesalePrice: Number(p.unitWholesalePrice || 0),
            unitRetailPrice: Number(p.unitRetailPrice || 0),
            agencyId: p.agencyId,
            priceUpdatedAt: p.priceUpdatedAt ? p.priceUpdatedAt.toISOString() : undefined,
            agency: p.agency ? { id: p.agency.id, name: p.agency.name } : undefined,
            supplier: p.supplier ? { id: p.supplier.id, name: p.supplier.name } : undefined
        }));

    // Sanitize Stocks - SUPER SANITIZE
    const sanitizedStocks = (allStocks || []).map((s: any) => ({
        warehouseId: String(s.warehouseId),
        productId: String(s.productId),
        quantity: Number(s.quantity || 0)
    }));

    // Map reps to handle nulls
    const agencyReps = allUsers
        .filter((u: any) => u && u.role === 'SALES_REPRESENTATIVE' && u.agencyId === warehouse.agencyId)
        .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            agencyId: u.agencyId || undefined,
            pricingType: u.pricingType || undefined,
            warehouseId: u.warehouseId || undefined
        }));

    // Map transactions to the UI format
    const uiTransactions: any[] = [];
    transactions.forEach((t: any) => {
        if (t && t.items && t.items.length > 0) {
            t.items.forEach((item: any) => {
                let displayType = t.type;
                if (t.type === 'SALE') {
                    if (t.note && t.note.includes('تحميل للمندوب')) displayType = 'LOAD_TO_REP';
                } else if (t.type === 'PURCHASE') {
                    if (t.note && (t.note.includes('مرتجع') || t.type === 'RETURN_OUT')) displayType = 'RETURN';
                    else displayType = 'SUPPLY';
                }

                // Determine party name
                const partyName = t.customer?.name || t.supplier?.name || (t.type === 'SALE' ? 'عميل نقدي' : 'توريد مخزن');

                uiTransactions.push({
                    id: `${t.id}-${item.id}`,
                    baseId: t.id,
                    productId: item.productId,
                    type: displayType,
                    rawType: t.type,
                    quantityChange: (t.type === 'SALE' || t.type === 'RETURN_OUT') ? -item.quantity : item.quantity,
                    newQuantity: item.quantity,
                    date: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
                    price: Number(item.price || 0),
                    note: t.note || '',
                    partyName,
                    userName: t.user?.name || 'غير معروف',
                    items: t.items.map((i: any) => ({
                        productId: i.productId,
                        productName: i.product.name,
                        quantity: i.quantity,
                        price: Number(i.price),
                        total: i.quantity * Number(i.price)
                    })),
                    paymentInfo: {
                        type: t.paymentType,
                        paidAmount: Number(t.paidAmount || 0),
                        totalAmount: Number(t.totalAmount || 0)
                    }
                });
            });
        }
    });

    // Map Rep Stocks - SUPER SANITIZE
    const mappedRepStocks = (allRepStocks || []).map((s: any) => ({
        repId: String(s.warehouseId),
        productId: String(s.productId),
        quantity: Number(s.quantity || 0)
    }));

    // Map Customers - SUPER SANITIZE
    const mappedCustomers = (allCustomers || []).map((c: any) => ({
        id: String(c.id),
        name: String(c.name || ""),
        phone: c.phone ? String(c.phone) : undefined,
        address: c.address ? String(c.address) : undefined,
        representativeId: c.representativeId ? String(c.representativeId) : undefined,
        agencyId: String(c.agencyId)
    }));
    const sanitizedCustomers = mappedCustomers;

    // Stats Calculations
    const totalItems = agencyProducts.length;
    const itemsWithStock = agencyProducts.filter((p: any) => {
        const stock = allStocks.find((s: any) => s.warehouseId === warehouseId && s.productId === p.id);
        return (stock?.quantity || 0) > 0;
    }).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">إدارة مخزن: {warehouse.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                            مستودع نشط
                        </span>
                        <Link href="/dashboard/warehouses" className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1 font-medium group">
                            <span className="transition-transform group-hover:-translate-x-1">&rarr;</span> القائمة الرئيسية للمخازن
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">📦</div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium font-arabic">إجمالي الأصناف</p>
                        <p className="text-2xl font-black text-gray-900">{totalItems}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">📊</div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium font-arabic">أصناف متوفرة رصيد</p>
                        <p className="text-2xl font-black text-gray-900">{itemsWithStock} <span className="text-sm font-normal text-gray-400">/ {totalItems}</span></p>
                    </div>
                </div>
            </div>

            {/* Main Operations Component */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <WarehouseOperations
                    warehouseId={warehouseId}
                    agencyProducts={agencyProducts}
                    allStocks={sanitizedStocks}
                    reps={agencyReps}
                    transactions={uiTransactions}
                    allRepStocks={mappedRepStocks}
                    allCustomers={sanitizedCustomers}
                    warehouses={allWarehouses}
                    userRole={user.role}
                />
            </div>
        </div>
    );
}
