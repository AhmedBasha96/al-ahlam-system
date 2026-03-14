'use client';

import { useState } from "react";
import ReturnRequestModal from "@/components/shared/return-request-modal";
import { Undo2 } from "lucide-react";
import { createSupplierReturnRequest } from "@/lib/actions/suppliers";

export default function SupplierReturnWrapper({
    supplierId,
    supplierName,
    products,
    warehouses
}: {
    supplierId: string;
    supplierName: string;
    products: any[];
    warehouses: any[];
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSubmit = async (warehouseId: string, items: any[], totalAmount: number) => {
        await createSupplierReturnRequest(supplierId, warehouseId, items, totalAmount);
        alert("تم إرسال طلب المرتجع بنجاح وبانتظار اعتماد الحسابات.");
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-sm"
            >
                <Undo2 className="w-5 h-5" />
                مرتجع للمصنع
            </button>

            {isModalOpen && (
                <ReturnRequestModal
                    supplierId={supplierId}
                    supplierName={supplierName}
                    products={products}
                    warehouses={warehouses}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    );
}
