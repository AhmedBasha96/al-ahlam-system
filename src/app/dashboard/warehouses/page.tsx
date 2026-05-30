import { createWarehouse, getAgencies, getWarehouses, getCurrentUser } from "@/lib/actions";
import Link from "next/link";
import DeleteWarehouseButton from "./delete-warehouse-button";
import WarehouseForm from "./warehouse-form";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
    let warehouses: any[] = [];
    let agencies: any[] = [];

    try {
        warehouses = await getWarehouses();
    } catch (e) { console.error("Warehouses fetch error:", e); }

    try {
        agencies = await getAgencies();
    } catch (e) { console.error("Agencies fetch error:", e); }

    // Role-based Permission Check
    const currentUser = await getCurrentUser();
    const isAdminOrManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">إدارة المخازن</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Warehouse Form - Only for Admin/Manager */}
                {isAdminOrManager && (
                    <div className="lg:col-span-1">
                        <WarehouseForm agencies={agencies} />
                    </div>
                )}

                {/* Warehouses List */}
                <div className={isAdminOrManager ? "lg:col-span-2" : "lg:col-span-3 col-span-1"}>
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                        <table className="w-full text-right">
                            <thead className="bg-emerald-50 text-emerald-900">
                                <tr>
                                    <th className="p-4 font-semibold">اسم المخزن</th>
                                    <th className="p-4 font-semibold">التوكيل</th>
                                    <th className="p-4 font-semibold">تاريخ الإنشاء</th>
                                    <th className="p-4 font-semibold text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {warehouses.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-4xl">📂</span>
                                                <p className="text-gray-500 font-medium">لا توجد مخازن متاحة للعرض.</p>
                                                <p className="text-xs text-gray-400">تأكد من أن حسابك مرتبط بتوكيل معين لعرض مخازنه.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : warehouses.map((warehouse: any) => {
                                    return (
                                        <tr key={warehouse.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium">
                                                <Link href={`/dashboard/warehouses/${warehouse.id}`} className="text-emerald-700 hover:underline">
                                                    {warehouse.name}
                                                </Link>
                                            </td>
                                            <td className="p-4 text-gray-600">{warehouse.agency?.name || 'غير محدد'}</td>
                                            <td className="p-4 text-gray-500">
                                                {warehouse.createdAt instanceof Date
                                                    ? warehouse.createdAt.toLocaleDateString('en-GB')
                                                    : String(warehouse.createdAt)}
                                            </td>
                                            <td className="p-4 flex gap-2 justify-center">
                                                <Link href={`/dashboard/warehouses/${warehouse.id}`} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-sm hover:bg-emerald-200 transition">
                                                    إدارة الأرصدة
                                                </Link>
                                                <DeleteWarehouseButton id={warehouse.id} name={warehouse.name} userRole={currentUser.role} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Debug Info */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-[10px] font-mono text-gray-500 overflow-auto">
                <p>Debug: UserRole={currentUser.role}, UserId={currentUser.id}, TotalWH={warehouses.length}</p>
                <details>
                    <summary>Raw Warehouses Data</summary>
                    <pre>{JSON.stringify(warehouses, null, 2)}</pre>
                </details>
            </div>
        </div>
    );
}
