'use client';

import { createBankTransaction, createLoan, payInstallment, depositFromSafeToBank } from "@/lib/actions/banks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Landmark, ArrowUpRight, ArrowDownLeft, FileText, Banknote, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

export default function ClientBankDetailsPage({ bank, agencies }: { bank: any, agencies: any[] }) {
    const [txOpen, setTxOpen] = useState(false);
    const [loanOpen, setLoanOpen] = useState(false);

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-slate-950 text-slate-100 overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Top Stats */}
            <div className="relative z-10 grid gap-6 grid-cols-1 lg:grid-cols-3 mb-8">
                <div className="lg:col-span-2 glass-card-dark p-8 rounded-3xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full"></div>

                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2">{bank.name}</h1>
                            <p className="text-slate-400 font-mono text-lg">{bank.accountNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-2xl">
                            <Landmark className="w-8 h-8 text-indigo-400" />
                        </div>
                    </div>

                    <div className="mt-8 relative z-10">
                        <p className="text-sm font-bold text-slate-500 uppercase mb-1">الرصيد الحالي المتوفر</p>
                        <div className="text-6xl font-black text-indigo-100 tracking-tight glow-text">
                            {formatMoney(Number(bank.balance))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Action: Add Transaction */}
                    <Dialog open={txOpen} onOpenChange={setTxOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full h-20 text-lg bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
                                <ArrowUpRight className="w-6 h-6" />
                                <span>إيداع / سحب مباشر</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white">
                            <DialogHeader><DialogTitle>تسجيل حركة بنكية</DialogTitle></DialogHeader>
                            <Tabs defaultValue="direct" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                                    <TabsTrigger value="direct">مباشر (بدون خزنة)</TabsTrigger>
                                    <TabsTrigger value="safe">من الخزنة</TabsTrigger>
                                </TabsList>
                                <TabsContent value="direct">
                                    <form action={async (fd) => { await createBankTransaction(fd); setTxOpen(false); }} className="space-y-4 mt-4">
                                        <input type="hidden" name="bankId" value={bank.id} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>نوع الحركة</Label>
                                                <select name="type" className="w-full h-10 bg-slate-800 border-slate-700 rounded-md px-3 text-sm">
                                                    <option value="DEPOSIT">إيداع (+)</option>
                                                    <option value="WITHDRAWAL">سحب (-)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>المبلغ</Label>
                                                <Input name="amount" type="number" step="0.01" className="bg-slate-800 border-slate-700" required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>الوصف</Label>
                                            <Input name="description" className="bg-slate-800 border-slate-700" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank-image-direct">📎 إرفاق الإيصال (اختياري)</Label>
                                            <Input id="bank-image-direct" name="image" type="file" accept="image/*" className="bg-slate-800 border-slate-700 file:mr-2 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-indigo-100 file:text-indigo-700 file:font-semibold hover:file:bg-indigo-200" />
                                        </div>
                                        <Button type="submit" className="w-full bg-indigo-600 font-bold">تأكيد العملية</Button>
                                    </form>
                                </TabsContent>
                                <TabsContent value="safe">
                                    <form action={async (fd) => { await depositFromSafeToBank(fd); setTxOpen(false); }} className="space-y-4 mt-4">
                                        <input type="hidden" name="bankId" value={bank.id} />
                                        <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 mb-4">
                                            <p className="text-amber-500 text-sm flex gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                سيتم خصم المبلغ من الخزنة المحددة وتسجيله كمصروف، وإيداعه في هذا الحساب البنكي.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>اختر الخزنة (مصدر الأموال)</Label>
                                            <select name="agencyId" className="w-full h-10 bg-slate-800 border-slate-700 rounded-md px-3 text-sm">
                                                <option value="GENERAL">الخزنة العامة (الرئيسية)</option>
                                                {agencies.map((agency: any) => (
                                                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>المبلغ المراد تحويله</Label>
                                            <Input name="amount" type="number" step="0.01" className="bg-slate-800 border-slate-700" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ملاحظات</Label>
                                            <Input name="description" placeholder="إيداع ايرادات الاسبوع..." className="bg-slate-800 border-slate-700" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank-image-safe">📎 إرفاق الإيصال (اختياري)</Label>
                                            <Input id="bank-image-safe" name="image" type="file" accept="image/*" className="bg-slate-800 border-slate-700 file:mr-2 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-emerald-100 file:text-emerald-700 file:font-semibold hover:file:bg-emerald-200" />
                                        </div>
                                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold">تأكيد الإيداع من الخزنة</Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>

                    {/* Action: New Loan */}
                    <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-20 text-lg border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:text-white rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] text-slate-300">
                                <Banknote className="w-6 h-6" />
                                <span>طلب قرض جديد</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white">
                            <DialogHeader><DialogTitle>فتح تسهيل ائتماني / قرض</DialogTitle></DialogHeader>
                            <form action={async (fd) => { await createLoan(fd); setLoanOpen(false); }} className="space-y-4 mt-4">
                                <input type="hidden" name="bankId" value={bank.id} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>مبلغ القرض (Principal)</Label>
                                        <Input name="principal" type="number" className="bg-slate-800 border-slate-700" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>نسبة الفائدة %</Label>
                                        <Input name="interestRate" type="number" defaultValue="0" className="bg-slate-800 border-slate-700" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>عدد الأشهر (الأقساط)</Label>
                                        <Input name="months" type="number" defaultValue="12" className="bg-slate-800 border-slate-700" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>تاريخ البدء</Label>
                                        <Input name="startDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-slate-800 border-slate-700" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>ملاحظات</Label>
                                    <Input name="notes" placeholder="تمويل بضاعة..." className="bg-slate-800 border-slate-700" />
                                </div>
                                <div className="bg-amber-500/10 p-3 rounded text-amber-500 text-xs mt-2">
                                    * سيتم إيداع مبلغ القرض تلقائياً في حساب البنك وإنشاء جدول الأقساط.
                                </div>
                                <Button type="submit" className="w-full bg-indigo-600 font-bold">إنشاء القرض</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl mb-6">
                    <TabsTrigger value="transactions" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6">سجل المعاملات</TabsTrigger>
                    <TabsTrigger value="loans" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-6">القروض والأقساط</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                    <div className="glass-card-dark rounded-3xl overflow-hidden border border-white/10">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="hover:bg-transparent border-slate-800">
                                    <TableHead className="text-slate-400">التاريخ</TableHead>
                                    <TableHead className="text-slate-400">نوع الحركة</TableHead>
                                    <TableHead className="text-slate-400">الوصف</TableHead>
                                    <TableHead className="text-right text-slate-400">المبلغ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bank.transactions.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-slate-800">
                                        <TableCell colSpan={4} className="h-48 text-center text-slate-500">لا توجد حركات مسجلة</TableCell>
                                    </TableRow>
                                ) : (
                                    bank.transactions.map((tx: any) => (
                                        <TableRow key={tx.id} className="hover:bg-slate-800/50 border-slate-800">
                                            <TableCell className="font-mono text-slate-400 text-xs">
                                                {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell>
                                                {tx.type === 'DEPOSIT' ?
                                                    <span className="text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-400/10 rounded">إيداع (+ وارد)</span> :
                                                    <span className="text-rose-400 text-xs font-bold px-2 py-1 bg-rose-400/10 rounded">سحب (- صادر)</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-slate-300">{tx.description}</TableCell>
                                            <TableCell className={`text-right font-mono font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatMoney(Number(tx.amount))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="loans">
                    <div className="space-y-6">
                        {bank.loans.length === 0 ? (
                            <div className="glass-card-dark p-12 rounded-3xl text-center border mr-white/10">
                                <Banknote className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-500 text-lg">لا توجد قروض نشطة لهذا البنك</p>
                            </div>
                        ) : (
                            bank.loans.map((loan: any) => (
                                <div key={loan.id} className={`glass-card-dark rounded-3xl overflow-hidden border ${loan.status === 'ACTIVE' ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
                                    {/* Loan Header */}
                                    <div className="p-6 bg-slate-900/50 flex justify-between items-center border-b border-white/5">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-white mb-1">قرض: {loan.notes || 'بدون عنوان'}</h3>
                                                <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${loan.status === 'ACTIVE' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                    {loan.status === 'ACTIVE' ? 'نشط (جاري السداد)' : 'مغلق (خالص)'}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-sm">
                                                تاريخ البدء: {new Date(loan.startDate).toLocaleDateString('ar-EG')} • القيمة الإجمالية: {formatMoney(Number(loan.totalAmount))}
                                            </p>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm text-slate-500">متبقي للسداد</div>
                                            <div className="text-2xl font-black text-white">
                                                {formatMoney(
                                                    loan.installments.filter((i: any) => i.status === 'PENDING')
                                                        .reduce((sum: number, i: any) => sum + Number(i.amount), 0)
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Installments List */}
                                    <div className="p-6">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> جدول الأقساط
                                        </h4>
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                            {loan.installments.map((inst: any) => {
                                                const isPastDue = new Date(inst.dueDate) < new Date() && inst.status === 'PENDING';

                                                return (
                                                    <div key={inst.id} className={`p-4 rounded-xl border flex flex-col justify-between h-32 relative overflow-hidden ${inst.status === 'PAID' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                                        isPastDue ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/50 border-slate-700'
                                                        }`}>
                                                        {inst.status === 'PAID' && <div className="absolute top-2 left-2 text-emerald-500"><CheckCircle className="w-5 h-5" /></div>}

                                                        <div>
                                                            <p className={`font-bold text-sm mb-1 ${isPastDue ? 'text-rose-400' : 'text-slate-300'}`}>
                                                                استحقاق: {new Date(inst.dueDate).toLocaleDateString('ar-EG')}
                                                            </p>
                                                            <p className="text-xl font-black text-white">{formatMoney(Number(inst.amount))}</p>
                                                        </div>

                                                        {inst.status === 'PENDING' && (
                                                            <form action={async () => { await payInstallment(inst.id, bank.id); }}>
                                                                <Button size="sm" variant={isPastDue ? "destructive" : "default"} className={`w-full h-8 text-xs font-bold ${isPastDue ? '' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                                                                    {isPastDue ? 'سداد متأخر' : 'سداد الآن'}
                                                                </Button>
                                                            </form>
                                                        )}
                                                        {inst.status === 'PAID' && (
                                                            <p className="text-xs text-emerald-500 text-center font-bold mt-auto bg-emerald-500/10 py-1 rounded">تم السداد</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
