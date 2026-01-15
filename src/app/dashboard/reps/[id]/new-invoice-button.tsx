'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import RecordSaleModal from "./record-sale-modal";

type Product = {
    id: string;
    name: string;
    wholesalePrice: number;
}

type RepStock = {
    productId: string;
    quantity: number;
}

type Customer = {
    id: string;
    name: string;
}

type Props = {
    repId: string;
    repName: string;
    customers: Customer[];
    products: Product[];
    repStocks: RepStock[];
}

export default function NewInvoiceButton({ repId, repName, customers, products, repStocks }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const searchParams = useSearchParams();
    const customerId = searchParams.get('customerId');

    useEffect(() => {
        if (customerId) {
            setIsOpen(true);
        }
    }, [customerId]);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 flex items-center gap-2 scale-105 hover:scale-110 active:scale-95 duration-200"
            >
                <span className="text-xl">📄</span>
                تسجيل فاتورة جديدة (بيع مباشر)
            </button>

            {isOpen && (
                <RecordSaleModal
                    repId={repId}
                    repName={repName}
                    customers={customers}
                    products={products}
                    repStocks={repStocks}
                    onClose={() => setIsOpen(false)}
                    initialCustomerId={customerId || undefined}
                />
            )}
        </>
    );
}
