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
import { Landmark, Wallet, Users, Building2 } from "lucide-react";

interface OpeningBalanceModalProps {
    type: 'TREASURY' | 'SUPPLIER' | 'CUSTOMER';
    id?: string;
    name?: string;
    agencyId?: string;
}

export function OpeningBalanceModal({ type, id, name, agencyId }: OpeningBalanceModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setLoading(true);
        // Form will be handled by the action, but we want to close the dialog
        // Actually, we can use a client-side wrapper to call the action and then close
    };

    const getTitle = () => {
        switch (type) {
            case 'TREASURY': return 'تعيين رصيد بداية المدة للخزينة';
            case 'SUPPLIER': return `رصيد بداية المدة للمورد: ${name}`;
            case 'CUSTOMER': return `رصيد بداية المدة للعميل: ${name}`;
        }
    };

    const getDescription = () => {
        switch (type) {
            case 'TREASURY': return 'سيتم إضافة هذا المبلغ كرصيد افتتاحي في الخزينة.';
            case 'SUPPLIER': return 'سيتم تسجيل هذا المبلغ كمديونية سابقة للمورد (مبلغ يطلبه المورد).';
            case 'CUSTOMER': return 'سيتم تسجيل هذا المبلغ كمديونية سابقة على العميل (مبلغ يطلبه المحل).';
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl">
                    <Landmark className="w-4 h-4" />
                    رصيد بداية المدة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <form action={async (formData) => {
                    setLoading(true);
                    try {
                        await createAccountRecord(formData);
                        setOpen(false);
                    } finally {
                        setLoading(false);
                    }
                }}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900">{getTitle()}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            {getDescription()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <input type="hidden" name="type" value="INCOME" />
                        <input type="hidden" name="category" value="رصيد بداية المدة" />
                        <input type="hidden" name="agencyId" value={agencyId || 'GENERAL'} />
                        {type === 'SUPPLIER' && <input type="hidden" name="supplierId" value={id} />}
                        {type === 'CUSTOMER' && <input type="hidden" name="customerId" value={id} />}

                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-sm font-bold text-slate-700">المبلغ (ج.م)</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="text-2xl font-black text-emerald-600 bg-emerald-50 focus:ring-emerald-500 h-12"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-bold text-slate-700">ملاحظات</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue="رصيد بداية المدة"
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm font-bold text-slate-700">التاريخ</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl text-lg">
                            {loading ? 'جاري الحفظ...' : 'حفظ الرصيد الافتتاحي'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
