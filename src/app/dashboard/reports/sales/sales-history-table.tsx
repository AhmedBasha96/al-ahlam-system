'use client';

import { useState, Fragment } from "react";
import { updateSalesSession } from "@/lib/actions";
import SalesInvoiceModal from "../../reps/[id]/sales-invoice-modal";

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

    const isAuthorized = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'ACCOUNTANT';
    const canEditItems = userRole === 'ADMIN' || userRole === 'MANAGER';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase border-b border-gray-100">
                    <tr>
                        <th className="p-4">تاريخ الجلسة</th>
                        <th className="p-4">المندوب</th>
                        <th className="p-4">العميل</th>
                        <th className="p-4">الحالة / الدفع</th>
                        <th className="p-4">إجمالي المبيعات</th>
                        <th className="p-4 text-center">التفاصيل</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sessions.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-gray-400 italic">
                                لا توجد جلسات مبيعات مسجلة لهذه الفترة.
                            </td>
                        </tr>
                    ) : sessions.map((session) => (
                        <Fragment key={session.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">
                                    {new Date(session.date).toLocaleDateString('en-US')}
                                    <span className="text-[10px] text-gray-400 mr-2">
                                        {new Date(session.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-emerald-700">
                                    {session.repName}
                                </td>
                                <td className="p-4 text-gray-900 font-medium">
                                    {session.customerName || <span className="text-gray-400 italic text-xs">غير محدد</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${session.paymentType === 'CASH' ? 'bg-green-100 text-green-700' :
                                        session.paymentType === 'CREDIT' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {session.paymentType === 'CASH' ? 'كاش' :
                                            session.paymentType === 'CREDIT' ? 'آجل' :
                                                'جزئي'}
                                    </span>
                                    {session.paymentType === 'PARTIAL' && (
                                        <p className="text-[10px] text-gray-500 mt-1">مدفوع: {session.paidAmount}</p>
                                    )}
                                </td>
                                <td className="p-4 font-black text-gray-900">
                                    {session.totalAmount.toLocaleString('en-US')} ج.م
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setViewingSession(session)}
                                            className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                                        >
                                            عرض وفواتير 📄
                                        </button>
                                        {(isAuthorized && session.paymentType !== 'CASH') && (
                                            <button
                                                onClick={() => setPaymentSession(session)}
                                                className="bg-orange-50 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-orange-100 transition"
                                            >
                                                تحصيل 💰
                                            </button>
                                        )}
                                        {canEditItems && (
                                            <button
                                                onClick={() => setEditingSession(session)}
                                                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                                            >
                                                تعديل ✏️
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                                            className="text-gray-400 hover:text-gray-600 font-bold text-sm underline ml-2"
                                        >
                                            {expandedId === session.id ? 'إخفاء' : 'الأصناف'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            {expandedId === session.id && (
                                <tr className="bg-emerald-50/30">
                                    <td colSpan={6} className="p-4">
                                        <div className="bg-white rounded-xl border border-emerald-100 shadow-inner overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-emerald-100/50 text-emerald-800 font-bold">
                                                    <tr>
                                                        <th className="p-2">الصنف</th>
                                                        <th className="p-2 text-center">الكمية</th>
                                                        <th className="p-2 text-center">السعر</th>
                                                        <th className="p-2 text-center">الإجمالي</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-emerald-50">
                                                    {session.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="p-2 font-medium">{item.productName}</td>
                                                            <td className="p-2 text-center font-bold text-emerald-600">{item.quantity}</td>
                                                            <td className="p-2 text-center text-gray-500">{item.price.toLocaleString('en-US')}</td>
                                                            <td className="p-2 text-center font-black">{item.total.toLocaleString('en-US')}</td>
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
                <SalesInvoiceModal
                    id={viewingSession.id}
                    repName={viewingSession.repName}
                    customerName={viewingSession.customerName}
                    items={viewingSession.items}
                    paymentInfo={{
                        type: viewingSession.paymentType,
                        paidAmount: viewingSession.paidAmount,
                        totalAmount: viewingSession.totalAmount
                    }}
                    date={viewingSession.date}
                    onClose={() => setViewingSession(null)}
                />
            )}

            {/* Edit Modal */}
            {editingSession && (
                <SalesInvoiceModal
                    id={editingSession.id}
                    repName={editingSession.repName}
                    customerName={editingSession.customerName}
                    items={editingSession.items}
                    paymentInfo={{
                        type: editingSession.paymentType,
                        paidAmount: editingSession.paidAmount,
                        totalAmount: editingSession.totalAmount
                    }}
                    date={editingSession.date}
                    editable={true}
                    onUpdate={updateSalesSession}
                    onClose={() => {
                        setEditingSession(null);
                        window.location.reload(); // Refresh to show updated data
                    }}
                />
            )}
            {/* Payment Settlement Modal */}
            {paymentSession && (
                <SalesInvoiceModal
                    id={paymentSession.id}
                    repName={paymentSession.repName}
                    customerName={paymentSession.customerName}
                    items={paymentSession.items}
                    paymentInfo={{
                        type: paymentSession.paymentType,
                        paidAmount: paymentSession.paidAmount,
                        totalAmount: paymentSession.totalAmount
                    }}
                    date={paymentSession.date}
                    paymentOnly={true}
                    onUpdate={updateSalesSession}
                    onClose={() => {
                        setPaymentSession(null);
                        window.location.reload();
                    }}
                />
            )}
        </div >
    );
}
