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
import { Wallet, DollarSign, AlertCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui-custom/confirm-dialog";

interface SupplierPaymentModalProps {
    supplierId: string;
    supplierName: string;
    agencyId: string;
    currentBalance: number;
}

export function SupplierPaymentModal({ supplierId, supplierName, agencyId, currentBalance }: SupplierPaymentModalProps) {
    const [open, setOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);

    const handleConfirmSubmit = async () => {
        if (!formData) return;
        setLoading(true);
        try {
            await createAccountRecord(formData);
            setOpen(false);
            setShowConfirm(false);
            window.location.reload();
        } finally {
            setLoading(false);
        }
    };

    const isOverpaying = paymentAmount > currentBalance && currentBalance > 0;
    const hasNoDebt = currentBalance <= 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1">
                    <DollarSign className="w-5 h-5" />
                    تسجيل دفع للمورد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <form id="supplier-payment-form">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 border-b pb-2 mb-2">تسجيل دفعة سداد للمورد</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            سيتم تسجيل هذا المبلغ كدفع للمورد <strong className="text-emerald-600">{supplierName}</strong>.
                            سيخصم هذا المبلغ من خزينة التوكيل المحددة.
                        </DialogDescription>
                    </DialogHeader>

                    {hasNoDebt && (
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 mt-4">
                            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                            <div className="text-sm text-rose-800 font-bold leading-relaxed">
                                تنبيه: لا توجد مديونية حالية لهذا المورد، ولا يمكن تسجيل دفعة سداد له.
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 py-6">
                        <input type="hidden" name="type" value="EXPENSE" />
                        <input type="hidden" name="category" value="سداد مديونية" />
                        <input type="hidden" name="agencyId" value={agencyId} />
                        <input type="hidden" name="supplierId" value={supplierId} />

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <Label htmlFor="amount" className="text-sm font-bold text-slate-700">المبلغ المدفوع (ج.م)</Label>
                                <span className="text-xs font-bold text-slate-400">المديونية الحالية: {currentBalance.toLocaleString()} ج.م</span>
                            </div>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                className="text-2xl font-black text-rose-600 bg-rose-50 border-rose-100 focus:ring-rose-500 h-14"
                                required
                            />
                            {isOverpaying && (
                                <p className="text-[10px] text-rose-600 font-bold animate-pulse">
                                    ⚠️ تنبيه: المبلغ المدفوع يتجاوز إجمالي المديونية!
                                </p>
                            )}
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
                        <Button
                            type="button"
                            disabled={loading || hasNoDebt}
                            onClick={() => {
                                const form = document.getElementById('supplier-payment-form') as HTMLFormElement;
                                if (form.checkValidity()) {
                                    setFormData(new FormData(form));
                                    setShowConfirm(true);
                                } else {
                                    form.reportValidity();
                                }
                            }}
                            className={`w-full font-bold py-6 rounded-2xl text-lg shadow-xl ${hasNoDebt ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white'}`}
                        >
                            {loading ? 'جاري تسجيل الدفعة...' : 'تأكيد عملية الدفع 💸'}
                        </Button>
                    </DialogFooter>
                </form>

                <ConfirmDialog
                    open={showConfirm}
                    onOpenChange={setShowConfirm}
                    onConfirm={handleConfirmSubmit}
                    title={isOverpaying ? "تأكيد دفع مبلغ زائد" : "تأكيد عملية السداد"}
                    description={
                        isOverpaying
                            ? `المبلغ (${paymentAmount.toLocaleString()}) أكبر من المديونية (${currentBalance.toLocaleString()}). هل تريد الاستمرار؟`
                            : "هل أنت متأكد من دفع هذا المبلغ للمورد؟ سيتم خصم المبلغ من الخزينة."
                    }
                    variant={isOverpaying ? 'warning' : 'default'}
                    confirmText="نعم، تأكيد الدفع"
                />
            </DialogContent>
        </Dialog>
    );
}
