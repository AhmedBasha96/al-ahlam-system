'use client';

import { useState } from "react";
import { approveSupplierReturn, rejectSupplierReturn } from "@/lib/actions/suppliers";
import { Check, X, Package, Clock, Building2 } from "lucide-react";

export default function ApprovalsList({ initialTransactions }: { initialTransactions: any[] }) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleApprove = async (id: string) => {
        if (!confirm('هل أنت متأكد من اعتماد طلب المرتجع وخصم المبلغ من حساب المورد؟')) return;
        setLoading(id);
        try {
            await approveSupplierReturn(id);
            alert("تم اعتماد طلب المرتجع بنجاح");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('هل أنت متأكد من رفض طلب المرتجع وإعادة البضاعة للمخزن؟')) return;
        setLoading(id);
        try {
            await rejectSupplierReturn(id);
            alert("تم رفض طلب المرتجع وإرجاع البضاعة للمخزن");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(null);
        }
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    if (initialTransactions.length === 0) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 font-bold">
                لا توجد طلبات معلقة حالياً
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {initialTransactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative group transition-all hover:shadow-md">
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        قيد الانتظار
                    </div>

                    <div className="p-6 md:p-8 flex flex-col xl:flex-row gap-8">
                        {/* Transaction Meta */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-800">
                                        {tx.type === 'RETURN_OUT' ? 'طلب مرتجع للمصنع' : 'عملية غير معروفة'}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-bold mt-1">
                                        تاريخ الطلب: {new Date(tx.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-xs text-slate-400 font-bold mb-1">بواسطة (أمين المخزن)</p>
                                    <p className="font-black text-slate-800">{tx.user?.name}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl flex flex-col justify-center">
                                    <p className="text-xs text-slate-400 font-bold mb-1">المورد المستلم</p>
                                    <div className="flex items-center gap-1 font-black text-slate-800">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        <span>{tx.supplier?.name || "غير محدد"}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl flex flex-col justify-center">
                                    <p className="text-xs text-slate-400 font-bold mb-1">المخزن المسحوب منه</p>
                                    <p className="font-black text-slate-800 truncate" title={tx.warehouse?.name}>{tx.warehouse?.name || "غير محدد"}</p>
                                </div>
                                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                                    <p className="text-xs text-rose-400 font-bold mb-1">القيمة الإجمالية</p>
                                    <p className="font-black text-rose-600 text-lg">{formatMoney(Number(tx.totalAmount))}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="flex-1 min-w-[300px] border border-slate-100 rounded-2xl overflow-hidden self-start">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 text-slate-400 font-bold">
                                    <tr>
                                        <th className="p-3">الصنف</th>
                                        <th className="p-3 text-center">الكمية</th>
                                        <th className="p-3 text-center">السعر</th>
                                        <th className="p-3">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tx.items.map((item: any) => (
                                        <tr key={item.id} className="font-medium text-slate-700">
                                            <td className="p-3">{item.product?.name}</td>
                                            <td className="p-3 text-center font-black text-indigo-600">{item.quantity}</td>
                                            <td className="p-3 text-center">{formatMoney(Number(item.price))}</td>
                                            <td className="p-3 font-black text-slate-800">{formatMoney(item.quantity * Number(item.price))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div className="flex xl:flex-col gap-3 justify-center min-w-[140px] border-t xl:border-t-0 xl:border-r border-slate-100 pt-6 xl:pt-0 xl:pr-6">
                            <button
                                onClick={() => handleApprove(tx.id)}
                                disabled={loading !== null}
                                className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {loading === tx.id ? '...' : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>اعتماد</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handleReject(tx.id)}
                                disabled={loading !== null}
                                className="flex-1 bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {loading === tx.id ? '...' : (
                                    <>
                                        <X className="w-5 h-5" />
                                        <span>رفض</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
