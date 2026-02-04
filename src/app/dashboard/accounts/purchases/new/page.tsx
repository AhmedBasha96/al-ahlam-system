import PurchaseForm from "./purchase-form";
import { getWarehouses, getProducts } from "@/lib/actions";

export default async function NewPurchasePage() {
    const warehouses = await getWarehouses();
    const rawProducts = await getProducts();

    const products = rawProducts.map(p => ({
        ...p,
        factoryPrice: Number(p.factoryPrice),
        wholesalePrice: Number(p.wholesalePrice),
        retailPrice: Number(p.retailPrice)
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">إضافة فاتورة مشتريات</h2>
            </div>

            <PurchaseForm warehouses={warehouses} products={products} />
        </div>
    );
}
