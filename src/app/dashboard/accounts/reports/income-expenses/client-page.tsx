'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, PieChart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getIncomeExpensesReport } from "@/lib/actions/reports";
import Image from "next/image";

interface IncomeExpensesData {
    income: any[];
    expenses: any[];
    incomeByCategory: { name: string; value: number }[];
    expensesByCategory: { name: string; value: number }[];
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
}

interface ClientIncomeExpensesReportProps {
    initialData: IncomeExpensesData;
    agencies: { id: string; name: string }[];
    defaultStartDate: string;
    defaultEndDate: string;
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export default function ClientIncomeExpensesReport({
    initialData,
    agencies,
    defaultStartDate,
    defaultEndDate
}: ClientIncomeExpensesReportProps) {
    const [data, setData] = useState<IncomeExpensesData>(initialData);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [agencyId, setAgencyId] = useState('ALL');
    const [isLoading, setIsLoading] = useState(false);

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            const newData = await getIncomeExpensesReport(
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

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-slate-50">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        العودة للتقارير
                    </Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-600 pb-2">
                    تقرير الإيرادات والمصروفات
                </h1>
                <p className="text-slate-600 font-medium">Income & Expenses Report - التدفقات النقدية</p>
            </div>

            {/* Filters */}
            <Card className="relative z-10 mb-8 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg">تصفية التقرير</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>من تاريخ</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>إلى تاريخ</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>التوكيل</Label>
                            <Select value={agencyId} onValueChange={setAgencyId}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">جميع التوكيلات</SelectItem>
                                    {agencies.map(agency => (
                                        <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleFilter} disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                                {isLoading ? 'جاري التحميل...' : 'تطبيق'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="relative z-10 grid md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-emerald-700">إجمالي الإيرادات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-900">{formatMoney(data.totalIncome)}</div>
                        <p className="text-xs text-emerald-600 mt-1">{data.income.length} سجل</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-rose-700">إجمالي المصروفات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-rose-900">{formatMoney(data.totalExpenses)}</div>
                        <p className="text-xs text-rose-600 mt-1">{data.expenses.length} سجل</p>
                    </CardContent>
                </Card>

                <Card className={`border-2 ${data.netCashFlow >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400' : 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400'}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">صافي التدفق النقدي</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-white">{formatMoney(data.netCashFlow)}</div>
                        <p className="text-xs text-white/90 mt-1">
                            {data.netCashFlow >= 0 ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Income & Expenses Tables */}
            <div className="relative z-10 grid md:grid-cols-2 gap-6">
                {/* Income */}
                <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            الإيرادات
                        </CardTitle>
                        <CardDescription>آخر 10 سجلات</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>الوصف</TableHead>
                                        <TableHead>المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.income.slice(0, 10).map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell className="text-sm font-medium">{item.description}</TableCell>
                                            <TableCell className="font-bold text-emerald-700">{formatMoney(Number(item.amount))}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-rose-600" />
                            المصروفات
                        </CardTitle>
                        <CardDescription>آخر 10 سجلات</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>الوصف</TableHead>
                                        <TableHead>المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.expenses.slice(0, 10).map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                                            <TableCell className="text-sm font-medium">{item.description}</TableCell>
                                            <TableCell className="font-bold text-rose-700">{formatMoney(Number(item.amount))}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
