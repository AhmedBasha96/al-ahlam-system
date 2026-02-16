'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPurchaseInvoice } from '@/lib/actions/accounts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from 'lucide-react';

interface PurchaseFormProps {
    warehouses: any[];
    suppliers: any[];
    products: any[];
}

export default function PurchaseForm({ warehouses, suppliers, products }: PurchaseFormProps) {
    const router = useRouter();
    const [warehouseId, setWarehouseId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [items, setItems] = useState<{ productId: string, quantity: number, cost: number }[]>([
        { productId: "", quantity: 1, cost: 0 }
    ]);
    const [paidAmount, setPaidAmount] = useState(0);
    const [note, setNote] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get agencyId of selected warehouse
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    const agencyId = selectedWarehouse?.agencyId;

    // Filter suppliers by agency
    const filteredSuppliers = suppliers.filter(s => s.agencyId === agencyId);

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

    const addItem = () => {
        setItems([...items, { productId: "", quantity: 1, cost: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof typeof items[0], value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill cost if product changed
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].cost = Number(product.factoryPrice);
            }
        }

        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        formData.append('warehouseId', warehouseId);
        formData.append('supplierId', supplierId);
        formData.append('items', JSON.stringify(items));
        formData.append('paidAmount', paidAmount.toString());
        formData.append('note', note);
        formData.append('date', date);

        try {
            await createPurchaseInvoice(formData);
            router.push('/dashboard/accounts/purchases');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء حفظ الفاتورة');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>المخزن (الوجهة)</Label>
                            <Select value={warehouseId} onValueChange={(val) => { setWarehouseId(val); setSupplierId(""); }} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر المخزن" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>المورد</Label>
                            <Select value={supplierId} onValueChange={setSupplierId} disabled={!warehouseId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={warehouseId ? "اختر المورد (اختياري)" : "اختر المخزن أولاً"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSuppliers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {warehouseId && filteredSuppliers.length === 0 && (
                                <p className="text-[10px] text-orange-500 mt-1">* لا يوجد موردين مسجلين لهذا التوكيل</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>تاريخ الفاتورة</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <Label className="text-lg font-semibold">الأصناف</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-1" /> إضافة صنف
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="grid md:grid-cols-12 gap-4 items-end border-b pb-4">
                                <div className="md:col-span-5 space-y-2">
                                    <Label>المنتج</Label>
                                    <Select value={item.productId} onValueChange={(val) => updateItem(index, 'productId', val)} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر المنتج" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label>الكمية</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label>سعر الشراء (للوحدة)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={item.cost}
                                        onChange={(e) => updateItem(index, 'cost', Number(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    {items.length > 1 && (
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg space-y-4">
                        <div className="flex justify-between text-xl font-bold">
                            <span>إجمالي الفاتورة:</span>
                            <span>{new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(totalAmount)}</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>المدفوع</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>المتبقي (آجل)</Label>
                                <div className="p-2 bg-white border rounded-md text-red-600 font-bold">
                                    {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(totalAmount - paidAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="رقم الفاتورة الورقية، اسم المورد..." />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-image">📎 إرفاق صورة الفاتورة (اختياري)</Label>
                            <Input id="invoice-image" name="image" type="file" accept="image/*" className="file:mr-2 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-emerald-100 file:text-emerald-700 file:font-semibold hover:file:bg-emerald-200" />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
