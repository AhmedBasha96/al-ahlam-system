'use client';

import { deleteSupplier } from "@/lib/actions/suppliers";
import { Trash2 } from "lucide-react";

export default function DeleteSupplierButton({ id, name, userRole }: { id: string, name: string, userRole: string }) {
    if (userRole !== 'ADMIN') return null;

    return (
        <button
            onClick={async () => {
                if (confirm(`هل أنت متأكد من حذف المورد "${name}"؟`)) {
                    try {
                        await deleteSupplier(id);
                        window.location.reload();
                    } catch (error: any) {
                        alert(error.message || "حدث خطأ أثناء الحذف");
                    }
                }
            }}
            className="px-6 bg-red-50 text-red-600 font-bold py-3 rounded-2xl hover:bg-red-100 transition-all active:scale-95"
            title="حذف المورد"
        >
            <Trash2 className="w-5 h-5" />
        </button>
    );
}
