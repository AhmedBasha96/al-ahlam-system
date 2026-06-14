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

    const totalSummary = items.reduce((acc, item) => {
        const itemBase = item.cartons * item.cost;
        const discountAmount = itemBase * (item.discountPercentage / 100);
        const taxAmount = itemBase * (item.taxPercentage / 100);
        
        return {
            discounts: acc.discounts + discountAmount,
            taxes: acc.taxes + taxAmount,
            base: acc.base + itemBase
        };
    }, { discounts: 0, taxes: 0, base: 0 });

    const totalAmount = totalSummary.base - totalSummary.discounts + totalSummary.taxes;

    const addItem = (productId = "") => {
        setItems([...items, { productId, cartons: 0, cost: 0, discountPercentage: 0, taxPercentage: 0 }]);
    };

    const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const product = products.find(p => p.barcode === barcodeInput);
            if (product) {
                const productAgencyId = product.agencyId;
                const targetWarehouse = warehouses.find(w => w.agencyId === productAgencyId);

                // If warehouse is already set and doesn't match this product's agency
                if (warehouseId && targetWarehouse && warehouseId !== targetWarehouse.id) {
                    alert(`عذراً، هذا المنتج يتبع توكيل آخر (${productAgencyId}). لا يمكنك دمج توكيلات مختلفة في نفس الفاتورة.`);
                    return;
                }

                const emptyRowIndex = items.findIndex(it => it.productId === "");
                if (emptyRowIndex !== -1) {
                    updateItem(emptyRowIndex, 'productId', product.id);
                } else {
                    setItems([...items, { productId: product.id, cartons: 1, cost: Number(product.factoryPrice), discountPercentage: 0, taxPercentage: 0 }]);
                }
                
                // Auto-set warehouse if not set
                if (!warehouseId && targetWarehouse) {
                    setWarehouseId(targetWarehouse.id);
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

        // Auto-select warehouse based on product
        if (newItem.productId && !warehouseId) {
            const productAgencyId = product?.agencyId;
            const targetWarehouse = warehouses.find(w => w.agencyId === productAgencyId);
            if (targetWarehouse) {
                setWarehouseId(targetWarehouse.id);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!warehouseId) {
            alert("يرجى اختيار منتج أولاً لتحديد المخزن تلقائياً أو اختر المخزن يدوياً");
            return;
        }

        const validItems = items.filter(it => it.productId && it.cartons > 0);
        if (validItems.length === 0) {
            alert("يرجى إضافة صنف واحد على الأقل بكمية صحيحة بالكراتين");
            return;
        }

        setShowConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        setShowConfirm(false);

        const validItems = items.filter(it => it.productId && it.cartons > 0);
        const formData = new FormData();
        formData.append('warehouseId', warehouseId);
        formData.append('supplierId', supplierId);
        formData.append('paidAmount', paidAmount.toString());
        formData.append('note', note);
        formData.append('date', date);

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

        formData.append('items', JSON.stringify(itemsForServer));

        // Get image from input
        const fileInput = document.getElementById('invoice-image') as HTMLInputElement;
        if (fileInput && fileInput.files?.[0]) {
            formData.append('image', fileInput.files[0]);
        }

        try {
            const result = await createPurchaseInvoice(formData);
            if (result && result.success) {
                router.push('/dashboard/accounts/purchases');
            } else {
                alert('فشل حفظ الفاتورة: ' + (result?.error || 'خطأ غير معروف'));
            }
        } catch (error: any) {
            console.error('Purchase invoice error:', error);
            alert('حدث خطأ: ' + (error.message || 'خطأ غير متوقع أثناء الحفظ'));
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
                            <div className="flex flex-col gap-1 w-full md:w-auto relative">
                                <div className="flex items-center gap-4">
                                    <Label className="text-lg font-semibold whitespace-nowrap">البحث بالباركود:</Label>
                                    <Input 
                                        placeholder="اكتب جزء من الباركود أو الاسم..." 
                                        className="max-w-xs border-emerald-500 focus-visible:ring-emerald-500 font-bold"
                                        value={barcodeInput}
                                        onChange={e => setBarcodeInput(e.target.value)}
                                        onKeyDown={handleBarcodeSearch}
                                    />
                                </div>
                                
                                {barcodeInput.length >= 2 && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto">
                                        {products
                                            .filter(p => 
                                                p.barcode?.toLowerCase().includes(barcodeInput.toLowerCase()) || 
                                                p.name.toLowerCase().includes(barcodeInput.toLowerCase())
                                            )
                                            .slice(0, 10)
                                            .map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className="w-full text-right px-4 py-2 hover:bg-emerald-50 flex flex-col border-b last:border-0 border-slate-50 transition-colors"
                                                    onClick={() => {
                                                        const emptyRowIndex = items.findIndex(it => it.productId === "");
                                                        if (emptyRowIndex !== -1) {
                                                            updateItem(emptyRowIndex, 'productId', p.id);
                                                        } else {
                                                            setItems([...items, { productId: p.id, cartons: 1, cost: Number(p.factoryPrice), discountPercentage: 0, taxPercentage: 0 }]);
                                                        }
                                                        setBarcodeInput("");
                                                    }}
                                                >
                                                    <span className="font-bold text-slate-800">{p.name}</span>
                                                    <span className="text-[10px] text-emerald-600 font-mono">Barcode: {p.barcode}</span>
                                                </button>
                                            ))
                                        }
                                        {products.filter(p => 
                                            p.barcode?.toLowerCase().includes(barcodeInput.toLowerCase()) || 
                                            p.name.toLowerCase().includes(barcodeInput.toLowerCase())
                                        ).length === 0 && (
                                            <div className="p-4 text-center text-slate-400 text-sm italic">لا توجد نتائج مطابقة</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addItem()}>
                                <Plus className="w-4 h-4 mr-1" /> صنف يدوي
                            </Button>
                        </div>

                        {items.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            
                            // Row calculations
                            const itemBase = item.cartons * item.cost;
                            const itemDiscountAmount = itemBase * (item.discountPercentage / 100);
                            const itemTaxAmount = itemBase * (item.taxPercentage / 100);
                            const itemNet = itemBase - itemDiscountAmount + itemTaxAmount;

                            return (
                                <div key={index} className="grid md:grid-cols-12 gap-4 items-start border-b pb-4 bg-white p-2 rounded-lg shadow-sm mb-2 hover:bg-slate-50 transition-colors">
                                    <div className="md:col-span-4 space-y-2">
                                        <Label className="flex justify-between">
                                            <span>المنتج</span>
                                            {product && <span className="text-[10px] text-blue-500 font-mono">[{product.barcode}]</span>}
                                        </Label>
                                        <Select 
                                            value={item.productId} 
                                            onValueChange={(val) => {
                                                const productObj = products.find(p => p.id === val);
                                                const targetWh = warehouses.find(w => w.agencyId === productObj?.agencyId);
                                                
                                                if (warehouseId && targetWh && warehouseId !== targetWh.id) {
                                                    alert("هذا المنتج يتبع توكيل مختلف عن باقي الفاتورة");
                                                    return;
                                                }
                                                updateItem(index, 'productId', val);
                                            }} 
                                            required
                                        >
                                            <SelectTrigger className="h-10 text-sm">
                                                <SelectValue placeholder="اختر المنتج" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products
                                                    .filter(p => !warehouseId || warehouses.find(w => w.id === warehouseId)?.agencyId === p.agencyId)
                                                    .map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="text-center block text-[11px] font-bold">كراتين</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.cartons}
                                            onChange={(e) => updateItem(index, 'cartons', Number(e.target.value))}
                                            className="text-center font-bold text-blue-800 h-10"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-[11px]">سعر الكرتونة</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.cost}
                                            onChange={(e) => updateItem(index, 'cost', Number(e.target.value))}
                                            className="font-mono text-blue-700 font-bold h-10"
                                        />
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="text-[10px] text-orange-600 block text-center">خصم %</Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            max="100"
                                            value={item.discountPercentage}
                                            onChange={(e) => updateItem(index, 'discountPercentage', Number(e.target.value))}
                                            className="text-center text-xs border-orange-100 h-10"
                                        />
                                        {itemDiscountAmount > 0 && <p className="text-[9px] text-center text-orange-500 font-bold">-{itemDiscountAmount.toFixed(1)}</p>}
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <Label className="text-[10px] text-emerald-600 block text-center">ضريبة %</Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            min="0"
                                            max="100"
                                            value={item.taxPercentage}
                                            onChange={(e) => updateItem(index, 'taxPercentage', Number(e.target.value))}
                                            className="text-center text-xs border-emerald-100 h-10"
                                        />
                                        {itemTaxAmount > 0 && <p className="text-[9px] text-center text-emerald-500 font-bold">+{itemTaxAmount.toFixed(1)}</p>}
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-[11px] font-bold text-slate-700">الصافي</Label>
                                        <div className="h-10 bg-slate-100 rounded flex items-center justify-center font-mono font-bold text-slate-800 text-sm border border-slate-200">
                                            {itemNet.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 flex justify-end pt-8">
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

                    <div className="bg-slate-50 p-6 rounded-lg space-y-4 shadow-inner border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                            <div className="text-center">
                                <Label className="text-slate-500 block mb-1">إجمالي السعر (قبل التعديل)</Label>
                                <span className="text-lg font-semibold">{totalSummary.base.toFixed(2)} ج.م</span>
                            </div>
                            <div className="text-center">
                                <Label className="text-orange-600 block mb-1">إجمالي الخصومات (-)</Label>
                                <span className="text-lg font-semibold text-orange-600">{totalSummary.discounts.toFixed(2)} ج.م</span>
                            </div>
                            <div className="text-center">
                                <Label className="text-emerald-600 block mb-1">إجمالي الضرائب (+)</Label>
                                <span className="text-lg font-semibold text-emerald-600">{totalSummary.taxes.toFixed(2)} ج.m</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-3xl font-black text-slate-900 pt-2">
                            <span>الإجمالي النهائي:</span>
                            <span className="text-blue-700">{new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(totalAmount)}</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700">المبلغ المدفوع (كاش)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                                    className="text-xl font-bold text-emerald-700 h-12 border-2 border-emerald-100 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-red-600">المتبقي (مديونية للمورد)</Label>
                                <div className="h-12 flex items-center px-4 bg-red-50 border-2 border-red-100 rounded-md text-red-600 font-black text-xl">
                                    {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(totalAmount - paidAmount)}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ملاحظات إضافية</Label>
                                <Input value={note} onChange={e => setNote(e.target.value)} placeholder="رقم الفاتورة الورقية أو أي ملاحظات..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice-image" className="flex items-center gap-2">
                                    📎 إرفاق صورة الفاتورة
                                    {/* <span className="text-[10px] text-gray-400">(اختياري)</span> */}
                                </Label>
                                <Input 
                                    id="invoice-image" 
                                    name="image" 
                                    type="file" 
                                    accept="image/*" 
                                    className="file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-2 file:py-1 cursor-pointer"
                                />
                            </div>
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
