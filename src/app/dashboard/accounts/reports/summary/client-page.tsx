'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, TrendingUp, Building2, DollarSign, CreditCard } from "lucide-react";
import Link from "next/link";
import { getFinancialSummary } from "@/lib/actions/reports";

const formatMoney = (amount: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);

export default function ClientFinancialSummary({ initialData, defaultStartDate, defaultEndDate }: any) {
    const [data, setData] = useState(initialData);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [isLoading, setIsLoading] = useState(false);

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            const newData = await getFinancialSummary(new Date(startDate), new Date(endDate));
            setData(newData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-50">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />العودة للتقارير</Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 pb-2">
                    التقرير الشامل
                </h1>
                <p className="text-slate-600 font-medium">Financial Summary - نظرة عامة على الوضع المالي</p>
            </div>

            <Card className="relative z-10 mb-8 bg-white/90 backdrop-blur-sm shadow-xl">
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
                            <Button onClick={handleFilter} disabled={isLoading} className="w-full bg-gradient-to-r from-slate-700 to-slate-900">
                                {isLoading ? 'جاري التحميل...' : 'تطبيق'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Financial Indicators */}
            <div className="relative z-10 grid md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white/90 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            إجمالي الأصول
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{formatMoney(data.summary.totalAssets)}</div>
                        <p className="text-xs text-white/80 mt-1">الخزائن + البنوك</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-500 to-red-600 border-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white/90 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            إجمالي الالتزامات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{formatMoney(data.summary.totalLiabilities)}</div>
                        <p className="text-xs text-white/80 mt-1">القروض</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white/90 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            صافي الأصول
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{formatMoney(data.summary.netWorth)}</div>
                        <p className="text-xs text-white/80 mt-1">الأصول - الالتزامات</p>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br border-none ${data.summary.profitability >= 0 ? 'from-purple-500 to-violet-600' : 'from-gray-500 to-gray-700'}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white/90 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            الربحية
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{formatMoney(data.summary.profitability)}</div>
                        <p className="text-xs text-white/80 mt-1">صافي الربح/الخسارة</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Sections */}
            <div className="relative z-10 grid md:grid-cols-2 gap-6">
                {/* Profit & Loss Summary */}
                <Card className="bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>الأرباح والخسائر</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                            <span className="font-medium">إجمالي الإيرادات</span>
                            <span className="font-black text-emerald-700">{formatMoney(data.profitLoss.totalIncome)}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-rose-50 rounded-lg">
                            <span className="font-medium">إجمالي المصروفات</span>
                            <span className="font-black text-rose-700">{formatMoney(data.profitLoss.totalExpenses)}</span>
                        </div>
                        <div className={`flex justify-between p-4 rounded-lg border-2 ${data.profitLoss.netProfit >= 0 ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'}`}>
                            <span className="font-bold">صافي الربح</span>
                            <span className={`font-black text-xl ${data.profitLoss.netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>{formatMoney(data.profitLoss.netProfit)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Assets Breakdown */}
                <Card className="bg-white/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>توزيع الأصول</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between p-3 bg-amber-50 rounded-lg">
                            <span className="font-medium">رصيد الخزائن</span>
                            <span className="font-black text-amber-700">{formatMoney(data.treasury.totalBalance)}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                            <span className="font-medium">رصيد البنوك</span>
                            <span className="font-black text-purple-700">
                                {formatMoney(data.banks.reduce((sum: number, b: any) => sum + b.currentBalance, 0))}
                            </span>
                        </div>
                        <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                            <span className="font-medium">القروض المستحقة</span>
                            <span className="font-black text-red-700">{formatMoney(data.loans.totalRemaining)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
