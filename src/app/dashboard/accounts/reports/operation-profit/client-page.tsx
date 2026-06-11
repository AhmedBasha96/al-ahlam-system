'use client';

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Search,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    FileText,
    Calendar,
    User,
    Building2,
    Package,
    Receipt,
    Wallet
} from "lucide-react";
import Link from "next/link";
import { getOperationProfitReport } from "@/lib/actions/reports";

interface TransactionDetail {
    id: string;
    date: Date;
    type: 'SALE' | 'RETURN_IN' | 'EXPENSE' | 'DEBT_COLLECTION';
    customerName: string;
    repName: string;
    agencyName: string;
    revenue: number;
    cost: number;
    profit: number;
    note?: string;
    items: {
        productName: string;
        quantity: number;
        formattedQuantity?: string;
        price: number;
        displayPrice?: number;
        cost: number;
        category?: string;
    }[];
}

interface ClientOperationProfitReportProps {
    initialData: TransactionDetail[];
    agencies: { id: string; name: string }[];
    defaultStartDate: string;
    defaultEndDate: string;
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export default function ClientOperationProfitReport({
    initialData,
    agencies,
    defaultStartDate,
    defaultEndDate
}: ClientOperationProfitReportProps) {
    const [data, setData] = useState<TransactionDetail[]>(initialData);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [agencyId, setAgencyId] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [mode, setMode] = useState<'CASH' | 'ACCRUAL'>('CASH');

    const handleFilter = async () => {
        setIsLoading(true);
        try {
            const newData = await getOperationProfitReport(
                new Date(startDate),
                new Date(endDate),
                agencyId === 'ALL' ? undefined : agencyId,
                mode
            );
            setData(newData);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Correctly trigger fetch when mode or agency changes
    useEffect(() => {
        handleFilter();
    }, [mode, agencyId]);

    const filteredData = useMemo(() => {
        return data.filter(tx => {
            const matchesSearch = tx.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.repName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tx.id.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesType = typeFilter === 'ALL' || (tx.type as any) === typeFilter;
            
            return matchesSearch && matchesType;
        });
    }, [data, searchTerm, typeFilter]);

    const stats = useMemo(() => {
        return filteredData.reduce((acc, tx) => ({
            totalRevenue: acc.totalRevenue + (Number(tx.revenue) || 0),
            totalCost: acc.totalCost + (Number(tx.cost) || 0),
            totalProfit: acc.totalProfit + (Number(tx.profit) || 0),
            count: acc.count + 1
        }), { totalRevenue: 0, totalCost: 0, totalProfit: 0, count: 0 });
    }, [filteredData]);

    const productSummary = useMemo(() => {
        const summary: Record<string, { revenue: number, cost: number, profit: number, quantity: number }> = {};
        
        filteredData.forEach(tx => {
            tx.items.forEach(item => {
                const name = (item as any).productName;
                if (!summary[name]) summary[name] = { revenue: 0, cost: 0, profit: 0, quantity: 0 };
                
                const price = (item as any).displayPrice || (item as any).price;
                const cost = (item as any).displayCost || (item as any).cost;
                const qty = (item as any).quantity;
                
                summary[name].revenue += price * qty;
                summary[name].cost += cost * qty;
                summary[name].profit += (price - cost) * qty;
                summary[name].quantity += qty;
            });
        });

        return Object.entries(summary)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.profit - a.profit);
    }, [filteredData]);

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-slate-50 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4 text-slate-600 hover:text-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        العودة للتقارير
                    </Button>
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-600 pb-2">
                            {mode === 'CASH' ? 'أرباح العمليات (المحصلة)' : 'أرباح العمليات (الإجمالية)'}
                        </h1>
                        <p className="text-slate-600 font-medium">
                            {mode === 'CASH' 
                                ? 'تحليل الربحية بناءً على المبالغ التي تم تحصيلها فعلياً (ربح محقق)' 
                                : 'تحليل الربحية بناءً على إجمالي المبيعات حتى لو لم يتم تحصيلها بالكامل (ربح استحقاق)'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters & Stats */}
            <div className="relative z-10 grid lg:grid-cols-4 gap-6 mb-8">
                {/* Search & Filters Card */}
                <Card className="lg:col-span-3 border-white/60 bg-white/80 backdrop-blur-sm shadow-xl">
                    <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                    <Search className="w-5 h-5 text-indigo-600" />
                                    تصفية وبحث
                                </span>
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                    <Button 
                                        variant={mode === 'CASH' ? 'default' : 'ghost'} 
                                        size="sm" 
                                        className={`rounded-lg text-[10px] font-black h-8 ${mode === 'CASH' ? 'bg-indigo-600 shadow-md' : 'text-slate-500'}`}
                                        onClick={() => setMode('CASH')}
                                    >
                                        أرباح محصلة 💵
                                    </Button>
                                    <Button 
                                        variant={mode === 'ACCRUAL' ? 'default' : 'ghost'} 
                                        size="sm" 
                                        className={`rounded-lg text-[10px] font-black h-8 ${mode === 'ACCRUAL' ? 'bg-indigo-600 shadow-md' : 'text-slate-500'}`}
                                        onClick={() => setMode('ACCRUAL')}
                                    >
                                        أرباح إجمالية 📊
                                    </Button>
                                </div>
                            </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-5 gap-4">
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
                                            <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>نوع العملية</Label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">الكل</SelectItem>
                                        <SelectItem value="SALE">مبيعات</SelectItem>
                                        <SelectItem value="EXPENSE">مصروفات</SelectItem>
                                        <SelectItem value="RETURN_IN">مرتجعات</SelectItem>
                                        <SelectItem value="DEBT_COLLECTION">تحصيلات مديونية</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-2">
                                <Button
                                    onClick={handleFilter}
                                    disabled={isLoading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-10"
                                >
                                    {isLoading ? 'جاري التحميل...' : 'تطبيق'}
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="ابحث باسم العميل، المندوب، أو رقم الفاتورة..."
                                className="pr-10 bg-slate-50/50 border-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Summary Card */}
                <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 border-none shadow-xl text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm opacity-80 uppercase tracking-wider font-bold text-center">
                            {mode === 'CASH' ? 'صافي الربح المحصل' : 'صافي الربح المتوقع'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-2">
                        <div className="text-4xl font-black mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {formatMoney(stats.totalProfit)}
                        </div>
                        <div className="text-xs opacity-70 mb-4 bg-white/10 px-3 py-1 rounded-full">
                            {stats.count} عملية تم تحليلها
                        </div>
                        <div className="w-full grid grid-cols-2 gap-2 text-[10px] font-bold">
                            <div className="bg-white/10 p-2 rounded-lg text-center">
                                <div className="opacity-60 mb-1">إجمالي المبيعات</div>
                                <div>{formatMoney(stats.totalRevenue)}</div>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg text-center">
                                <div className="opacity-60 mb-1">إجمالي التكلفة</div>
                                <div>{formatMoney(stats.totalCost)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Product Profit Summary */}
            {productSummary.length > 0 && (
                <Card className="relative z-10 mb-8 border-indigo-200 bg-white/90 shadow-lg overflow-hidden">
                    <CardHeader className="pb-2 bg-indigo-50/50">
                        <CardTitle className="text-xl flex items-center gap-2 text-indigo-800 font-black">
                            <Package className="w-6 h-6 text-indigo-600" />
                            ملخص أرباح الأصناف (الأكثر ربحية)
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-bold">بناءً على المبالغ المحصلة والعمليات المختارة</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 text-slate-400 font-black border-b border-slate-100">
                                    <tr>
                                        <th className="p-4">الصنف</th>
                                        <th className="p-4 text-center">إجمالي المبيعات</th>
                                        <th className="p-4 text-center">إجمالي التكلفة</th>
                                        <th className="p-4 text-center">صافي الربح</th>
                                        <th className="p-4 text-center">هامش الربح</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {productSummary.slice(0, 10).map((prod, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="p-4 font-black text-slate-700">{prod.name}</td>
                                            <td className="p-4 text-center font-bold text-slate-600">{formatMoney(prod.revenue)}</td>
                                            <td className="p-4 text-center text-slate-400">{formatMoney(prod.cost)}</td>
                                            <td className="p-4 text-center">
                                                <div className={`font-black text-lg ${prod.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {formatMoney(prod.profit)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-black text-[10px]">
                                                    {prod.revenue > 0 ? ((prod.profit / prod.revenue) * 100).toFixed(1) : 0}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transactions Table */}
            <div className="relative z-10 space-y-4">
                {filteredData.length > 0 ? (
                    filteredData.map((tx) => (
                        <Card key={tx.id} className="overflow-hidden border-indigo-100 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                            <div
                                className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                onClick={() => toggleRow(tx.id)}
                            >
                                <div className="grid md:grid-cols-6 items-center gap-4">
                                    <div className="md:col-span-2 flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${
                                            (tx.type as any) === 'SALE' ? 'bg-emerald-100 text-emerald-600' :
                                            (tx.type as any) === 'EXPENSE' ? 'bg-orange-100 text-orange-600' :
                                            (tx.type as any) === 'DEBT_COLLECTION' ? 'bg-blue-100 text-blue-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                            {(tx.type as any) === 'SALE' ? <TrendingUp className="w-5 h-5" /> :
                                             (tx.type as any) === 'EXPENSE' ? <Receipt className="w-5 h-5" /> :
                                             (tx.type as any) === 'DEBT_COLLECTION' ? <Wallet className="w-5 h-5" /> :
                                             <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 flex items-center gap-2 text-sm">
                                                {tx.customerName}
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                                    (tx.type as any) === 'SALE' ? 'bg-emerald-50 text-emerald-700' :
                                                    (tx.type as any) === 'EXPENSE' ? 'bg-orange-50 text-orange-700' :
                                                    (tx.type as any) === 'DEBT_COLLECTION' ? 'bg-blue-50 text-blue-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                    {(tx.type as any) === 'SALE' ? 'بيع' :
                                                     (tx.type as any) === 'EXPENSE' ? 'مصروف' :
                                                     (tx.type as any) === 'DEBT_COLLECTION' ? 'تحصيل' :
                                                     'مرتجع'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(tx.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center hidden md:block">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">المندوب / التوكيل</div>
                                        <div className="text-sm font-bold text-slate-700 flex flex-col items-center">
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {tx.repName}</span>
                                            <span className="text-[10px] text-slate-400">{tx.agencyName}</span>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">قيمة العملية</div>
                                        <div className="text-md font-black text-slate-800">{formatMoney(tx.revenue)}</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">التكلفة</div>
                                        <div className="text-md font-black text-slate-600">{formatMoney(tx.cost)}</div>
                                    </div>

                                    <div className="text-center flex items-center justify-between md:justify-center gap-4">
                                        <div className="flex flex-col items-end md:items-center">
                                            <div className="text-[10px] text-indigo-400 font-bold uppercase mb-1">الربح الصافي</div>
                                            <div className={`text-xl font-black ${tx.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {formatMoney(tx.profit)}
                                            </div>
                                        </div>
                                        {expandedRows.has(tx.id) ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedRows.has(tx.id) && (
                                <div className="bg-slate-50/80 border-t border-slate-100 p-6 animate-in slide-in-from-top-2 duration-300">
                                    {(tx.type as any) === 'EXPENSE' || (tx.type as any) === 'DEBT_COLLECTION' ? (
                                         <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <FileText className="w-4 h-4" />
                                                <h3 className="text-sm font-bold">وصف وتفاصيل العملية</h3>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-slate-800 font-black text-xl mb-4 leading-relaxed">
                                                    {tx.note || "لا توجد تفاصيل مسجلة"}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50 text-xs font-bold">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <span className="p-1 px-2 bg-slate-100 rounded-md text-slate-600 uppercase">النوع</span>
                                                        {(tx.type as any) === 'EXPENSE' ? 'مصروفات تشغيلية' : 'تحصيل مديونية'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <span className="p-1 px-2 bg-slate-100 rounded-md text-slate-600 uppercase">المبلغ</span>
                                                        <span className="text-slate-800">{formatMoney(Math.abs(tx.profit))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                         </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4 text-slate-600">
                                                <Package className="w-4 h-4" />
                                                <h3 className="text-sm font-bold">تفاصيل المنتجات والتكلفة</h3>
                                            </div>
                                            <div className="grid gap-3">
                                                <div className="grid grid-cols-5 text-xs font-bold text-slate-400 pb-2 px-2 border-b border-slate-200">
                                                    <span>المنتج</span>
                                                    <span className="text-center">الكمية</span>
                                                    <span className="text-center">سعر البيع</span>
                                                    <span className="text-center">سعر التكلفة</span>
                                                    <span className="text-center">ربح الصنف</span>
                                                </div>
                                                {tx.items.map((item, idx) => {
                                                    const price = (item as any).displayPrice || (item as any).price;
                                                    const cost = (item as any).displayCost || (item as any).cost;
                                                    const unitProfit = price - cost;
                                                    const rowProfit = unitProfit * (item as any).quantity;

                                                    return (
                                                        <div key={idx} className="grid grid-cols-5 text-sm px-2 py-2 items-center hover:bg-white rounded-lg transition-colors border-b border-slate-50 last:border-0">
                                                            <div className="font-bold text-slate-700">{(item as any).productName}</div>
                                                            <div className="text-center font-mono text-indigo-600 bg-indigo-50 rounded-md py-0.5 mx-auto px-2">x {(item as any).formattedQuantity || (item as any).quantity}</div>
                                                            <div className="text-center font-bold text-slate-800">{formatMoney(price)}</div>
                                                            <div className="text-center text-slate-500">{formatMoney(cost)}</div>
                                                            <div className={`text-center font-black ${rowProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                {formatMoney(rowProfit)}
                                                                <div className="text-[8px] opacity-70">({formatMoney(unitProfit)} / وحدة)</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex justify-between items-center px-2">
                                        <div className="text-xs text-slate-400">رقم تعريف العملية: <span className="font-mono">{tx.id}</span></div>
                                        <div className="flex gap-4 text-xs font-bold">
                                            <div className="text-slate-500">منفذ العملية: {tx.repName}</div>
                                            <div className="text-slate-500">التوكيل: {tx.agencyName}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    <div className="bg-white/60 backdrop-blur rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-400">لا توجد عمليات تطابق البحث في هذه الفترة</h3>
                        <p className="text-slate-400 text-sm mt-2">جرب تغيير الفترة الزمنية أو مراجعة معايير البحث</p>
                    </div>
                )}
            </div>
        </div>
    );
}
