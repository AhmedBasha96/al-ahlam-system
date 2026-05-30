'use client';

import { updateLoadingRequestStatus, completeLoadingRequest } from "@/lib/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RequestItem = {
    id: string;
    product: {
        name: string;
        image: string | null;
    };
    quantity: number;
}

type LoadingRequest = {
    id: string;
    representative: {
        name: string;
    };
    warehouse: {
        name: string;
    };
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    note: string | null;
    adminNote: string | null;
    createdAt: Date;
    items: RequestItem[];
}

type Props = {
    initialRequests: LoadingRequest[];
    userRole: string;
}

export default function LoadingRequestsList({ initialRequests, userRole }: Props) {
    const [loading, setLoading] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState<{ [key: string]: string }>({});
    const router = useRouter();

    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`هل أنت متأكد من ${status === 'APPROVED' ? 'الموافقة على' : 'رفض'} هذا الطلب؟`)) return;
        
        setLoading(id);
        try {
            await updateLoadingRequestStatus(id, status, adminNote[id]);
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : "حدث خطأ");
        } finally {
            setLoading(null);
        }
    };

    const handleComplete = async (id: string) => {
        if (!confirm("هل تم تحميل البضاعة بالفعل؟ هذا سيقوم بخصم الكميات من المخزن وإضافتها لعهدة المندوب.")) return;

        setLoading(id);
        try {
            await completeLoadingRequest(id);
            router.refresh();
            alert("تم إتمام الطلب وتحديث المخزون بنجاح");
        } catch (error) {
            alert(error instanceof Error ? error.message : "حدث خطأ");
        } finally {
            setLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">بانتظار المدير</span>;
            case 'APPROVED': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">بانتظار التحميل</span>;
            case 'COMPLETED': return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">تم التحميل</span>;
            case 'REJECTED': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-200">مرفوض</span>;
            default: return null;
        }
    };

    if (initialRequests.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4 text-gray-200">🚚</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد طلبات تحميل حالياً</h3>
                <p className="text-gray-500">سيتم عرض طلبات التحميل هنا بمجرد إنشائها</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {initialRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-gray-800 font-mono text-xs">#{req.id.slice(0, 8)}</span>
                                {getStatusBadge(req.status)}
                            </div>
                            <p className="text-sm text-gray-600">
                                <span className="font-bold">المندوب:</span> {req.representative.name}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-bold">من مخزن:</span> {req.warehouse.name}
                            </p>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</p>
                            <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleTimeString('ar-EG', { timeStyle: 'short' })}</p>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="p-4 flex-1">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">الأصناف المطلوبة:</h4>
                        <div className="space-y-2">
                            {req.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 p-2 rounded-lg text-sm transition hover:border-emerald-200 hover:shadow-xs group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 min-w-[32px] rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {item.product.image ? (
                                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] text-gray-300">🖼️</span>
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-800">{item.product.name}</span>
                                    </div>
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md group-hover:scale-110 transition">
                                        {item.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {req.note && (
                            <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-800 italic">
                                <span className="font-bold not-italic ml-1">ملاحظة المندوب:</span> "{req.note}"
                            </div>
                        )}
                        {req.adminNote && (
                            <div className="mt-2 p-3 bg-red-50/50 rounded-lg border border-red-100 text-sm text-red-800 italic">
                                <span className="font-bold not-italic ml-1">ملاحظة الإدارة:</span> "{req.adminNote}"
                            </div>
                        )}
                    </div>

                    {/* Admin Note Input */}
                    {(userRole === 'MANAGER' || userRole === 'ADMIN') && req.status === 'PENDING' && (
                        <div className="px-4 pb-2">
                            <textarea
                                placeholder="إضافة ملاحظات الإدارة (اختياري)..."
                                value={adminNote[req.id] || ""}
                                onChange={(e) => setAdminNote({ ...adminNote, [req.id]: e.target.value })}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:ring-1 focus:ring-emerald-500 outline-none h-16"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-4 border-t border-gray-50 flex gap-2">
                        {(userRole === 'MANAGER' || userRole === 'ADMIN') && req.status === 'PENDING' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                    disabled={loading === req.id}
                                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 text-sm font-bold shadow-sm"
                                >
                                    {loading === req.id ? 'جاري...' : (userRole === 'ADMIN' ? '✅ موافقة (أدمن)' : '✅ موافقة')}
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                    disabled={loading === req.id}
                                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition disabled:opacity-50 text-sm font-bold border border-red-100"
                                >
                                    {loading === req.id ? 'جاري...' : '❌ رفض'}
                                </button>
                            </>
                        )}

                        {userRole === 'WAREHOUSE_KEEPER' && req.status === 'APPROVED' && (
                            <button
                                onClick={() => handleComplete(req.id)}
                                disabled={loading === req.id}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-bold shadow-sm flex items-center justify-center gap-2"
                            >
                                {loading === req.id ? 'جاري التحديث...' : (
                                    <>
                                        <span>🚚</span>
                                        تم التحميل (تحديث المخزون)
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
