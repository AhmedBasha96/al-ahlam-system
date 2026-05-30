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
import { ConfirmDialog } from "@/components/ui-custom/confirm-dialog";

interface PurchaseFormProps {
    warehouses: any[];
    suppliers: any[];
    products: any[];
}

export default function PurchaseForm({ warehouses, suppliers, products }: PurchaseFormProps) {
    const router = useRouter();
    const [warehouseId, setWarehouseId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [items, setItems] = useState<{ productId: string, cartons: number, cost: number, discountPercentage: number, taxPercentage: number }[]>([
        { productId: "", cartons: 0, cost: 0, discountPercentage: 0, taxPercentage: 0 }
    ]);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [paidAmount, setPaidAmount] = useState(0);
    const [note, setNote] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Get agencyId of selected warehouse
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    const agencyId = selectedWarehouse?.agencyId;

    // Filter suppliers by agency
    const filteredSuppliers = suppliers.filter(s => s.agencyId === agencyId);

    const totalAmount = items.reduce((sum, item) => {
        let itemBase = item.cartons * item.cost;
        const discountAmount = itemBase * (item.discountPercentage / 100);
        const taxAmount = itemBase * (item.taxPercentage / 100);
        return sum + (itemBase - discountAmount + taxAmount);
    }, 0);

    const addItem = (productId = "") => {
        setItems([...items, { productId, cartons: 0, cost: 0, discountPercentage: 0, taxPercentage: 0 }]);
    };

    const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const product = products.find(p => p.barcode === barcodeInput);
            if (product) {
                const emptyRowIndex = items.findIndex(it => it.productId === "");
                if (emptyRowIndex !== -1) {
                    updateItem(emptyRowIndex, 'productId', product.id);
                } else {
                    setItems([...items, { productId: product.id, cartons: 1, cost: Number(product.factoryPrice), discountPercentage: 0, taxPercentage: 0 }]);
                }
                setBarcodeInput("");
            } else {
                alert("المنتج غير موجود!");
            }
        }
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        let newItem = { ...newItems[index], [field]: value };

        const product = products.find(p => p.id === newItem.productId);

        if (field === 'productId' && product) {
            newItem.cost = Number(product.factoryPrice);
            newItem.discountPercentage = 0;
            newItem.taxPercentage = 0;
            newItem.cartons = 0;
        }

        newItems[index] = newItem;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validItems = items.filter(it => it.productId && (it.cartons > 0 || it.units > 0));
        if (validItems.length === 0) {
            alert("يرجى إضافة صنف واحد على الأقل بكمية صحيحة");
            return;
        }

        setShowConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        setShowConfirm(false);

        const validItems = items.filter(it => it.productId && (it.cartons > 0 || it.units > 0));
        const formData = new FormData();
        formData.append('warehouseId', warehouseId);
        formData.append('supplierId', supplierId);

        const itemsForServer = validItems.map(it => {
            const product = products.find(p => p.id === it.productId);
            const upc = product?.unitsPerCarton || 1;

            return {
                productId: it.productId,
                quantity: it.cartons * upc, // Save total pieces in DB for consistency
                cost: it.cost / upc,        // Save unit cost in DB
                discountPercentage: it.discountPercentage,
                taxPercentage: it.taxPercentage
            };
        });

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
                        </div>
                        <div className="space-y-2">
                            <Label>تاريخ الفاتورة</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-4 rounded-lg gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <Label className="text-lg font-semibold whitespace-nowrap">البحث بالباركود:</Label>
                                <Input 
                                    placeholder="اضرب الباركود هنا..." 
                                    className="max-w-xs border-emerald-500 focus-visible:ring-emerald-500"
                                    value={barcodeInput}
                                    onChange={e => setBarcodeInput(e.target.value)}
                                    onKeyDown={handleBarcodeSearch}
                                />
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addItem()}>
                                <Plus className="w-4 h-4 mr-1" /> صنف يدوي
                            </Button>
                        </div>

                        {items.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);

                            return (
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
                                        <Label className="text-center block font-bold text-blue-800">عدد الكراتين</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.cartons}
                                            onChange={(e) => updateItem(index, 'cartons', Number(e.target.value))}
                                            className="text-center font-bold text-lg border-blue-200"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>سعر الكرتونة</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={item.cost}
                                                onChange={(e) => updateItem(index, 'cost', Number(e.target.value))}
                                                className="bg-white font-mono text-blue-700 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="text-xs text-orange-600">خصم %</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.discountPercentage}
                                            onChange={(e) => updateItem(index, 'discountPercentage', Number(e.target.value))}
                                            className="text-center text-sm border-orange-200"
                                        />
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="text-xs text-emerald-600">ضريبة %</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.taxPercentage}
                                            onChange={(e) => updateItem(index, 'taxPercentage', Number(e.target.value))}
                                            className="text-center text-sm border-emerald-200"
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end mb-1">
                                        {items.length > 1 && (
                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)} className="h-8 w-8">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg space-y-4 shadow-inner">
                        <div className="flex justify-between text-2xl font-bold text-slate-800">
                            <span>إجمالي الفاتورة:</span>
                            <span>{new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(totalAmount)}</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold">المدفوع نقداً</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                    className="text-lg font-bold text-emerald-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-red-600">المتبقي (مديونية للمورد)</Label>
                                <div className="p-2 bg-white border border-red-100 rounded-md text-red-600 font-bold text-lg">
                                    {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(totalAmount - paidAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>ملاحظات إضافية</Label>
                            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="رقم الفاتورة الورقية أو أي ملاحظات..." />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-14 rounded-xl text-lg shadow-lg" size="lg" disabled={isSubmitting}>
                        <Plus className="w-5 h-5 mr-2" />
                        {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وحفظ فاتورة الشراء'}
                    </Button>
                </form>

                <ConfirmDialog
                    open={showConfirm}
                    onOpenChange={setShowConfirm}
                    onConfirm={handleConfirmSubmit}
                    title="تأكيد فاتورة مشتريات"
                    description="هل أنت متأكد من صحة عدد الكراتين والأسعار؟ سيتم إضافة المخزون فوراً."
                    confirmText="نعم، حفظ الفاتورة"
                />
            </CardContent>
        </Card>
    );
}
