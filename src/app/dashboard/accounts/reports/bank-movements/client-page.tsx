'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { getBankMovementsReport } from "@/lib/actions/reports";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export default function ClientBankMovementsReport({
    initialData,
    defaultStartDate,
    defaultEndDate
}: any) {
    const [data, setData] = useState(initialData);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [isLoading, setIsLoading] = useState(false);

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            const newData = await getBankMovementsReport(new Date(startDate), new Date(endDate));
            setData(newData);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-purple-50 via-violet-50/30 to-slate-50">
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        العودة للتقارير
                    </Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-violet-600 pb-2">
                    تقرير حركة البنوك
                </h1>
                <p className="text-slate-600 font-medium">Bank Movements Report</p>
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
                            <Button onClick={handleFilter} disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-violet-600">
                                {isLoading ? 'جاري التحميل...' : 'تطبيق'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="relative z-10 space-y-6">
                {data.map((bank: any) => (
                    <Card key={bank.bankId} className="bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-purple-600" />
                                    {bank.bankName}
                                </CardTitle>
                                <div className="text-2xl font-black text-purple-900">{formatMoney(bank.currentBalance)}</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-4 gap-4 mb-4">
                                <div className="p-4 bg-emerald-50 rounded-lg">
                                    <div className="text-xs text-emerald-700 mb-1">إجمالي الإيداعات</div>
                                    <div className="text-xl font-black text-emerald-900">{formatMoney(bank.totalDeposits)}</div>
                                </div>
                                <div className="p-4 bg-rose-50 rounded-lg">
                                    <div className="text-xs text-rose-700 mb-1">إجمالي السحوبات</div>
                                    <div className="text-xl font-black text-rose-900">{formatMoney(bank.totalWithdrawals)}</div>
                                </div>
                                <div className={`p-4 rounded-lg ${bank.netMovement >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                                    <div className={`text-xs mb-1 ${bank.netMovement >= 0 ? 'text-blue-700' : 'text-red-700'}`}>صافي الحركة</div>
                                    <div className={`text-xl font-black ${bank.netMovement >= 0 ? 'text-blue-900' : 'text-red-900'}`}>{formatMoney(bank.netMovement)}</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="text-xs text-purple-700 mb-1">عدد المعاملات</div>
                                    <div className="text-xl font-black text-purple-900">{bank.transactionsCount}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
