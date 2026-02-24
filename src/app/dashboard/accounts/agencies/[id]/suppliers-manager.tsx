'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Building2, Phone, MapPin, X, Edit2, ExternalLink } from "lucide-react";
import SupplierForm from "@/app/dashboard/suppliers/supplier-form";
import Link from 'next/link';

interface Supplier {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    agencyId: string;
}

interface Props {
    agencyId: string;
    suppliers: Supplier[];
    agencies: any[];
}

export default function SuppliersManager({ agencyId, suppliers, agencies }: Props) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-indigo-500" />
                    الموردين المتعاقدين
                </h3>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingSupplier(null);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md active:scale-95 ${isAdding || editingSupplier
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    {isAdding || editingSupplier ? (
                        <><X className="w-4 h-4" /> إغلاق</>
                    ) : (
                        <><UserPlus className="w-4 h-4" /> إضافة مورد</>
                    )}
                </button>
            </div>

            {(isAdding || editingSupplier) && (
                <Card className="border-indigo-100 shadow-lg bg-indigo-50/30 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-indigo-900">
                            {editingSupplier ? `تعديل المورد: ${editingSupplier.name}` : 'بيانات المورد الجديد'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SupplierForm
                            agencies={agencies}
                            initialAgencyId={agencyId}
                            supplier={editingSupplier || undefined}
                            onSuccess={() => {
                                setIsAdding(false);
                                setEditingSupplier(null);
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold">لا يوجد موردين مسجلين لهذا التوكيل بعد</p>
                    </div>
                ) : (
                    suppliers.map((supplier) => (
                        <Card key={supplier.id} className="group hover:shadow-xl transition-all duration-300 border-none shadow-md overflow-hidden bg-white rounded-3xl relative">
                            <div className="h-1.5 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors"></div>
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-black text-slate-800 text-lg">{supplier.name}</h4>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingSupplier(supplier)}
                                            className="p-2 hover:bg-slate-100 rounded-full text-blue-500 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Phone className="w-4 h-4 text-slate-300" />
                                        {supplier.phone || 'بدون هاتف'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <MapPin className="w-4 h-4 text-slate-300" />
                                        <span className="truncate">{supplier.address || 'بدون عنوان'}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">الرصيد:</span>
                                        <span className={`font-black ${(supplier as any).currentBalance > 0 ? 'text-rose-600' : (supplier as any).currentBalance < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format((supplier as any).currentBalance || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex gap-2">
                                    <Link
                                        href={`/dashboard/suppliers/${supplier.id}`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-black transition-all"
                                    >
                                        <ExternalLink className="w-3.4 h-3.5" />
                                        كشف الحساب
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
