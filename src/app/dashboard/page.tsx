export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">الرئيسية</h1>
                <div className="text-gray-500 text-sm">{new Date().toLocaleDateString('ar-EG')}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Stat Cards - Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                    <div className="text-gray-500 text-sm mb-1 text-right">إجمالي التوكيلات</div>
                    <div className="text-3xl font-bold text-emerald-700 text-right">3</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                    <div className="text-gray-500 text-sm mb-1 text-right">إجمالي المنتجات</div>
                    <div className="text-3xl font-bold text-emerald-700 text-right">124</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                    <div className="text-gray-500 text-sm mb-1 text-right">المبيعات اليوم</div>
                    <div className="text-3xl font-bold text-emerald-700 text-right">0 ج.م</div>
                </div>

                {/* New Reports Link Card */}
                <a href="/dashboard/reports/sales" className="bg-emerald-600 p-6 rounded-xl shadow-md border border-emerald-500 flex flex-col justify-center items-center hover:bg-emerald-700 transition group cursor-pointer">
                    <div className="text-white/80 text-sm mb-1 font-bold group-hover:text-white">تقارير المبيعات</div>
                    <div className="text-2xl font-black text-white flex items-center gap-2">
                        <span>📊</span> عرض السجل
                    </div>
                </a>
            </div>
        </div>
    )
}
