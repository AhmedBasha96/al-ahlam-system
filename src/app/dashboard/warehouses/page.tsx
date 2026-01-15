import { createWarehouse, getWarehouses, getAgencies, deleteWarehouse, getUsers } from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
    const warehouses = await getWarehouses();
    const agencies = await getAgencies();

    // Mock Permission Check (In real app, use session)
    // For now, assume we show Create Form only if Admin/Manager
    const isAdminOrManager = true;

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
                <div className={isAdminOrManager ? "lg:col-span-2" : "col-span-3"}>
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                        <table className="w-full text-right">
                            <thead className="bg-emerald-50 text-emerald-900">
                                <tr>
                                    <th className="p-4 font-semibold">اسم المخزن</th>
                                    <th className="p-4 font-semibold">التوكيل</th>
                                    <th className="p-4 font-semibold">تاريخ الإنشاء</th>
                                    <th className="p-4 font-semibold">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {warehouses.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-400">لا توجد مخازن متاحة للعرض.</td>
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
                                            <td className="p-4 flex gap-2">
                                                <Link href={`/dashboard/warehouses/${warehouse.id}`} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-sm hover:bg-emerald-200 transition">
                                                    إدارة الأرصدة
                                                </Link>
                                                {isAdminOrManager && (
                                                    <>
                                                        <form action={deleteWarehouse.bind(null, warehouse.id)}>
                                                            <button className="text-red-500 hover:text-red-700 font-medium text-sm">حذف</button>
                                                        </form>
                                                    </>
                                                )}
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
