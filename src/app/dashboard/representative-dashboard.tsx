import {
    TrendingUp,
    Target,
    Users,
    Package,
    ShoppingCart,
    Clock,
    DollarSign,
    PlusCircle,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { RepDashboardStats } from '@/lib/actions/dashboard';

interface Props {
    stats: RepDashboardStats;
    userName: string;
}

export default function RepresentativeDashboard({ stats, userName }: Props) {
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
            COLLECTION: 'تحصيل',
        };
        return labels[type] || type;
    };

    const salesProgress = stats.salesTarget > 0 ? (stats.monthlySales / stats.salesTarget) * 100 : 0;
    const collectionProgress = stats.collectionTarget > 0 ? (stats.monthlyCollections / stats.collectionTarget) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">أهلاً بك، {userName} 👋</h1>
                    <p className="text-gray-500 mt-1">إليك نظرة سريعة على أدائك اليوم.</p>
                </div>
                <div className="text-gray-500 text-sm bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                    {new Date().toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/dashboard/record-sales" className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 font-bold">
                    <PlusCircle className="w-5 h-5" />
                    عملية بيع جديدة
                </Link>
                <Link href="/dashboard/customers" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 font-bold">
                    <DollarSign className="w-5 h-5" />
                    تحصيل مديونية
                </Link>
                <Link href="/dashboard/customers" className="bg-white hover:bg-gray-50 text-gray-800 p-4 rounded-xl shadow-md border border-gray-100 transition flex items-center justify-center gap-2 font-bold">
                    <Users className="w-5 h-5 text-emerald-600" />
                    قائمة العملاء
                </Link>
                <Link href={`/dashboard/reps/${stats.inventory.length > 0 ? 'my-stock' : ''}`} className="bg-white hover:bg-gray-50 text-gray-800 p-4 rounded-xl shadow-md border border-gray-100 transition flex items-center justify-center gap-2 font-bold">
                    <Package className="w-5 h-5 text-amber-600" />
                    جرد عهدتي
                </Link>
            </div>

            {/* Performance Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Today's Sales */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-600 text-sm font-medium">مبيعات اليوم</div>
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-700">
                        {stats.todaySales.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                </div>

                {/* Today's Collections */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-600 text-sm font-medium">تحصيلات اليوم</div>
                        <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-blue-700">
                        {stats.todayCollections.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                </div>

                {/* Total Customer Debt */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-600 text-sm font-medium">مديونية عملائي</div>
                        <Users className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-2xl font-black text-red-700">
                        {stats.totalCustomerDebt.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                </div>

                {/* Inventory Value */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-600 text-sm font-medium">قيمة البضاعة بعهدتي</div>
                        <Package className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-700">
                        {stats.totalInventoryValue.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                    </div>
                </div>
            </div>

            {/* Targets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Target */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <Target className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">مستهدف المبيعات (الشهر الحالي)</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">تم تحقيق: {stats.monthlySales.toLocaleString()} ج.م</span>
                            <span className="font-bold text-gray-800">{salesProgress.toFixed(1)}%</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(salesProgress, 100)}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-400 text-left">
                            المستهدف: {stats.salesTarget.toLocaleString()} ج.م
                        </div>
                    </div>
                </div>

                {/* Collection Target */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">مستهدف التحصيل (الشهر الحالي)</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">تم تحقيق: {stats.monthlyCollections.toLocaleString()} ج.م</span>
                            <span className="font-bold text-gray-800">{collectionProgress.toFixed(1)}%</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(collectionProgress, 100)}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-gray-400 text-left">
                            المستهدف: {stats.collectionTarget.toLocaleString()} ج.م
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Recent Activity & Top Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            آخر العمليات التي قمت بها
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {stats.recentTransactions.length > 0 ? (
                            stats.recentTransactions.map((tx) => (
                                <div key={tx.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        tx.type === 'SALE' ? 'bg-emerald-50 text-emerald-600' : 
                                        tx.type === 'COLLECTION' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                                    }`}>
                                        {tx.type === 'SALE' ? <ShoppingCart className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-green-800">
                                            {getTransactionTypeLabel(tx.type)} - {tx.customer?.name || 'عميل نقدي'}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(tx.createdAt)}
                                        </div>
                                    </div>
                                    <div className="text-left font-black text-gray-800">
                                        {tx.totalAmount.toLocaleString()} ج.م
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400">لا توجد عمليات حديثة</div>
                        )}
                    </div>
                </div>

                {/* Top Stock in Car */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-600" />
                        الأصناف المتوفرة بالعهدة
                    </h2>

                    <div className="space-y-4">
                        {stats.inventory.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100/50">
                                <div className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                                    {item.productName}
                                </div>
                                <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-lg text-xs font-bold">
                                    {item.quantity} قطعة
                                </div>
                            </div>
                        ))}
                        {stats.inventory.length === 0 && (
                            <div className="text-center py-10 text-gray-400">لا توجد أصناف في العهدة حالياً</div>
                        )}
                    </div>

                    {stats.inventory.length > 5 && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-100 text-center">
                            <span className="text-xs text-gray-400">إجمالي الأصناف: {stats.inventory.length} صنف</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
