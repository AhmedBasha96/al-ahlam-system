
'use client';

import { useState } from "react";
import { openDailyClosing, finalizeDailyClosing } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, LogIn, LogOut, CheckCircle2, AlertCircle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Props {
    user: any;
    agencies: any[];
    initialAgencyId?: string;
    openClosing: any;
}

export function DailyClosingForm({ user, agencies, initialAgencyId, openClosing }: Props) {
    const [loading, setLoading] = useState(false);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [actualClosingBalance, setActualClosingBalance] = useState(0);
    const [agencyId, setAgencyId] = useState(initialAgencyId || "");
    const [notes, setNotes] = useState("");

    const handleOpen = async () => {
        if (!agencyId) return alert("يرجى اختيار التوكيل");
        setLoading(true);
        try {
            const res = await openDailyClosing(agencyId, openingBalance);
            if (res.success) {
                window.location.reload();
            } else {
                alert(res.error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!openClosing) return;
        setLoading(true);
        try {
            const res = await finalizeDailyClosing(openClosing.id, actualClosingBalance, notes);
            if (res.success) {
                alert("تم إقفال اليومية بنجاح");
                window.location.reload();
            } else {
                alert(res.error);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!openClosing) {
        return (
            <Card className="border-2 border-emerald-100 shadow-xl overflow-hidden">
                <CardHeader className="bg-emerald-50 text-emerald-900">
                    <div className="flex items-center gap-3">
                        <LogIn className="w-8 h-8 text-emerald-600" />
                        <div>
                            <CardTitle className="text-2xl font-black">بدء وردية جديدة</CardTitle>
                            <CardDescription>قم بتسجيل المبلغ الموجود في الخزينة عند بدء العمل</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-lg font-bold">رصيد أول المدة (نقداً)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={openingBalance}
                                    onChange={e => setOpeningBalance(Number(e.target.value))}
                                    className="text-3xl h-16 text-center font-black text-emerald-700 bg-gray-50 border-2"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ج.م</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleOpen}
                            disabled={loading}
                            className="w-full h-16 text-xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all active:scale-95"
                        >
                            {loading ? "جاري البدء..." : "تأكيد واستلام العهدة 🚀"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const diff = actualClosingBalance - openClosing.expectedBalance;

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-white shadow-md border-r-4 border-r-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <ArrowUpCircle className="w-6 h-6 text-blue-500" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500 font-bold">رصيد البداية</p>
                                <p className="text-xl font-black text-blue-600 font-mono">{Number(openClosing.openingBalance).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md border-r-4 border-r-emerald-500">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <ArrowUpCircle className="w-6 h-6 text-emerald-500" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500 font-bold">إجمالي الداخل</p>
                                <p className="text-xl font-black text-emerald-600 font-mono">+{openClosing.totalDebit.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md border-r-4 border-r-red-500">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <ArrowDownCircle className="w-6 h-6 text-red-500" />
                            <div className="text-left">
                                <p className="text-xs text-gray-500 font-bold">إجمالي الخارج</p>
                                <p className="text-xl font-black text-red-600 font-mono">-{openClosing.totalCredit.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2 border-orange-100 shadow-xl overflow-hidden">
                <CardHeader className="bg-orange-50 text-orange-900 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-orange-600" />
                        <div>
                            <CardTitle className="text-2xl font-black">إقفال اليومية</CardTitle>
                            <CardDescription>الرصيد الدفتري المتوقع: {openClosing.expectedBalance.toLocaleString()} ج.م</CardDescription>
                        </div>
                    </div>
                    <div className="text-left bg-white px-4 py-2 rounded-lg border border-orange-200">
                        <p className="text-[10px] uppercase font-bold text-gray-400">عدد العمليات</p>
                        <p className="font-black text-orange-600">{openClosing.movementsCount}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-lg font-bold">الرصيد الفعلي في الخزينة</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={actualClosingBalance}
                                        onChange={e => setActualClosingBalance(Number(e.target.value))}
                                        className="text-3xl h-16 text-center font-black text-orange-700 bg-gray-50 border-2"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ج.م</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold">ملاحظات الإقفال</Label>
                                <textarea
                                    className="w-full p-3 border rounded-lg min-h-[100px] text-sm"
                                    placeholder="سبب العجز أو الزيادة إن وجد..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-gray-500 font-bold mb-2">مطابقة الرصيد</p>
                            <div className={`text-4xl font-black mb-2 ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {diff > 0 ? "+" : ""}{diff.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2">
                                {diff === 0 ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                        <CheckCircle2 className="w-4 h-4" /> الرصيد مطابق
                                    </span>
                                ) : (
                                    <span className={`flex items-center gap-1 font-bold text-sm px-3 py-1 rounded-full border ${diff > 0 ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-red-600 bg-red-50 border-red-100'}`}>
                                        <AlertCircle className="w-4 h-4" /> {diff > 0 ? "زيادة مالية" : "عجز مالي"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleFinalize}
                        disabled={loading}
                        className="w-full h-16 text-xl font-black bg-orange-600 hover:bg-orange-700 shadow-lg transition-all active:scale-95 flex items-center gap-3"
                    >
                        {loading ? "جاري الإقفال..." : (
                            <>
                                تأكيد إقفال الوردية <LogOut className="w-6 h-6" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
