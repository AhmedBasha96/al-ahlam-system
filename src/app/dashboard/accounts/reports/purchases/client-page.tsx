'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPurchasesReport } from "@/lib/actions/reports";

const formatMoney = (amount: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);

export default function ClientPurchasesReport({ initialData, defaultStartDate, defaultEndDate }: any) {
    const [data, setData] = useState(initialData);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [isLoading, setIsLoading] = useState(false);

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            const newData = await getPurchasesReport(new Date(startDate), new Date(endDate));
            setData(newData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-rose-50 via-pink-50/30 to-slate-50">
            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />العودة للتقارير</Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-800 to-pink-600 pb-2">
                    تقرير المشتريات
                </h1>
                <p className="text-slate-600 font-medium">Purchases Analysis Report</p>
            </div>

            <Card className="relative z-10 mb-8 bg-white/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-lg">تصفية التقرير</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>من تاريخ</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>إلى تاريخ</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleFilter} disabled={isLoading} className="w-full bg-gradient-to-r from-rose-600 to-pink-600">
                                {isLoading ? 'جاري التحميل...' : 'تطبيق'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="relative z-10 grid md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-rose-700">إجمالي المشتريات</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-rose-900">{formatMoney(data.totalPurchases)}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-emerald-700">المدفوع نقداً</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-emerald-900">{formatMoney(data.totalPaid)}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-amber-700">الآجل (المديونية)</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-amber-900">{formatMoney(data.totalOutstanding)}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-blue-700">عدد الفواتير</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-blue-900">{data.purchasesCount}</div></CardContent>
                </Card>
            </div>

            <Card className="relative z-10 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-rose-600" />
                        تحليل حسب المخزن
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.byWarehouse.map((wh: any) => (
                            <div key={wh.name} className="flex items-center justify-between p-4 bg-rose-50 rounded-lg">
                                <div>
                                    <div className="font-bold text-slate-900">{wh.name}</div>
                                    <div className="text-xs text-slate-600">{wh.count} فاتورة</div>
                                </div>
                                <div className="text-xl font-black text-rose-900">{formatMoney(wh.total)}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
