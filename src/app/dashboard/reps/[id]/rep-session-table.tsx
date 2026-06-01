'use client';

import { useState, useMemo } from "react";
import { updateTransaction } from "@/lib/actions";
import TransactionModal from "@/components/shared/transaction-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Session = {
    id: string;
    type: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentType: 'CASH' | 'CREDIT' | 'PARTIAL';
    createdAt: Date | string;
    note?: string | null;
    customerId?: string | null;
    customer?: { name: string } | null;
    user: { name: string };
    items: any[];
};

type Props = {
    sessions: Session[];
    userRole?: string;
};

export default function RepSessionTable({ sessions, userRole }: Props) {
    const [viewingSession, setViewingSession] = useState<Session | null>(null);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredSessions = useMemo(() => {
        return sessions.filter(s => {
            const customerName = s.customer?.name?.toLowerCase() || "";
            const type = (s.type === 'SALE' ? 'مبيعات' :
                s.type === 'RETURN_IN' ? 'مرتجع' :
                    s.type === 'COLLECTION' ? 'تحصيل' : 'عملية').toLowerCase();
            const search = searchTerm.toLowerCase();
            return customerName.includes(search) || type.includes(search);
        });
    }, [sessions, searchTerm]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-gray-800">سجل العمليات والتحصيلات</h3>
                <div className="relative w-full md:w-64">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="ابحث بالعميل أو نوع العملية..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">النوع/البيان</TableHead>
                            <TableHead className="text-right">قيمة العملية</TableHead>
                            <TableHead className="text-right">المدفوع</TableHead>
                            <TableHead className="text-right">المتبقي</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                    {searchTerm ? "لا توجد نتائج مطابقة لبحثك" : "لا يوجد سجل عمليات لهذا المندوب"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSessions.map((session) => (
                                <TableRow key={session.id} className="group hover:bg-gray-50 transition-colors">
                                    <TableCell className="font-medium text-xs text-gray-500">
                                        {new Date(session.createdAt).toLocaleDateString('ar-EG')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700 text-sm">
                                                {session.type === 'SALE' ? 'مبيعات' :
                                                    session.type === 'RETURN_IN' ? 'مرتجع' :
                                                        session.type === 'COLLECTION' ? 'تحصيل' : 'عملية'}
                                            </span>
                                            {session.customer && (
                                                <span className="text-[10px] text-gray-400">العميل: {session.customer.name}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-700">{session.totalAmount.toLocaleString()} ج.م</TableCell>
                                    <TableCell className="text-emerald-600 font-bold">{session.paidAmount.toLocaleString()} ج.م</TableCell>
                                    <TableCell className={`font-bold ${session.remainingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                        {session.remainingAmount.toLocaleString()} ج.م
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setViewingSession(session)}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-800 transition shadow-sm"
                                            >
                                                عرض 📄
                                            </button>
                                            {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY') && (
                                                <button
                                                    onClick={() => setEditingSession(session)}
                                                    className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition shadow-sm"
                                                >
                                                    تعديل ✏️
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Modal */}
            {viewingSession && (
                <TransactionModal
                    id={viewingSession.id}
                    partyName={viewingSession.customer?.name || "عملية عامة"}
                    userName={viewingSession.user.name}
                    items={viewingSession.items.map(item => ({
                        productId: item.productId,
                        productName: item.product?.name || "منتج غير معروف",
                        quantity: item.quantity,
                        price: Number(item.price),
                        originalPrice: Number(item.originalPrice || item.price),
                        discountPercentage: Number(item.discountPercentage || 0),
                        taxPercentage: Number(item.taxPercentage || 0),
                        unitsPerCarton: item.product?.unitsPerCarton || 1,
                        total: item.quantity * Number(item.price)
                    }))}
                    paymentInfo={{
                        type: viewingSession.paymentType,
                        paidAmount: viewingSession.paidAmount,
                        totalAmount: viewingSession.totalAmount
                    }}
                    date={viewingSession.createdAt}
                    onClose={() => setViewingSession(null)}
                    type={viewingSession.type as any}
                />
            )}

            {/* Edit Modal */}
            {editingSession && (
                <TransactionModal
                    id={editingSession.id}
                    partyName={editingSession.customer?.name || "عملية عامة"}
                    userName={editingSession.user.name}
                    items={editingSession.items.map(item => ({
                        productId: item.productId,
                        productName: item.product?.name || "منتج غير معروف",
                        quantity: item.quantity,
                        price: Number(item.price),
                        originalPrice: Number(item.originalPrice || item.price),
                        discountPercentage: Number(item.discountPercentage || 0),
                        taxPercentage: Number(item.taxPercentage || 0),
                        unitsPerCarton: item.product?.unitsPerCarton || 1,
                        total: item.quantity * Number(item.price)
                    }))}
                    paymentInfo={{
                        type: editingSession.paymentType,
                        paidAmount: editingSession.paidAmount,
                        totalAmount: editingSession.totalAmount
                    }}
                    date={editingSession.createdAt}
                    editable={true}
                    onUpdate={updateTransaction}
                    onClose={() => {
                        setEditingSession(null);
                        window.location.reload();
                    }}
                    type={editingSession.type as any}
                />
            )}
        </div>
    );
}
