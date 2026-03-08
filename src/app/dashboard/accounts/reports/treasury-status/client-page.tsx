'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft, Landmark, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { getTreasuryStatusReport } from "@/lib/actions/reports";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export default function ClientTreasuryStatusReport({ initialData, defaultStartDate, defaultEndDate }: any) {
    const [data, setData] = useState(initialData);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [isLoading, setIsLoading] = useState(false);

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            const newData = await getTreasuryStatusReport(new Date(startDate), new Date(endDate));
            setData(newData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const BreakdownSection = ({ title, items, icon: Icon, colorClass, emptyText }: any) => (
        <div className={`rounded-xl p-4 border ${colorClass}`}>
            <h4 className="font-bold mb-3 border-b border-current/20 pb-2 flex items-center gap-2">
                <Icon className="w-4 h-4" /> {title}
            </h4>
            <div className="space-y-2">
                {items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                        <span className="opacity-80">{item.name}</span>
                        <span className="font-bold">{formatMoney(item.value)}</span>
                    </div>
                ))}
                {items.length === 0 && <p className="opacity-50 text-xs text-center">{emptyText}</p>}
            </div>
        </div>
    );

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-amber-50 via-orange-50/30 to-slate-50">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        العودة للتقارير
                    </Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-800 to-orange-600 pb-2">
                    تقرير حالة الخزائن
                </h1>
                <p className="text-slate-600 font-medium">Treasury Status Report - تتبع كل جنيه في المؤسسة</p>
            </div>

            <Card className="relative z-10 mb-8 bg-white/80 backdrop-blur-sm shadow-xl border-amber-100">
                <CardHeader><CardTitle className="text-lg">تصفية التقرير</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>من تاريخ</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-amber-200 focus:border-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <Label>إلى تاريخ</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-amber-200 focus:border-amber-500" />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleFilter} disabled={isLoading} className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition-all font-bold">
                                {isLoading ? 'جاري التحميل...' : 'تحديث البيانات'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="relative z-10 space-y-8">
                {/* General Treasury */}
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-all" />
                    <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Landmark className="w-6 h-6 text-amber-400" />
                                </div>
                                <span>الخزنة العامة</span>
                            </div>
                            <div className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase tracking-widest">General Treasury</div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="text-xs font-bold text-emerald-400 uppercase mb-2">إجمالي الإيرادات</div>
                                <div className="text-3xl font-black text-white">{formatMoney(data.generalTreasury.totalIncome)}</div>
                            </div>
                            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="text-xs font-bold text-rose-400 uppercase mb-2">إجمالي المصروفات</div>
                                <div className="text-3xl font-black text-white">{formatMoney(data.generalTreasury.totalExpenses)}</div>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl border border-amber-500/30 shadow-inner">
                                <div className="text-xs font-bold text-amber-300 uppercase mb-2">الرصيد الحالي</div>
                                <div className="text-4xl font-black text-white drop-shadow-sm">{formatMoney(data.generalTreasury.balance)}</div>
                            </div>
                        </div>

                        {/* Breakdowns */}
                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                            <BreakdownSection
                                title="مصادر الإيرادات"
                                items={data.generalTreasury.revenueBreakdown}
                                icon={TrendingUp}
                                colorClass="bg-emerald-500/5 border-emerald-500/20 text-emerald-100"
                                emptyText="لا توجد إيرادات مسجلة"
                            />
                            <BreakdownSection
                                title="تفاصيل المصروفات"
                                items={data.generalTreasury.expenseBreakdown}
                                icon={TrendingDown}
                                colorClass="bg-rose-500/5 border-rose-500/20 text-rose-100"
                                emptyText="لا توجد مصروفات مسجلة"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Agency Treasuries Title */}
                <div className="pt-4 border-t border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <DollarSign className="w-6 h-6 text-amber-600" />
                        خزائن التوكيلات
                    </h2>
                    <p className="text-slate-500 text-sm">تفصيل الحركات المالية لكل توكيل على حدة</p>
                </div>

                {/* Agency Treasuries List */}
                <div className="space-y-6">
                    {data.agencyTreasuries.map((agency: any) => (
                        <Card key={agency.agencyId} className="bg-white/80 backdrop-blur-sm shadow-lg border-slate-100 hover:shadow-xl transition-shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-800">
                                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                            <Landmark className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <span>خزنة {agency.agencyName}</span>
                                    </div>
                                    <div className={`text-2xl font-black ${agency.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {formatMoney(agency.balance)}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4 mb-6">
                                    <div className="px-4 py-3 bg-emerald-50 rounded-xl flex justify-between items-center">
                                        <span className="text-xs font-bold text-emerald-700 uppercase">إجمالي الداخل</span>
                                        <span className="text-xl font-black text-emerald-900">{formatMoney(agency.totalIncome)}</span>
                                    </div>
                                    <div className="px-4 py-3 bg-rose-50 rounded-xl flex justify-between items-center">
                                        <span className="text-xs font-bold text-rose-700 uppercase">إجمالي الخارج</span>
                                        <span className="text-xl font-black text-rose-900">{formatMoney(agency.totalExpenses)}</span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <BreakdownSection
                                        title="إيرادات التوكيل"
                                        items={agency.revenueBreakdown}
                                        icon={TrendingUp}
                                        colorClass="bg-emerald-50 border-emerald-100 text-emerald-900"
                                        emptyText="لا توجد إيرادات"
                                    />
                                    <BreakdownSection
                                        title="مصروفات التوكيل"
                                        items={agency.expenseBreakdown}
                                        icon={TrendingDown}
                                        colorClass="bg-rose-50 border-rose-100 text-rose-900"
                                        emptyText="لا توجد مصروفات"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Total Summary */}
                <div className="pt-8">
                    <Card className="bg-gradient-to-r from-slate-800 to-indigo-950 border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                        <CardContent className="p-10 relative z-10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="text-center md:text-right">
                                    <div className="text-indigo-300 font-bold uppercase tracking-widest text-sm mb-2">إجمالي النقدية في كافة الخزائن</div>
                                    <div className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                                        {formatMoney(data.totalBalance)}
                                    </div>
                                </div>
                                <div className="h-20 w-px bg-white/10 hidden md:block" />
                                <div className="flex flex-col items-center md:items-end gap-2">
                                    <div className="flex items-center gap-3 text-emerald-400 font-bold">
                                        <div className="p-2 bg-emerald-400/20 rounded-full">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <span>نظام الحسابات متصل ومحدث</span>
                                    </div>
                                    <p className="text-slate-400 text-xs text-center md:text-right max-w-xs">
                                        هذا الرقم يمثل كافة الأرصدة النقدية في الخزنة العامة وخزائن التوكيلات بناءً على كافة العمليات المسجلة
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
