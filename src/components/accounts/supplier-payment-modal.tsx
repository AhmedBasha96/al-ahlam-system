'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAccountRecord } from "@/lib/actions/accounts";
import { Wallet, DollarSign } from "lucide-react";

interface SupplierPaymentModalProps {
    supplierId: string;
    supplierName: string;
    agencyId: string;
}

export function SupplierPaymentModal({ supplierId, supplierName, agencyId }: SupplierPaymentModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1">
                    <DollarSign className="w-5 h-5" />
                    تسجيل دفع للمورد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <form action={async (formData) => {
                    setLoading(true);
                    try {
                        await createAccountRecord(formData);
                        setOpen(false);
                        window.location.reload();
                    } finally {
                        setLoading(false);
                    }
                }}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-2 mb-2">تسجيل دفعة سداد للمورد</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            سيتم تسجيل هذا المبلغ كدفع للمورد <strong className="text-emerald-600">{supplierName}</strong>.
                            سيخصم هذا المبلغ من خزينة التوكيل المحددة.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <input type="hidden" name="type" value="EXPENSE" />
                        <input type="hidden" name="category" value="سداد مديونية" />
                        <input type="hidden" name="agencyId" value={agencyId} />
                        <input type="hidden" name="supplierId" value={supplierId} />

                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-bold text-slate-700">المبلغ المدفوع (ج.م)</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="text-2xl font-black text-rose-600 bg-rose-50 border-rose-100 focus:ring-rose-500 h-14"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-bold text-slate-700">البيان / ملاحظات</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={`سداد مديونية للمورد: ${supplierName}`}
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm font-bold text-slate-700">تاريخ الدفع</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-6 rounded-2xl text-lg shadow-xl">
                            {loading ? 'جاري تسجيل الدفعة...' : 'تأكيد عملية الدفع 💸'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
