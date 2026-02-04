'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

const formatMoney = (amount: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);

export default function ClientLoansReport({ initialData }: any) {
    const data = initialData;

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-red-50 via-rose-50/30 to-slate-50">
            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />العودة للتقارير</Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-800 to-rose-600 pb-2">
                    تقرير القروض والأقساط
                </h1>
                <p className="text-slate-600 font-medium">Loans & Installments Report</p>
            </div>

            <div className="relative z-10 grid md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-red-700">إجمالي المبالغ الأصلية</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-red-900">{formatMoney(data.totalPrincipal)}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-rose-700">المتبقي للسداد</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-rose-900">{formatMoney(data.totalRemaining)}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-amber-700">أقساط متأخرة</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-amber-900">{data.overdueInstallmentsCount}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-blue-700">أقساط قادمة (30 يوم)</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-blue-900">{data.upcomingInstallmentsCount}</div></CardContent>
                </Card>
            </div>

            {data.overdueInstallmentsCount > 0 && (
                <Card className="relative z-10 mb-6 bg-gradient-to-r from-red-500 to-rose-600 border-2 border-red-400">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 text-white">
                            <AlertCircle className="w-6 h-6" />
                            <div className="font-bold">تنبيه: يوجد {data.overdueInstallmentsCount} قسط متأخر يحتاج للسداد فوراً!</div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="relative z-10 space-y-4">
                {data.activeLoans.map((loan: any) => {
                    const paidInstallments = loan.installments.filter((i: any) => i.status === 'PAID');
                    const remainingInstallments = loan.installments.filter((i: any) => i.status === 'PENDING');
                    const installmentAmount = loan.installments.length > 0 ? loan.installments[0].amount : 0;

                    return (
                        <Card key={loan.id} className="bg-white/80 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-red-600" />
                                        قرض من {loan.bank?.name || 'Unknown'}
                                    </CardTitle>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-600">المتبقي</div>
                                        <div className="text-2xl font-black text-red-900">
                                            {formatMoney(Number(loan.totalAmount) - paidInstallments.reduce((sum: any, i: any) => sum + Number(i.amount), 0))}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-5 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-600">المبلغ الأصلي</div>
                                        <div className="text-lg font-black">{formatMoney(Number(loan.principal))}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-600">إجمالي للدفع</div>
                                        <div className="text-lg font-black">{formatMoney(Number(loan.totalAmount))}</div>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                                        <div className="text-xs text-blue-700 font-bold">قيمة القسط</div>
                                        <div className="text-lg font-black text-blue-900">{formatMoney(installmentAmount)}</div>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
                                        <div className="text-xs text-amber-700 font-bold">أقساط متبقية</div>
                                        <div className="text-lg font-black text-amber-900">{remainingInstallments.length} قسط</div>
                                    </div>
                                    <div className="p-3 bg-emerald-50 rounded-lg">
                                        <div className="text-xs text-emerald-700">أقساط مدفوعة</div>
                                        <div className="text-lg font-black text-emerald-900">{paidInstallments.length} قسط</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
