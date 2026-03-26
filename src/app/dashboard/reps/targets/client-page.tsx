
'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSalesReps, upsertSalesTarget, getRepsPerformance } from "@/lib/actions/reps";
import { TrendingUp, Target, DollarSign, Loader2, Save, User as UserIcon, Calendar as CalendarIcon } from "lucide-react";

export default function ClientTargetsPage() {
    const [reps, setReps] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadData();
    }, [month, year]);

    async function loadData() {
        setLoading(true);
        try {
            const [repsData, perfData] = await Promise.all([
                getSalesReps(),
                getRepsPerformance(month, year)
            ]);
            setReps(repsData);
            setPerformance(perfData);
        } catch (error) {
            console.error("Load targets error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(repId: string, salesTarget: number, collectionTarget: number) {
        setSaving(repId);
        try {
            const result = await upsertSalesTarget(repId, month, year, salesTarget, collectionTarget);
            if (result.success) {
                alert("تم حفظ التارجت بنجاح");
                loadData();
            } else {
                alert("فشل الحفظ: " + result.error);
            }
        } catch (error) {
            alert("حدث خطأ غير متوقع");
        } finally {
            setSaving(null);
        }
    }

    const formatMoney = (val: number) => val.toLocaleString() + " ج.م";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 rounded-2xl">
                        <Target className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الأهداف البيعية</h1>
                        <p className="text-slate-400 font-bold text-sm">تحديد ومتابعة تارجت المناديب لشهر {month}/{year}</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <CalendarIcon className="w-5 h-5 text-slate-400 ml-2" />
                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger className="w-32 bg-white border-none shadow-sm font-bold">
                            <SelectValue placeholder="الشهر" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger className="w-32 bg-white border-none shadow-sm font-bold">
                            <SelectValue placeholder="السنة" />
                        </SelectTrigger>
                        <SelectContent>
                            {[2024, 2025, 2026, 2027].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <p className="text-slate-400 font-bold animate-pulse">جاري تحميل البيانات...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {performance.map((rep) => (
                        <Card key={rep.id} className="p-8 rounded-[32px] border-2 border-slate-50 shadow-xl shadow-slate-200/50 hover:border-indigo-100 transition-all duration-300">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <UserIcon className="w-7 h-7 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">{rep.name}</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">تارجت مخصص</p>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => handleSave(rep.id, rep.salesTarget, rep.collectionTarget)}
                                    disabled={saving === rep.id}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-6 font-black flex gap-2 h-auto"
                                >
                                    {saving === rep.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    حفظ التعديلات
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Sales Target Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-black text-slate-600">تارجت المبيعات</span>
                                    </div>
                                    <div className="relative group">
                                        <Input 
                                            type="number" 
                                            defaultValue={rep.salesTarget}
                                            onChange={(e) => rep.salesTarget = parseFloat(e.target.value) || 0}
                                            className="p-6 text-2xl font-black rounded-2xl border-2 border-slate-100 focus:border-emerald-500 transition-all"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">ج.م</span>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-bold">المحقق حالياً:</span>
                                            <span className="text-emerald-600 font-black">{formatMoney(rep.actualSales)}</span>
                                        </div>
                                        <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-100">
                                            <div 
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(rep.salesProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-left text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            نسبة الإنجاز: %{rep.salesProgress.toFixed(1)}
                                        </div>
                                    </div>
                                </div>

                                {/* Collection Target Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <DollarSign className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-black text-slate-600">تارجت التحصيلات</span>
                                    </div>
                                    <div className="relative group">
                                        <Input 
                                            type="number" 
                                            defaultValue={rep.collectionTarget}
                                            onChange={(e) => rep.collectionTarget = parseFloat(e.target.value) || 0}
                                            className="p-6 text-2xl font-black rounded-2xl border-2 border-slate-100 focus:border-blue-500 transition-all"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">ج.م</span>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-400 font-bold">المحقق حالياً:</span>
                                            <span className="text-blue-600 font-black">{formatMoney(rep.actualCollections)}</span>
                                        </div>
                                        <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-100">
                                            <div 
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(rep.collectionProgress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-left text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            نسبة الإنجاز: %{rep.collectionProgress.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

