import { getDashboardStats } from '@/lib/actions/dashboard';
import Link from 'next/link';
import {
    Building2,
    Warehouse,
    Package,
    Users,
    AlertTriangle,
    ShoppingCart,
    UserPlus,
    FileText,
    Clock
} from 'lucide-react';

import { getCurrentUser } from '@/lib/actions';
import ResetDataButton from './reset-button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const stats = await getDashboardStats();
    const user = await getCurrentUser();
    const isAdmin = user.role === 'ADMIN';

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ar-EG', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const getTransactionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            SALE: 'بيع',
            PURCHASE: 'شراء',
            RETURN_IN: 'مرتجع وارد',
            RETURN_OUT: 'مرتجع صادر',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
                <div className="flex items-center gap-4">
                    {/* {isAdmin && <ResetDataButton />} */}
                    <div className="text-gray-500 text-sm">
                        {new Date().toLocaleDateString('ar-EG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Agencies */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Building2 className="w-8 h-8 opacity-80" />
                        <div className="text-3xl font-bold">{stats.totalAgencies}</div>
                    </div>
                    <div className="text-emerald-100 text-sm">إجمالي التوكيلات</div>
                </div>

                {/* Total Warehouses */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Warehouse className="w-8 h-8 opacity-80" />
                        <div className="text-3xl font-bold">{stats.totalWarehouses}</div>
                    </div>
                    <div className="text-blue-100 text-sm">المخازن</div>
                </div>

                {/* Total Products */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Package className="w-8 h-8 opacity-80" />
                        <div className="text-3xl font-bold">{stats.totalProducts}</div>
                    </div>
                    <div className="text-purple-100 text-sm">المنتجات</div>
                </div>

                {/* Total Users */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 opacity-80" />
                        <div className="text-3xl font-bold">{stats.totalUsers}</div>
                    </div>
                    <div className="text-orange-100 text-sm">المستخدمين</div>
                </div>
            </div>

            {/* Sales Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Today's Transactions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-600 text-sm font-medium">عمليات اليوم</div>
                        <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.todayTransactions}
                    </div>
                    <div className="text-sm text-gray-500">
                        عملية بيع
                    </div>
                </div>

                {/* Total Customers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-600 text-sm font-medium">إجمالي العملاء</div>
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.totalCustomers}
                    </div>
                    <div className="text-sm text-gray-500">
                        عميل مسجل
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-600 text-sm font-medium">تنبيه المخزون</div>
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                        {stats.lowStockCount}
                    </div>
                    <div className="text-sm text-gray-500">
                        منتج بمخزون منخفض
                    </div>
                </div>
            </div>


            {/* Alerts & Notifications */}
            {(stats.outOfStockProducts.length > 0 || stats.lowStockProducts.length > 0) && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        تنبيهات المخزون
                    </h2>

                    <div className="space-y-3">
                        {/* Critical Alerts - Out of Stock */}
                        {stats.outOfStockProducts.map((alert) => (
                            <div
                                key={`${alert.productId}-${alert.warehouseName}`}
                                className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200"
                            >
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-red-900 mb-1">
                                        نفاذ المخزون - {alert.productName}
                                    </div>
                                    <div className="text-sm text-red-700">
                                        المخزن: {alert.warehouseName} • الكمية: {alert.currentQuantity}
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full">
                                    حرج
                                </div>
                            </div>
                        ))}

                        {/* Warning Alerts - Low Stock */}
                        {stats.lowStockProducts.map((alert) => (
                            <div
                                key={`${alert.productId}-${alert.warehouseName}`}
                                className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200"
                            >
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-amber-900 mb-1">
                                        مخزون منخفض - {alert.productName}
                                    </div>
                                    <div className="text-sm text-amber-700">
                                        المخزن: {alert.warehouseName} • الكمية المتبقية: {alert.currentQuantity}
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">
                                    تحذير
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">إجراءات سريعة</h2>
                    <div className="space-y-3">
                        <Link
                            href="/dashboard/products/new"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition group"
                        >
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition">
                                <Package className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 text-right">
                                <div className="font-medium text-gray-800">منتج جديد</div>
                                <div className="text-xs text-gray-500">إضافة منتج للنظام</div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/agencies/new"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition group"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 text-right">
                                <div className="font-medium text-gray-800">توكيل جديد</div>
                                <div className="text-xs text-gray-500">إضافة توكيل جديد</div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/users/new"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition group"
                        >
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                                <UserPlus className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 text-right">
                                <div className="font-medium text-gray-800">مستخدم جديد</div>
                                <div className="text-xs text-gray-500">إضافة مستخدم</div>
                            </div>
                        </Link>

                        <Link
                            href="/dashboard/reports/sales"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition group"
                        >
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
                                <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="flex-1 text-right">
                                <div className="font-medium text-gray-800">تقارير المبيعات</div>
                                <div className="text-xs text-gray-500">عرض التقارير</div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800">آخر العمليات</h2>
                        <Link
                            href="/dashboard/reports/sales"
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                            عرض الكل ←
                        </Link>
                    </div>

                    {stats.recentTransactions.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex flex-col gap-2 p-4 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'SALE' ? 'bg-emerald-100' :
                                            tx.type === 'PURCHASE' ? 'bg-blue-100' :
                                                'bg-gray-100'
                                            }`}>
                                            <ShoppingCart className={`w-5 h-5 ${tx.type === 'SALE' ? 'text-emerald-600' :
                                                tx.type === 'PURCHASE' ? 'text-blue-600' :
                                                    'text-gray-600'
                                                }`} />
                                        </div>

                                        <div className="flex-1 text-right">
                                            <div className="font-bold text-gray-800">
                                                {tx.type === 'SALE' && tx.totalAmount === 0
                                                    ? 'تحميل للمندوب'
                                                    : getTransactionTypeLabel(tx.type)}
                                                {tx.customer && ` - ${tx.customer.name}`}
                                            </div>
                                            <div className="text-sm text-gray-600 font-medium">
                                                المندوب: {tx.user.name}
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(tx.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sale Details (Items) */}
                                    {tx.items && tx.items.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                                            <div className="text-xs font-bold text-gray-500 mb-1">تفاصيل العملية:</div>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {tx.items.map((item, idx) => (
                                                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                                                        {item.product.name} ({item.quantity})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>لا توجد عمليات حديثة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
