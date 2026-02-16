'use client';

import { deleteAgency, updateAgency } from "@/lib/actions";
import { useState } from "react";
import EditAgencyModal from "./edit-agency-modal";
import Link from "next/link";

type Agency = {
    id: string;
    name: string;
    createdAt: Date | string;
    image: string | null;
}

export default function AgenciesList({ agencies }: { agencies: Agency[] }) {
    const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا التوكيل؟")) {
            await deleteAgency(id);
        }
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-emerald-50 text-emerald-900">
                        <tr>
                            <th className="p-4 font-semibold">اسم التوكيل</th>
                            <th className="p-4 font-semibold">تاريخ الإضافة</th>
                            <th className="p-4 font-semibold">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {agencies.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400 text-sm">
                                    لا يوجد توكيلات حتى الآن
                                </td>
                            </tr>
                        ) : agencies.map((agency) => (
                            <tr key={agency.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs overflow-hidden">
                                        {agency.image ? (
                                            <img src={agency.image} alt={agency.name} className="w-full h-full object-cover" />
                                        ) : (
                                            agency.name.charAt(0)
                                        )}
                                    </div>
                                    {agency.name}
                                </td>
                                <td className="p-4 text-gray-500">
                                    {agency.createdAt instanceof Date
                                        ? agency.createdAt.toLocaleDateString('en-GB')
                                        : String(agency.createdAt)}
                                </td>
                                <td className="p-4">
                                    <Link
                                        href={`/dashboard/accounts/agencies/${agency.id}`}
                                        className="text-indigo-600 hover:text-indigo-800 font-medium ml-3"
                                    >
                                        الحسابات
                                    </Link>
                                    <button
                                        className="text-emerald-600 hover:text-emerald-800 font-medium ml-3"
                                        onClick={() => setEditingAgency(agency)}
                                    >
                                        تعديل
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-700 font-medium"
                                        onClick={() => handleDelete(agency.id)}
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingAgency && (
                <EditAgencyModal
                    agency={editingAgency}
                    updateAgencyAction={updateAgency}
                    closeModal={() => setEditingAgency(null)}
                />
            )}
        </>
    );
}
