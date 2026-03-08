import { BarChart3, TrendingUp, TrendingDown, Building2, DollarSign, ShoppingCart, CreditCard, FileText, Package } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
    const reports = [
        {
            title: "الأرباح والخسائر",
            description: "تحليل شامل للربحية وصافي الدخل",
            icon: TrendingUp,
            href: "/dashboard/accounts/reports/profit-loss",
            color: "from-emerald-500 to-teal-600",
            iconBg: "bg-emerald-100 text-emerald-600"
        },
        {
            title: "الإيرادات والمصروفات",
            description: "تفاصيل جميع الحركات النقدية",
            icon: BarChart3,
            href: "/dashboard/accounts/reports/income-expenses",
            color: "from-blue-500 to-indigo-600",
            iconBg: "bg-blue-100 text-blue-600"
        },
        {
            title: "حركة البنوك",
            description: "متابعة جميع الحركات البنكية",
            icon: Building2,
            href: "/dashboard/accounts/reports/bank-movements",
            color: "from-purple-500 to-violet-600",
            iconBg: "bg-purple-100 text-purple-600"
        },
        {
            title: "حالة الخزائن",
            description: "رصيد كل خزنة (عامة وتوكيلات)",
            icon: DollarSign,
            href: "/dashboard/accounts/reports/treasury-status",
            color: "from-amber-500 to-orange-600",
            iconBg: "bg-amber-100 text-amber-600"
        },
        {
            title: "المشتريات",
            description: "تحليل المشتريات والمديونيات",
            icon: ShoppingCart,
            href: "/dashboard/accounts/reports/purchases",
            color: "from-rose-500 to-pink-600",
            iconBg: "bg-rose-100 text-rose-600"
        },
        {
            title: "تقرير المخزون",
            description: "حالة المخزون في جميع المخازن",
            icon: Package,
            href: "/dashboard/accounts/reports/inventory",
            color: "from-teal-500 to-cyan-600",
            iconBg: "bg-teal-100 text-teal-600"
        },
        {
            title: "القروض والأقساط",
            description: "متابعة القروض والأقساط المستحقة",
            icon: CreditCard,
            href: "/dashboard/accounts/reports/loans",
            color: "from-red-500 to-rose-600",
            iconBg: "bg-red-100 text-red-600"
        },
        {
            title: "المبيعات والفواتير",
            description: "سجل كامل لجميع فواتير المبيعات وجلسات المناديب",
            icon: FileText,
            href: "/dashboard/reports/sales",
            color: "from-blue-600 to-cyan-700",
            iconBg: "bg-blue-100 text-blue-700"
        },
        {
            title: "التقرير الشامل",
            description: "نظرة عامة على الوضع المالي الكلي",
            icon: BarChart3,
            href: "/dashboard/accounts/reports/summary",
            color: "from-slate-700 to-slate-900",
            iconBg: "bg-slate-100 text-slate-700"
        }
    ];

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-10">
                <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-800 via-purple-700 to-pink-600 pb-2">
                    التقارير المحاسبية
                </h1>
                <p className="text-slate-600 font-medium text-lg mt-2">
                    تقارير مفصلة وشاملة لجميع الجوانب المالية
                </p>
            </div>

            {/* Reports Grid */}
            <div className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Link key={report.href} href={report.href}>
                            <Card className="group relative overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                                {/* Gradient Bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${report.color}`} />

                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-2xl ${report.iconBg} transform group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-slate-800 mt-4">
                                        {report.title}
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 text-sm leading-relaxed">
                                        {report.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className={`inline-flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${report.color} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                                        عرض التقرير
                                        <TrendingDown className="w-4 h-4 transform rotate-[-45deg] group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardContent>

                                {/* Hover Effect */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Info Section */}
            <div className="relative z-10 mt-12 bg-white/60 backdrop-blur-sm border border-white/80 rounded-3xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                    <span className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <FileText className="w-5 h-5" />
                    </span>
                    مميزات التقارير
                </h2>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <div className="space-y-2">
                        <div className="font-bold text-slate-700">📅 تصفية زمنية</div>
                        <p className="text-sm text-slate-600">إمكانية تحديد الفترة الزمنية لكل تقرير</p>
                    </div>
                    <div className="space-y-2">
                        <div className="font-bold text-slate-700">📊 مخططات تفاعلية</div>
                        <p className="text-sm text-slate-600">رسوم بيانية واضحة لتحليل البيانات</p>
                    </div>
                    <div className="space-y-2">
                        <div className="font-bold text-slate-700">📎 الفواتير المرفقة</div>
                        <p className="text-sm text-slate-600">عرض صور الفواتير مع التفاصيل</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
