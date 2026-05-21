
'use client';

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, ArrowDownCircle, History, Search, Building2, ShieldAlert, Loader2, CheckCircle2, Filter } from "lucide-react";
import { recordRepSubmission, getRepsWithCustody } from "@/lib/actions";

export default function RepsCustodyClient({ initialReps }: { initialReps: any[] }) {
    const [reps, setReps] = useState(initialReps);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAgencyId, setFilterAgencyId] = useState("ALL");
    
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [amounts, setAmounts] = useState<{ [id: string]: string }>({});
    const [notes, setNotes] = useState<{ [id: string]: string }>({});

    // Filter Logic
    const filteredReps = useMemo(() => {
        return reps.filter(rep => {
            const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAgency = filterAgencyId === 'ALL' || rep.agencyId === filterAgencyId;
            return matchesSearch && matchesAgency;
        });
    }, [reps, searchTerm, filterAgencyId]);

    // Grouping by Agency for the list (if needed)
    const agencies = useMemo(() => {
        const unique = new Map();
        reps.forEach(r => {
            if (r.agencyId) unique.set(r.agencyId, r.agencyName);
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [reps]);

    const handleSubmission = async (repId: string) => {
        const amount = parseFloat(amounts[repId]);
        if (!amount || amount <= 0) return alert("يرجى إدخال مبلغ صحيح");

        setSubmitting(repId);
        try {
            const result = await recordRepSubmission(repId, amount, notes[repId]);
            if (result.success) {
                alert("تم استلام المبلغ بنجاح وتحديث الخزينة");
                const updated = await getRepsWithCustody();
                setReps(updated);
                setAmounts(prev => ({ ...prev, [repId]: "" }));
                setNotes(prev => ({ ...prev, [repId]: "" }));
            } else {
                alert("حدث خطأ: " + (result as any).error);
            }
        } catch (error) {
            alert("فشل في العملية");
        } finally {
            setSubmitting(null);
        }
    };

    const formatMoney = (val: number) => val.toLocaleString() + " ج.م";

    return (
        <div className="space-y-8 pb-20">
            {/* Control Panel: Grouping, Filter, Search */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl">
                            <Wallet className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">تحصيلات وعهد المناديب</h1>
                            <p className="text-slate-400 font-bold text-sm">إدارة النقدية حسب التوكيل والمندوب</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    {/* Search by Representative Name */}
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input 
                            placeholder="ابحث باسم المندوب..."
                            className="pr-12 h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter by Agency */}
                    <div className="flex items-center gap-2 bg-slate-50 px-4 rounded-2xl h-14">
                        <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                        <Select value={filterAgencyId} onValueChange={setFilterAgencyId}>
                            <SelectTrigger className="border-none bg-transparent shadow-none focus:ring-0 font-bold text-slate-600">
                                <SelectValue placeholder="تصفية حسب التوكيل" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                                <SelectItem value="ALL">جميع التوكيلات</SelectItem>
                                {agencies.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-emerald-600 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg shadow-emerald-100">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 opacity-60" />
                            <span className="text-xs font-bold uppercase tracking-wider">إجمالي العهد المرصودة</span>
                        </div>
                        <span className="text-2xl font-black">{formatMoney(filteredReps.reduce((sum, r) => sum + r.currentCustody, 0))}</span>
                    </div>
                </div>
            </div>

            {/* Rep Cards List */}
            <div className="grid grid-cols-1 gap-8">
                {filteredReps.length === 0 ? (
                    <div className="bg-white p-20 rounded-[32px] text-center border-2 border-dashed border-slate-100">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-xl">لا يوجد مناديب مطابقين للبحث</p>
                    </div>
                ) : (
                    filteredReps.map((rep) => (
                        <Card key={rep.id} className="p-0 overflow-hidden rounded-[32px] border-none shadow-xl shadow-slate-200/50">
                            <div className="grid grid-cols-1 xl:grid-cols-12">
                                {/* Left Side: Info & Action */}
                                <div className="xl:col-span-5 bg-white p-8 border-b xl:border-b-0 xl:border-l border-slate-50">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                                            {rep.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800">{rep.name}</h3>
                                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                                                <Building2 className="w-3 h-3" />
                                                {rep.agencyName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">إجمالي النقدية مع المندوب</p>
                                            <div className="flex items-end justify-between">
                                                <span className="text-4xl font-black text-emerald-600 tracking-tighter">
                                                    {formatMoney(rep.currentCustody)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                <ArrowDownCircle className="w-4 h-4 text-slate-400" />
                                                استلام توريد نقدية
                                            </h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="relative">
                                                    <Input 
                                                        placeholder="أدخل المبلغ..."
                                                        type="number"
                                                        value={amounts[rep.id] || ""}
                                                        onChange={e => setAmounts(prev => ({ ...prev, [rep.id]: e.target.value }))}
                                                        className="p-6 h-14 text-xl font-black rounded-2xl border-2 border-slate-50 focus:border-emerald-500 transition-all bg-slate-50/30"
                                                    />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">ج.م</span>
                                                </div>
                                                <Input 
                                                    placeholder="ملاحظات..."
                                                    value={notes[rep.id] || ""}
                                                    onChange={e => setNotes(prev => ({ ...prev, [rep.id]: e.target.value }))}
                                                    className="p-4 h-12 rounded-xl border-slate-100 text-sm"
                                                />
                                                <Button 
                                                    onClick={() => handleSubmission(rep.id)}
                                                    disabled={submitting === rep.id || !amounts[rep.id]}
                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-lg gap-3 shadow-lg shadow-slate-200"
                                                >
                                                    {submitting === rep.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6" />}
                                                    تأكيد الاستلام والتوريد
                                                </Button>
                                                
                                                {parseFloat(amounts[rep.id]) > rep.currentCustody && (
                                                    <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                                                        <ShieldAlert className="w-4 h-4 shrink-0" />
                                                        <p className="text-[10px] font-bold italic">عذراً، المبلغ أكبر من المحصل حالياً مع المندوب.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Details */}
                                <div className="xl:col-span-7 bg-slate-50/20 p-8 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                                            <History className="w-3 h-3" />
                                            آخر التحصيلات المرصودة
                                        </h4>
                                    </div>

                                    <div className="flex-1 rounded-[24px] border border-slate-100 bg-white shadow-sm overflow-hidden min-h-[300px]">
                                        <Table>
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow>
                                                    <TableHead className="font-black text-[9px] text-slate-400 px-6">التاريخ</TableHead>
                                                    <TableHead className="font-black text-[9px] text-slate-400">العميل</TableHead>
                                                    <TableHead className="font-black text-[9px] text-slate-400">النوع</TableHead>
                                                    <TableHead className="font-black text-[9px] text-slate-400 text-left px-6">المبلغ</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rep.recentCollections.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-20 text-slate-300 font-bold text-sm italic">
                                                            لا توجد معاملات مؤخرًا
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    rep.recentCollections.map((col: any) => (
                                                        <TableRow key={col.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                                                            <TableCell className="text-[11px] font-bold text-slate-400 px-6 py-4">
                                                                {new Date(col.date).toLocaleDateString('ar-EG')}
                                                            </TableCell>
                                                            <TableCell className="font-black text-slate-700 text-sm">{col.customerName}</TableCell>
                                                            <TableCell>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${col.type === 'SALE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                    {col.type === 'SALE' ? 'بيع' : 'تحصيل'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-left font-black text-emerald-600 px-6">
                                                                +{col.amount.toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    
                                    <div className="mt-6 flex gap-4">
                                        <div className="flex-1 bg-white/60 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي التوريدات (صادر)</p>
                                            <p className="text-xl font-black text-rose-500">{formatMoney(rep.totalSubmitted)}</p>
                                        </div>
                                        <div className="flex-1 bg-white/60 p-4 rounded-2xl border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">إجمالي التحصيلات (وارد)</p>
                                            <p className="text-xl font-black text-emerald-700">{formatMoney(rep.totalCollected)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
