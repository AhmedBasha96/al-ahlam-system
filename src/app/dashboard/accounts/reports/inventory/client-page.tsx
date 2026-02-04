'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

const formatMoney = (amount: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);

export default function ClientInventoryReport({ initialData }: any) {
    const data = initialData;

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-teal-50 via-cyan-50/30 to-slate-50">
            <div className="relative z-10 mb-8">
                <Link href="/dashboard/accounts/reports">
                    <Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />العودة للتقارير</Button>
                </Link>
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-cyan-600 pb-2">
                    تقرير المخزون
                </h1>
                <p className="text-slate-600 font-medium">Inventory Report - حالة المخزون</p>
            </div>

            {/* Summary Cards */}
            <div className="relative z-10 grid md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-teal-700">إجمالي الوحدات</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-teal-900">{data.totalItems}</div>
                        <p className="text-xs text-teal-600 mt-1">{data.totalProducts} منتج</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-emerald-700">قيمة المخزون</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-black text-emerald-900">{formatMoney(data.totalValue)}</div></CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-amber-700">مخزون منخفض</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-amber-900">{data.lowStockItems}</div>
                        <p className="text-xs text-amber-600 mt-1">يحتاج للطلب</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                    <CardHeader className="pb-3"><CardTitle className="text-sm text-red-700">نفذ المخزون</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-red-900">{data.outOfStockItems}</div>
                        <p className="text-xs text-red-600 mt-1">غير متوفر</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alert for Low Stock */}
            {(data.lowStockItems > 0 || data.outOfStockItems > 0) && (
                <Card className="relative z-10 mb-6 bg-gradient-to-r from-amber-500 to-orange-600 border-2 border-amber-400">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 text-white">
                            <AlertTriangle className="w-6 h-6" />
                            <div className="font-bold">
                                تنبيه: يوجد {data.lowStockItems} منتج بمخزون منخفض و {data.outOfStockItems} منتج نفذ من المخزون!
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Warehouse Details */}
            <div className="relative z-10 space-y-6">
                {data.warehouses.map((warehouse: any) => (
                    <Card key={warehouse.name} className="bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-teal-600" />
                                    مخزن {warehouse.name} - {warehouse.agencyName}
                                </CardTitle>
                                <div className="text-right">
                                    <div className="text-sm text-slate-600">القيمة الإجمالية</div>
                                    <div className="text-2xl font-black text-teal-900">{formatMoney(warehouse.totalValue)}</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm text-slate-600">إجمالي الوحدات: </span>
                                <span className="font-black text-lg">{warehouse.itemsCount}</span>
                            </div>

                            {/* Products Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-teal-50">
                                        <tr>
                                            <th className="p-2 text-right">المنتج</th>
                                            <th className="p-2 text-right">الباركود</th>
                                            <th className="p-2 text-center">الكمية</th>
                                            <th className="p-2 text-right">سعر المصنع</th>
                                            <th className="p-2 text-right">القيمة</th>
                                            <th className="p-2 text-center">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {warehouse.items.map((item: any) => (
                                            <tr key={item.productId} className="border-b hover:bg-slate-50">
                                                <td className="p-2 font-medium">{item.productName}</td>
                                                <td className="p-2 text-slate-600 text-xs">{item.barcode || '-'}</td>
                                                <td className="p-2 text-center font-bold">{item.quantity}</td>
                                                <td className="p-2">{formatMoney(item.factoryPrice)}</td>
                                                <td className="p-2 font-black text-teal-900">{formatMoney(item.totalValue)}</td>
                                                <td className="p-2 text-center">
                                                    {item.stockStatus === 'OUT_OF_STOCK' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                            <XCircle className="w-3 h-3" /> نفذ
                                                        </span>
                                                    )}
                                                    {item.stockStatus === 'LOW_STOCK' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                                            <AlertTriangle className="w-3 h-3" /> منخفض
                                                        </span>
                                                    )}
                                                    {item.stockStatus === 'IN_STOCK' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                            <CheckCircle className="w-3 h-3" /> متوفر
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
