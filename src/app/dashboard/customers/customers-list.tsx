'use client';

import { updateCustomer } from "@/lib/actions";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EditCustomerModal from './edit-customer-modal';

type Customer = {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    representativeIds: string[];
    agencyId: string;
    totalDebt: number;
};

type Props = {
    customers: Customer[];
    representatives: { id: string, name: string }[];
    agencies: { id: string, name: string }[];
    userRole?: string;
};

export default function CustomersList({ customers, representatives, agencies, userRole }: Props) {
    const isRep = userRole === 'SALES_REPRESENTATIVE';
    const [search, setSearch] = useState('');
    const [repFilter, setRepFilter] = useState('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.phone && c.phone.includes(search));
        const representativeIds = c.representativeIds || [];
        const matchesRep = repFilter === '' || representativeIds.includes(repFilter);
        return matchesSearch && matchesRep;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="بحث باسم العميل أو رقم الهاتف..."
                        className="w-full border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="md:w-64">
                    <select
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm text-sm font-bold appearance-none"
                        value={repFilter}
                        onChange={(e) => setRepFilter(e.target.value)}
                    >
                        <option value="">كل المندوبين</option>
                        {representatives.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">العميل</th>
                            <th className="px-6 py-4">الهاتف</th>
                            <th className="px-6 py-4">المندوب</th>
                            <th className="px-6 py-4">التوكيل</th>
                            <th className="px-6 py-4 text-emerald-800">المديونية (ج.م)</th>
                            <th className="px-6 py-4 text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredCustomers.map((customer) => {
                            const customerRepIds = customer?.representativeIds || [];
                            const reps = representatives.filter(r => customerRepIds.includes(r.id));
                            return (
                                <tr key={customer.id} className="hover:bg-emerald-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{customer.name}</div>
                                        <div className="text-xs text-gray-400">{customer.address || 'بدون عنوان'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-emerald-700">
                                        {customer.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {reps.length > 0 ? reps.map(rep => (
                                                <span key={rep.id} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold whitespace-nowrap">
                                                    👤 {rep.name}
                                                </span>
                                            )) : (
                                                <span className="text-gray-400 text-xs italic">غير محدد</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-red-600">
                                            {(customer.totalDebt || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                                        <Link
                                            href={`/dashboard/customers/${customer.id}`}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
                                        >
                                            كشف حساب 📊
                                        </Link>
                                        <Link
                                            href={`/dashboard/reps/${(customer?.representativeIds && customer?.representativeIds[0]) || 'unknown'}?customerId=${customer.id}`}
                                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition shadow-sm whitespace-nowrap"
                                        >
                                            عمل فاتورة 📄
                                        </Link>
                                        {!isRep && (
                                            <button
                                                onClick={() => setEditingCustomer(customer)}
                                                className="text-emerald-600 hover:text-emerald-800 p-2 transition-colors"
                                                title="تعديل"
                                            >
                                                ✏️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredCustomers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                    لا يوجد عملاء مطابقين للبحث
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Edit Modal */}
            {editingCustomer && (
                <EditCustomerModal
                    customer={editingCustomer}
                    representatives={representatives}
                    agencies={agencies}
                    updateCustomerAction={updateCustomer}
                    closeModal={() => setEditingCustomer(null)}
                />
            )}
        </div>
    );
}
