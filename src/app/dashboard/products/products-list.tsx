'use client';

import { deleteProduct, updateProduct } from "@/lib/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import EditProductModal from "./edit-product-modal";

type Product = {
    id: string;
    name: string;
    description?: string;
    barcode?: string | null;
    factoryPrice: number;
    wholesalePrice: number;
    retailPrice: number;
    agencyId: string;
    supplierId?: string | null;
    image: string | null;
    createdAt: string;
    priceUpdatedAt?: string;
    unitsPerCarton: number;
    unitFactoryPrice: number;
    unitWholesalePrice: number;
    unitRetailPrice: number;
};

type Props = {
    products: Product[];
    agencies: Array<{ id: string, name: string }>;
    suppliers: Array<{ id: string, name: string, agencyId: string }>;
    userRole?: string;
}

export default function ProductsList({ products, agencies, suppliers, userRole }: Props) {
    const canEditOrDelete = userRole === 'ADMIN' || userRole === 'MANAGER';
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
            await deleteProduct(id);
            router.refresh();
        }
    }

    const getAgencyName = (id: string) => {
        return agencies.find(a => a.id === id)?.name || 'غير معروف';
    }

    const getSupplierName = (id?: string | null) => {
        if (!id) return null;
        return suppliers.find(s => s.id === id)?.name || 'غير معروف';
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">لا توجد منتجات حتى الآن</p>
                    </div>
                ) : products.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden hover:shadow-md transition group">
                        <div className="h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-300">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 max-w-[90%]">
                                <div className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 font-bold whitespace-nowrap overflow-hidden">
                                    <span className="text-emerald-400">{getAgencyName(product.agencyId)}</span>
                                    <span className="text-slate-500 opacity-50">&gt;</span>
                                    <span className="text-blue-300 truncate">{getSupplierName(product.supplierId)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
                            {product.barcode && (
                                <div className="text-[10px] text-gray-400 font-mono mb-1">
                                    {product.barcode}
                                </div>
                            )}
                            {product.priceUpdatedAt && (
                                <div className="text-[10px] text-emerald-600 font-medium">
                                    تاريخ آخر تحديث سعر: {new Date(product.priceUpdatedAt).toLocaleDateString('ar-EG')}
                                </div>
                            )}

                            <div className="space-y-1 my-3 text-sm">
                                {canEditOrDelete && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>سعر المصنع:</span>
                                        <span className="font-semibold">{product.factoryPrice.toLocaleString('en-US')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>سعر الجملة:</span>
                                    <span className="font-semibold">{product.wholesalePrice.toLocaleString('en-US')}</span>
                                </div>
                                <div className="flex justify-between text-emerald-700 bg-emerald-50 p-1 rounded px-2 mt-1">
                                    <span>سعر القطاعي:</span>
                                    <span className="font-bold">{product.retailPrice.toLocaleString('en-US')}ج.م</span>
                                </div>

                                {/* Sub-unit details */}
                                <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                                    <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                                        <span className="text-[10px] font-black text-blue-600">عدد القطع:</span>
                                        <span className="text-xs font-black text-blue-800 bg-white px-2 py-0.5 rounded shadow-sm">{(product as any).unitsPerCarton || 1}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 mt-2">
                                        <div className="text-center">
                                            <span className="block text-[8px] text-slate-400 font-bold">قطعة (مصنع)</span>
                                            <span className="text-[10px] font-black text-slate-700">{(product as any).unitFactoryPrice || 0}</span>
                                        </div>
                                        <div className="text-center border-x border-slate-100">
                                            <span className="block text-[8px] text-slate-400 font-bold">قطعة (جملة)</span>
                                            <span className="text-[10px] font-black text-slate-700">{(product as any).unitWholesalePrice || 0}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[8px] text-emerald-500 font-bold">قطعة (قطاعي)</span>
                                            <span className="text-[10px] font-black text-emerald-700">{(product as any).unitRetailPrice || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {canEditOrDelete && (
                                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => setEditingProduct(product)}
                                        className="flex-1 bg-emerald-50 text-emerald-600 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-100 transition"
                                    >
                                        تعديل
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 bg-red-50 text-red-500 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                                    >
                                        حذف
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    agencies={agencies}
                    suppliers={suppliers}
                    updateProductAction={updateProduct}
                    closeModal={() => setEditingProduct(null)}
                />
            )}
        </>
    );
}
