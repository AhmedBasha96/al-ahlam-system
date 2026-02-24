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
import { recordOpeningStock } from "@/lib/actions";
import { Package, Landmark } from "lucide-react";

interface OpeningStockModalProps {
    warehouseId: string;
    product: {
        id: string;
        name: string;
        unitFactoryPrice: number;
    };
}

export function OpeningStockModal({ warehouseId, product }: OpeningStockModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 px-2 font-bold">
                    <Package className="w-4 h-4" />
                    بضاعة أول المدة
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <form action={async (formData) => {
                    setLoading(true);
                    try {
                        const res = await recordOpeningStock(formData);
                        if (res.success) {
                            setOpen(false);
                        } else {
                            alert(res.error);
                        }
                    } finally {
                        setLoading(false);
                    }
                }}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 leading-relaxed">
                            إضافة بضاعة أول المدة
                            <div className="text-sm text-emerald-600 mt-1">{product.name}</div>
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium pt-2">
                            سيتم إضافة هذه الكمية للمخزن كصرف افتتاحي. هذه العملية لا تسجل مديونية على المورد.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6 font-arabic">
                        <input type="hidden" name="warehouseId" value={warehouseId} />
                        <input type="hidden" name="productId" value={product.id} />

                        <div className="space-y-2">
                            <Label htmlFor="quantity" className="text-sm font-bold text-slate-700 font-arabic">الكمية (بالقطعة)</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                placeholder="0"
                                className="text-2xl font-black text-emerald-600 bg-emerald-50 focus:ring-emerald-500 h-12"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cost" className="text-sm font-bold text-slate-700 font-arabic">سعر التكلفة للقطعة (اختياري)</Label>
                            <Input
                                id="cost"
                                name="cost"
                                type="number"
                                step="0.01"
                                defaultValue={product.unitFactoryPrice}
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-sm font-bold text-slate-700 font-arabic">التاريخ</Label>
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
                        <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl text-lg">
                            {loading ? 'جاري الحفظ...' : 'حفظ بضاعة أول المدة'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
