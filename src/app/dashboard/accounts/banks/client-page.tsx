'use client';

import { createBank } from "@/lib/actions/banks";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Landmark, AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

export default function ClientBanksPage({ banks, alerts }: { banks: any[], alerts: any[] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 overflow-hidden text-slate-100">
            {/* Dark Glass Background */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 pb-2">
                            الحسابات البنكية والقروض
                        </h1>
                        <p className="text-slate-400 font-medium ml-1">
                            إدارة الأرصدة البنكية، القروض، وجدولة الأقساط
                        </p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 px-6 py-6 rounded-2xl font-bold transition-all">
                                <Plus className="ml-2 h-5 w-5" />
                                إضافة حساب بنكي
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">إضافة بنك جديد</DialogTitle>
                            </DialogHeader>
                            <form action={async (formData) => { await createBank(formData); setOpen(false); }} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>اسم البنك</Label>
                                    <Input name="name" placeholder="مثال: البنك الأهلي المصري" className="bg-slate-800 border-slate-700" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>رقم الحساب (اختياري)</Label>
                                    <Input name="accountNumber" placeholder="XXXX-XXXX-XXXX" className="bg-slate-800 border-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <Label>رصيد الافتتاح</Label>
                                    <Input name="initialBalance" type="number" step="0.01" defaultValue="0" className="bg-slate-800 border-slate-700" />
                                </div>
                                <Button type="submit" className="w-full bg-indigo-600 font-bold mt-4">حفظ البيانات</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Alerts Section (Only if there are alerts) */}
                {alerts.length > 0 && (
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-6 h-6 text-rose-500" />
                                <h3 className="text-xl font-bold text-rose-200">تنبيهات استحقاق الأقساط</h3>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {alerts.map(alert => (
                                    <div key={alert.id} className="bg-rose-950/40 p-4 rounded-xl border border-rose-500/20 flex justify-between items-center">
                                        <div>
                                            <p className="text-rose-100 font-bold text-sm mb-1">{alert.loan.bank.name}</p>
                                            <p className="text-xs text-rose-300">استحقاق: {new Date(alert.dueDate).toLocaleDateString('ar-EG')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-rose-400">{formatMoney(Number(alert.amount))}</p>
                                            <Link href={`/dashboard/accounts/banks/${alert.loan.bank.id}`} className="text-[10px] text-rose-300 underline mt-1 block">
                                                سداد الآن
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Banks Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {banks.map((bank) => (
                        <Link href={`/dashboard/accounts/banks/${bank.id}`} key={bank.id} className="group">
                            <div className="glass-card-dark h-full p-8 rounded-3xl relative overflow-hidden hover:bg-slate-800/80 transition-all border border-white/5 hover:border-indigo-500/50 group-hover:-translate-y-1 shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-colors"></div>

                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="p-3 bg-slate-800 rounded-2xl border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                                        <Landmark className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    {bank._count.loans > 0 && (
                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                                            {bank._count.loans} قروض نشطة
                                        </span>
                                    )}
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-slate-100 mb-1">{bank.name}</h3>
                                    <p className="text-sm text-slate-400 font-mono mb-6">{bank.accountNumber || '****'}</p>

                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">الرصيد الحالي</p>
                                    <div className="text-4xl font-black text-white tracking-tight">
                                        {formatMoney(Number(bank.balance))}
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                                    <ArrowRight className="text-indigo-400 w-6 h-6" />
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Empty State / Add New Card */}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <button className="h-full min-h-[250px] p-8 rounded-3xl border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/30 flex flex-col items-center justify-center gap-4 group transition-all">
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                    <Plus className="w-8 h-8 text-slate-400 group-hover:text-white" />
                                </div>
                                <span className="text-slate-400 font-bold group-hover:text-indigo-300">إضافة بنك جديد</span>
                            </button>
                        </DialogTrigger>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
