'use client';

import { useState, Fragment } from "react";
import { updateTransaction } from "@/lib/actions";
import TransactionModal from "@/components/shared/transaction-modal";

type SoldItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

type SalesSession = {
    id: string;
    repId: string;
    repName: string;
    items: SoldItem[];
    totalAmount: number;
    customerId?: string;
    customerName?: string;
    paymentType: 'CASH' | 'CREDIT' | 'PARTIAL';
    paidAmount?: number;
    remainingAmount?: number;
    date: Date | string;
}

export default function SalesHistoryTable({ sessions, userRole }: { sessions: SalesSession[], userRole?: string }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewingSession, setViewingSession] = useState<SalesSession | null>(null);
    const [editingSession, setEditingSession] = useState<SalesSession | null>(null);
    const [paymentSession, setPaymentSession] = useState<SalesSession | null>(null);

    const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY';
    const canPay = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'ACCOUNTANT';

    return (
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th className="p-6">التوقيت والتاريخ</th>
                        <th className="p-6">المندوب</th>
                        <th className="p-6">العميل</th>
                        <th className="p-6">الحالة المالية</th>
                        <th className="p-6">القيمة الكلية</th>
                        <th className="p-6 text-center">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sessions.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-16 text-center text-slate-300 italic font-bold">
                                لا توجد جلسات مبيعات مسجلة لهذه الفترة.
                            </td>
                        </tr>
                    ) : sessions.map((session) => (
                        <Fragment key={session.id}>
                            <tr className="group hover:bg-slate-50/50 transition-all">
                                <td className="p-6 text-sm font-bold text-slate-600">
                                    {new Date(session.date).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' })}
                                    <span className="text-[10px] text-slate-400 mr-2 font-mono">
                                        {new Date(session.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </td>
                                <td className="p-6 text-indigo-600 font-black">{session.repName}</td>
                                <td className="p-6 text-slate-800 font-bold">
                                    {session.customerName || <span className="text-slate-300 italic text-xs">عميل نقدي</span>}
                                </td>
                                <td className="p-6">
                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter ${session.paymentType === 'CASH' ? 'bg-emerald-100 text-emerald-700' :
                                        session.paymentType === 'CREDIT' ? 'bg-rose-100 text-rose-700' :
                                            'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {session.paymentType === 'CASH' ? 'كاش' :
                                            session.paymentType === 'CREDIT' ? 'آجل' :
                                                'جزئي'}
                                    </span>
                                </td>
                                <td className="p-6 font-black text-slate-900 text-lg">
                                    {session.totalAmount.toLocaleString()} <span className="text-[10px] text-slate-400">ج.م</span>
                                </td>
                                <td className="p-6 text-center">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button
                                            onClick={() => setViewingSession(session)}
                                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 transition shadow-lg shadow-slate-200"
                                        >
                                            عرض الفاتورة 📄
                                        </button>
                                        {(canPay && session.paymentType !== 'CASH') && (
                                            <button
                                                onClick={() => setPaymentSession(session)}
                                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                                            >
                                                تحصيل 📥
                                            </button>
                                        )}
                                        {canEdit && (
                                            <button
                                                onClick={() => setEditingSession(session)}
                                                className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-100 transition"
                                            >
                                                تعديل ✏️
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                                            className="text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest px-2"
                                        >
                                            {expandedId === session.id ? 'إخفاء' : 'الأصناف'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            {expandedId === session.id && (
                                <tr className="bg-slate-50/30">
                                    <td colSpan={6} className="p-6">
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-inner overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                                                    <tr>
                                                        <th className="p-4 text-right">الصنف</th>
                                                        <th className="p-4 text-center">الكمية</th>
                                                        <th className="p-4 text-center">السعر</th>
                                                        <th className="p-4 text-left">الإجمالي</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {session.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="p-4 font-bold text-slate-800">{item.productName}</td>
                                                            <td className="p-4 text-center font-black text-indigo-600">{item.quantity}</td>
                                                            <td className="p-4 text-center text-slate-500 font-mono">{item.price.toLocaleString()}</td>
                                                            <td className="p-4 text-left font-black text-slate-900">{item.total.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>
            {/* View Modal */}
            {viewingSession && (
                <TransactionModal
                    id={viewingSession.id}
                    partyName={viewingSession.customerName || "عميل نقدي"}
                    userName={viewingSession.repName}
                    items={viewingSession.items}
                    paymentInfo={{
                        type: viewingSession.paymentType,
                        paidAmount: viewingSession.paidAmount,
                        totalAmount: viewingSession.totalAmount
                    }}
                    date={viewingSession.date}
                    onClose={() => setViewingSession(null)}
                    type="SALE"
                />
            )}

            {/* Edit Modal */}
            {editingSession && (
                <TransactionModal
                    id={editingSession.id}
                    partyName={editingSession.customerName || "عميل نقدي"}
                    userName={editingSession.repName}
                    items={editingSession.items}
                    paymentInfo={{
                        type: editingSession.paymentType,
                        paidAmount: editingSession.paidAmount,
                        totalAmount: editingSession.totalAmount
                    }}
                    date={editingSession.date}
                    editable={true}
                    onUpdate={updateTransaction}
                    onClose={() => {
                        setEditingSession(null);
                        window.location.reload(); // Refresh to show updated data
                    }}
                    type="SALE"
                />
            )}
            {/* Payment Settlement Modal */}
            {paymentSession && (
                <TransactionModal
                    id={paymentSession.id}
                    partyName={paymentSession.customerName || "عميل نقدي"}
                    userName={paymentSession.repName}
                    items={paymentSession.items}
                    paymentInfo={{
                        type: paymentSession.paymentType,
                        paidAmount: paymentSession.paidAmount,
                        totalAmount: paymentSession.totalAmount
                    }}
                    date={paymentSession.date}
                    paymentOnly={true}
                    onUpdate={updateTransaction}
                    onClose={() => {
                        setPaymentSession(null);
                        window.location.reload();
                    }}
                    type="SALE"
                />
            )}
        </div >
    );
}
