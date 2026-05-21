'use client';

import { deleteWarehouse } from "@/lib/actions";
import { Trash2 } from "lucide-react";

export default function DeleteWarehouseButton({ id, name, userRole }: { id: string, name: string, userRole: string }) {
    if (userRole !== 'ADMIN') return null;

    return (
        <button
            onClick={async () => {
                if (confirm(`هل أنت متأكد من حذف المخزن "${name}"؟ سيم حذف جميع الأرصدة المرتبطة به!`)) {
                    try {
                        await deleteWarehouse(id);
                        window.location.reload();
                    } catch (error: any) {
                        alert(error.message || "حدث خطأ أثناء الحذف");
                    }
                }
            }}
            className="bg-red-50 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-100 transition shadow-sm"
            title="حذف المخزن"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    );
}
