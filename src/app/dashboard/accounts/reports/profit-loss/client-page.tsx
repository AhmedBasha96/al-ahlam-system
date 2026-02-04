'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProfitLossReport } from "@/lib/actions/reports";

interface ProfitLossData {
    salesRevenue: number;
    costOfGoodsSold: number;
    salesProfit: number;
    otherIncome: number;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    salesCount: number;
    expensesCount: number;
    breakdown: AgencyProfitLoss[];
}

interface AgencyProfitLoss {
    agencyId: string;
    agencyName: string;
    salesRevenue: number;
    costOfGoodsSold: number;
    salesProfit: number;
    otherIncome: number;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    salesCount: number;
    expensesCount: number;
}

interface ClientProfitLossReportProps {
    initialData: ProfitLossData;
    agencies: { id: string; name: string }[];
    defaultStartDate: string;
    defaultEndDate: string;
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export default function ClientProfitLossReport({
    initialData,
    agencies,
    defaultStartDate,
    defaultEndDate
}: ClientProfitLossReportProps) {
    const [data, setData] = useState<ProfitLossData>(initialData);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [agencyId, setAgencyId] = useState('ALL');
    const [isLoading, setIsLoading] = useState(false);

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            const newData = await getProfitLossReport(
                new Date(startDate),
                new Date(endDate),
                agencyId === 'ALL' ? undefined : agencyId
            );
            setData(newData);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const profitMargin = data.salesRevenue > 0
        ? ((data.salesProfit / data.salesRevenue) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-50 overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-200/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        العودة للتقارير
                    </Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-600 pb-2">
                    تقرير الأرباح والخسائر
                </h1>
                <p className="text-slate-600 font-medium">Profit & Loss Statement - تحليل شامل للربحية</p>
            </div>

            {/* Filters */}
            <Card className="relative z-10 mb-8 border-white/60 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg">تصفية التقرير</CardTitle>
                    <CardDescription>حدد الفترة الزمنية والتوكيل</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>من تاريخ</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>إلى تاريخ</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>التوكيل</Label>
                            <Select value={agencyId} onValueChange={setAgencyId}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">جميع التوكيلات</SelectItem>
                                    {agencies.map(agency => (
                                        <SelectItem key={agency.id} value={agency.id}>
                                            {agency.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleFilter}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                            >
                                {isLoading ? 'جاري التحميل...' : 'تطبيق'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="relative z-10 grid md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-emerald-700">صافي الربح</CardTitle></CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-black ${data.netProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                            {formatMoney(data.netProfit)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-blue-700">ربح المبيعات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-blue-900">{formatMoney(data.salesProfit)}</div>
                        <p className="text-xs text-blue-600 mt-1">{data.salesCount} عملية بيع</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-purple-700">إيرادات أخرى</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-purple-900">{formatMoney(data.otherIncome)}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-rose-700">المصروفات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-rose-900">{formatMoney(data.totalExpenses)}</div>
                        <p className="text-xs text-rose-600 mt-1">{data.expensesCount} مصروف</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="relative z-10 space-y-6">
                {/* Sales Section */}
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <TrendingUp className="w-6 h-6" />
                            تفاصيل المبيعات والأرباح
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border-2 border-blue-200">
                                <div className="text-xs text-blue-700 font-bold mb-1">إجمالي المبيعات</div>
                                <div className="text-3xl font-black text-blue-900">{formatMoney(data.salesRevenue)}</div>
                                <div className="text-xs text-blue-600 mt-2">قيمة البيع الإجمالية</div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border-2 border-amber-200">
                                <div className="text-xs text-amber-700 font-bold mb-1">تكلفة البضاعة</div>
                                <div className="text-3xl font-black text-amber-900">{formatMoney(data.costOfGoodsSold)}</div>
                                <div className="text-xs text-amber-600 mt-2">سعر المصنع</div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border-2 border-emerald-300 shadow-lg">
                                <div className="text-xs text-emerald-700 font-bold mb-1">= ربح المبيعات</div>
                                <div className="text-4xl font-black text-emerald-900">{formatMoney(data.salesProfit)}</div>
                                <div className="text-xs text-emerald-600 mt-2">
                                    {data.salesRevenue > 0
                                        ? `هامش ربح ${profitMargin}%`
                                        : 'لا توجد مبيعات'}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-700 font-bold">الصيغة:</span>
                                <span className="text-blue-900 font-mono">ربح المبيعات = إجمالي المبيعات - تكلفة البضاعة المباعة</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Income & Expenses Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent">
                            <CardTitle className="flex items-center gap-2 text-purple-900">
                                <DollarSign className="w-5 h-5" />
                                الإيرادات الأخرى
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center p-6 bg-purple-50 rounded-xl">
                                <div className="text-4xl font-black text-purple-900">{formatMoney(data.otherIncome)}</div>
                                <div className="text-sm text-purple-600 mt-2">إيرادات إضافية</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 backdrop-blur-sm border-2 border-rose-200">
                        <CardHeader className="bg-gradient-to-r from-rose-50 to-transparent">
                            <CardTitle className="flex items-center gap-2 text-rose-900">
                                <TrendingDown className="w-5 h-5" />
                                المصروفات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center p-6 bg-rose-50 rounded-xl">
                                <div className="text-4xl font-black text-rose-900">{formatMoney(data.totalExpenses)}</div>
                                <div className="text-sm text-rose-600 mt-2">{data.expensesCount} عملية</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Net Profit Calculation */}
                <Card className={`bg-gradient-to-br ${data.netProfit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'} border-2 ${data.netProfit >= 0 ? 'border-emerald-400' : 'border-red-400'}`}>
                    <CardContent className="p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-bold opacity-90 mb-2">النتيجة النهائية</div>
                                <div className="text-6xl font-black">{formatMoney(data.netProfit)}</div>
                                <div className="text-sm opacity-90 mt-3">
                                    صافي {data.netProfit >= 0 ? 'الربح' : 'الخسارة'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm opacity-90 mb-2">الحساب:</div>
                                <div className="space-y-1 text-sm font-mono">
                                    <div>ربح المبيعات: {formatMoney(data.salesProfit)}</div>
                                    <div>+ إيرادات أخرى: {formatMoney(data.otherIncome)}</div>
                                    <div className="border-t border-white/30 pt-1">= إجمالي الدخل: {formatMoney(data.totalIncome)}</div>
                                    <div className="mt-2">- المصروفات: {formatMoney(data.totalExpenses)}</div>
                                    <div className="border-t-2 border-white/50 pt-1 mt-1 font-black">= الصافي: {formatMoney(data.netProfit)}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Agency Breakdown Section */}
                {data.breakdown && data.breakdown.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <ShoppingBag className="w-6 h-6 text-teal-600" />
                            تفاصيل التوكيلات
                        </h2>
                        <div className="grid gap-4">
                            {data.breakdown.map((agency) => (
                                <Card key={agency.agencyId} className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="bg-slate-50/50 pb-2">
                                        <CardTitle className="text-lg text-slate-800 flex justify-between items-center">
                                            <span>{agency.agencyName}</span>
                                            <span className={`text-sm px-3 py-1 rounded-full ${agency.netProfit >= 0
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                الصافي: {formatMoney(agency.netProfit)}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-center">
                                            <div className="p-2 rounded-lg bg-blue-50">
                                                <div className="opacity-70 mb-1">المبيعات</div>
                                                <div className="font-bold text-blue-900">{formatMoney(agency.salesRevenue)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-amber-50">
                                                <div className="opacity-70 mb-1">تكلفة البضاعة</div>
                                                <div className="font-bold text-amber-900">{formatMoney(agency.costOfGoodsSold)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-emerald-50">
                                                <div className="opacity-70 mb-1">ربح المبيعات</div>
                                                <div className="font-bold text-emerald-900">{formatMoney(agency.salesProfit)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-rose-50">
                                                <div className="opacity-70 mb-1">المصروفات</div>
                                                <div className="font-bold text-rose-900">{formatMoney(agency.totalExpenses)}</div>
                                            </div>
                                            <div className="p-2 rounded-lg bg-purple-50">
                                                <div className="opacity-70 mb-1">إيرادات أخرى</div>
                                                <div className="font-bold text-purple-900">{formatMoney(agency.otherIncome)}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
