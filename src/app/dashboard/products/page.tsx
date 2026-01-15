import { createProduct, getAgencies, getProducts, getCurrentUser } from "@/lib/actions";
import CreateProductForm from "./create-product-form";
import ProductsList from "./products-list";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    let agencies: any[] = [];
    let products: any[] = [];
    try {
        agencies = await getAgencies();
        const rawProducts = await getProducts();
        products = rawProducts.map((p: any) => ({
            ...p,
            factoryPrice: Number(p.factoryPrice),
            wholesalePrice: Number(p.wholesalePrice),
            retailPrice: Number(p.retailPrice)
        }));
    } catch (e) { console.error("Products fetch error:", e); }
    const user = await getCurrentUser();

    const canManageProducts = user.role !== 'SALES_REPRESENTATIVE';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">إدارة المنتجات والأسعار</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Create Product Form - Sidebar Style */}
                {canManageProducts && (
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 sticky top-6">
                            <h3 className="text-lg font-bold mb-4 text-emerald-800">إضافة منتج جديد</h3>
                            <div className="text-xs text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-100">
                                ملاحظة: تأكد من اختيار التوكيل الصحيح للمنتج.
                            </div>
                            <CreateProductForm agencies={agencies} createProductAction={createProduct} />
                        </div>
                    </div>
                )}

                {/* Products List - Main Content */}
                <div className={canManageProducts ? "lg:col-span-3" : "lg:col-span-4"}>
                    <ProductsList products={products} agencies={agencies} userRole={user.role} />
                </div>
            </div>
        </div>
    );
}
