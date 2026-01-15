import { getProducts, getStocks, getUsers } from "@/lib/actions";
import Link from 'next/link';
import LoadStockForm from "../load-stock-form";

export default async function LoadingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: warehouseId } = await params;
    const rawProducts = await getProducts();
    const allProducts = rawProducts.map((p: any) => ({
        ...p,
        factoryPrice: Number(p.factoryPrice),
        wholesalePrice: Number(p.wholesalePrice),
        retailPrice: Number(p.retailPrice)
    }));
    const rawUsers = await getUsers();
    const reps = rawUsers
        .filter((u: any) => u.role === 'SALES_REPRESENTATIVE')
        .map((u: any) => ({
            ...u,
            agencyId: u.agencyId || undefined,
            pricingType: u.pricingType || undefined,
            warehouseId: u.warehouseId || undefined
        }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link href={`/dashboard/warehouses/${warehouseId}`} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-2">
                    <span>&larr;</span> العودة للمخزن
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">تحميل بضاعة (إذن صرف مخزني)</h1>
            </div>

            {reps.length > 0 ? (
                <LoadStockForm warehouseId={warehouseId} products={allProducts} reps={reps} />
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-center gap-3 text-yellow-800">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="font-bold">تنبيه: لا يوجد مناديب مبيعات مسجلين في النظام.</p>
                        <p className="text-sm">يرجى إضافة مستخدم بصلاحية "مندوب مبيعات" أولاً لتتمكن من تحميل البضاعة.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
