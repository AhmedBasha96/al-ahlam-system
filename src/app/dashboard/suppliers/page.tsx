import Link from "next/link";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getAgencies, getCurrentUser } from "@/lib/actions";
import SupplierForm from "./supplier-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone, MapPin, Package, History, Wallet, UserCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
    let suppliers = await getSuppliers();
    let agencies = await getAgencies();
    const user = await getCurrentUser();

    // Serialize data to avoid render errors
    agencies = agencies.map((a: any) => ({
        ...a,
        createdAt: a.createdAt ? a.createdAt.toISOString() : undefined,
        updatedAt: a.updatedAt ? a.updatedAt.toISOString() : undefined,
    }));

    suppliers = suppliers.map((s: any) => ({
        ...s,
        createdAt: s.createdAt ? s.createdAt.toISOString() : undefined,
        updatedAt: s.updatedAt ? s.updatedAt.toISOString() : undefined,
        agency: s.agency ? {
            ...s.agency,
            createdAt: s.agency.createdAt ? s.agency.createdAt.toISOString() : undefined,
            updatedAt: s.agency.updatedAt ? s.agency.updatedAt.toISOString() : undefined,
        } : undefined
    }));

    // Permissions: Admin and Manager can manage suppliers
    const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';

    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">إدارة الموردين</h1>
                    <p className="text-slate-500 mt-1 font-medium">إدارة شركات التوريد والمنتجات والحسابات المالية التابعة لها</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    {suppliers.length} مورد مسجل
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Add Supplier Form */}
                {canManage && (
                    <div className="lg:col-span-1">
                        <Card className="border-blue-100 shadow-sm sticky top-6">
                            <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                                <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                    <UserCircle className="w-5 h-5" />
                                    إضافة مورد جديد
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <SupplierForm agencies={agencies} />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content: Suppliers List */}
                <div className={canManage ? "lg:col-span-3" : "lg:col-span-4"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {suppliers.length === 0 ? (
                            <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center">
                                <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold text-lg">لا يوجد موردين حالياً</p>
                            </div>
                        ) : suppliers.map((supplier: any) => (
                            <Card key={supplier.id} className="group hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden bg-white rounded-3xl">
                                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                                                <Building2 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 underline decoration-blue-200 underline-offset-4">{supplier.name}</h3>
                                                <p className="text-sm text-slate-400 font-medium mt-1">
                                                    التوكيل: <span className="text-indigo-600">{supplier.agency.name}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                                            <span className="text-sm font-semibold">{supplier.phone || 'غير مسجل'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
                                            <span className="text-sm font-semibold truncate">{supplier.address || 'غير مسجل'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mt-6">
                                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100 group-hover:bg-white group-hover:border-blue-200 transition-all">
                                            <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                            <div className="text-xs font-bold text-slate-400 uppercase">المنتجات</div>
                                            <div className="text-lg font-black text-slate-800">{supplier._count.products}</div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100 group-hover:bg-white group-hover:border-indigo-200 transition-all">
                                            <History className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                                            <div className="text-xs font-bold text-slate-400 uppercase">العمليات</div>
                                            <div className="text-lg font-black text-slate-800">{supplier._count.transactions}</div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100 group-hover:bg-white group-hover:border-purple-200 transition-all">
                                            <Wallet className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                                            <div className="text-xs font-bold text-slate-400 uppercase">الحسابات</div>
                                            <div className="text-lg font-black text-slate-800">{supplier._count.accounts}</div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <Link href={`/dashboard/suppliers/${supplier.id}`} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-200 active:scale-95 text-center">
                                            كشف حساب
                                        </Link>
                                        {canManage && (
                                            <button className="px-6 bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
                                                تعديل
                                            </button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
