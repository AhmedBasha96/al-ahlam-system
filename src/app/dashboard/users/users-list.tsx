'use client';

import { deleteUser, updateUser } from "@/lib/actions";
import { useState } from "react";
import EditUserModal from "./edit-user-modal";

type User = {
    id: string;
    username: string;
    name: string;
    role: string;
    agencyId?: string;
    agencyIds?: string[];
    image: string | null;
};

type Props = {
    users: User[];
    agencies: Array<{ id: string, name: string }>;
}

export default function UsersList({ users, agencies }: Props) {
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
            await deleteUser(id);
        }
    }

    const getAgencyNames = (user: User) => {
        const ids = user.agencyIds || (user.agencyId ? [user.agencyId] : []);
        if (ids.length === 0) return 'الكل / غير محدد';

        const names = ids.map(id => agencies.find(a => a.id === id)?.name || 'غير معروف');
        return names.join('، ');
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'مدير النظام';
            case 'MANAGER': return 'مدير توكيلات';
            case 'ACCOUNTANT': return 'محاسب';
            case 'WAREHOUSE_KEEPER': return 'أمين مخزن';
            default: return role;
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'text-red-600 bg-red-50';
            case 'MANAGER': return 'text-blue-600 bg-blue-50';
            case 'ACCOUNTANT': return 'text-emerald-600 bg-emerald-50';
            case 'WAREHOUSE_KEEPER': return 'text-orange-600 bg-orange-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-emerald-50 text-emerald-900">
                        <tr>
                            <th className="p-4 font-semibold">المستخدم</th>
                            <th className="p-4 font-semibold">الدور</th>
                            <th className="p-4 font-semibold">التخصيص</th>
                            <th className="p-4 font-semibold">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                                    لا يوجد مستخدمين حتى الآن
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs overflow-hidden">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{user.name}</div>
                                        <div className="text-xs text-gray-500">@{user.username}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`rounded-lg text-xs font-medium px-2 py-1 ${getRoleColor(user.role)}`}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500 text-sm whitespace-normal max-w-xs">{getAgencyNames(user)}</td>
                                <td className="p-4">
                                    <button
                                        className="text-emerald-600 hover:text-emerald-800 font-medium ml-3"
                                        onClick={() => setEditingUser(user)}
                                    >
                                        تعديل
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-700 font-medium"
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    agencies={agencies}
                    updateUserAction={updateUser}
                    closeModal={() => setEditingUser(null)}
                />
            )}
        </>
    );
}
