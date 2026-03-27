import {
    Warehouse,
    Package,
    AlertTriangle,
    ArrowUpDown,
    ShoppingCart,
    Clock,
    FileText,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { WarehouseDashboardStats } from '@/lib/actions/dashboard';

interface Props {
    stats: WarehouseDashboardStats;
    userName: string;
}

export default function WarehouseDashboard({ stats, userName }: Props) {
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
            SALE: 'بيع/صرف',
            PURCHASE: 'شراء/توريد',
            RETURN_IN: 'مرتجع وارد',
            RETURN_OUT: 'مرتجع صادر',
            INITIAL_STOCK: 'رصيد أول المدة',
            REP_SUBMISSION: 'توريد مندوب'
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">إدارة مخزن: {stats.warehouseName}</h1>
                    <p className="text-gray-500 mt-1">مرحباً {userName}، إليك حالة المخزن الحالية.</p>
                </div>
                <div className="text-gray-500 text-sm bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 italic">
                    {new Date().toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Quick Actions for Warehouse Keeper */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/warehouses" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 font-bold">
                    <ArrowUpDown className="w-5 h-5" />
                    حركة مخزنية (توريد/صرف)
                </Link>
                <Link href="/dashboard/warehouses" className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 font-bold">
                    <FileText className="w-5 h-5" />
                    جرد المخزن
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Products with Stock */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="text-gray-600 text-sm font-medium">الأصناف المتوفرة</div>
                        <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-3xl font-black text-blue-700 relative z-10">
                        {stats.totalProducts} <span className="text-xs font-normal">صنف</span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Warehouse size={120} />
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="text-gray-600 text-sm font-medium">تنبيهات النواقص</div>
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-3xl font-black text-amber-700 relative z-10">
                        {stats.lowStockItems.length + stats.outOfStockItems.length} <span className="text-xs font-normal">تنبيه</span>
                    </div>
                </div>
            </div>

            {/* Inventory Alerts List */}
            {(stats.outOfStockItems.length > 0 || stats.lowStockItems.length > 0) && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        نواقص وتنبيهات المخزون
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.outOfStockItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                    <XCircle className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-red-900">{item.productName}</div>
                                    <div className="text-[10px] text-red-600">رصيد المخزن: 0</div>
                                </div>
                                <div className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-black">نفاذ</div>
                            </div>
                        ))}
                        {stats.lowStockItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-amber-900">{item.productName}</div>
                                    <div className="text-[10px] text-amber-600">الكمية المتبقية: {item.currentQuantity}</div>
                                </div>
                                <div className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-black">منخفض</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Movement */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            آخر الحركات المخزنية
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {stats.recentTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition border-r-4 border-r-blue-500">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">
                                            {getTransactionTypeLabel(tx.type)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                            {tx.customer?.name || tx.supplier?.name || "حركة داخلية"}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(tx.createdAt)} | بواسطة: {tx.user.name}
                                    </div>
                                </div>
                                <div className="group relative">
                                    <div className="text-xs font-black text-slate-500 hover:text-blue-600 cursor-help">
                                        {tx.items.length} أصناف
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock Level Quick View */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-emerald-600" />
                        الأصناف الأكثر توفراً
                    </h2>
                    <div className="space-y-4">
                        {stats.inventory.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                    <span className="truncate max-w-[140px]">{item.productName}</span>
                                    <span>{item.quantity} قطعة</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 transition-all"
                                        style={{ width: `${Math.min((item.quantity / 500) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function XCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    );
}
