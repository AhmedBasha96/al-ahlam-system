import { createWarehouse, getAgencies, getWarehouses, getCurrentUser } from "@/lib/actions";
import Link from "next/link";
import DeleteWarehouseButton from "./delete-warehouse-button";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
    let warehouses: any[] = [];
    let agencies: any[] = [];

    try {
        warehouses = await getWarehouses();
        agencies = await getAgencies();
    } catch (e) { console.error("Warehouses fetch error:", e); }

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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                            <h3 className="text-lg font-bold mb-4 text-emerald-800">إضافة مخزن جديد</h3>
                            <form action={createWarehouse} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن</label>
                                    <input name="name" type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="الاسم" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">تابع لتوكيل</label>
                                    <select name="agencyId" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required>
                                        <option value="">اختر التوكيل...</option>
                                        {agencies.map((agency: any) => (
                                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition">
                                    إضافة المخزن
                                </button>
                            </form>
                        </div>
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
                                    const agency = agencies.find((a: any) => a.id === warehouse.agencyId);
                                    return (
                                        <tr key={warehouse.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium">
                                                <Link href={`/dashboard/warehouses/${warehouse.id}`} className="text-emerald-700 hover:underline">
                                                    {warehouse.name}
                                                </Link>
                                            </td>
                                            <td className="p-4 text-gray-600">{agency?.name || 'غير محدد'}</td>
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
        </div>
    );
}
