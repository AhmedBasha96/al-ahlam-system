'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft, Landmark } from "lucide-react";
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
                <p className="text-slate-600 font-medium">Treasury Status Report</p>
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
                            <Button onClick={handleFilter} disabled={isLoading} className="w-full bg-gradient-to-r from-amber-600 to-orange-600">
                                {isLoading ? 'جاري التحميل...' : 'تطبيق'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="relative z-10 space-y-6">
                {/* General Treasury */}
                <Card className="bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-400">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Landmark className="w-6 h-6" />
                            الخزنة العامة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-lg">
                                <div className="text-sm text-white/90">الإيرادات</div>
                                <div className="text-2xl font-black text-white">{formatMoney(data.generalTreasury.totalIncome)}</div>
                            </div>
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-lg">
                                <div className="text-sm text-white/90">المصروفات</div>
                                <div className="text-2xl font-black text-white">{formatMoney(data.generalTreasury.totalExpenses)}</div>
                            </div>
                            <div className="p-4 bg-white/30 backdrop-blur-sm rounded-lg border-2 border-white/50">
                                <div className="text-sm text-white/90">الرصيد</div>
                                <div className="text-3xl font-black text-white">{formatMoney(data.generalTreasury.balance)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Agency Treasuries */}
                {data.agencyTreasuries.map((agency: any) => (
                    <Card key={agency.agencyId} className="bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-amber-600" />
                                خزنة {agency.agencyName}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-lg">
                                    <div className="text-sm text-emerald-700">الإيرادات</div>
                                    <div className="text-xl font-black text-emerald-900">{formatMoney(agency.totalIncome)}</div>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-lg">
                                    <div className="text-sm text-rose-700">المصروفات</div>
                                    <div className="text-xl font-black text-rose-900">{formatMoney(agency.totalExpenses)}</div>
                                </div>
                                <div className={`p-4 rounded-lg ${agency.balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                                    <div className={`text-sm ${agency.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>الرصيد</div>
                                    <div className={`text-2xl font-black ${agency.balance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>{formatMoney(agency.balance)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Total */}
                <Card className="bg-gradient-to-r from-slate-700 to-slate-900 border-2 border-slate-600">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-white text-xl font-bold">إجمالي رصيد الخزائن</div>
                            <div className="text-4xl font-black text-white">{formatMoney(data.totalBalance)}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
