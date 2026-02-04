import Link from "next/link";
import { getCurrentUser } from "@/lib/actions";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let currentUser = { id: '', role: 'GUEST', agencyId: null } as any;
    try {
        currentUser = await getCurrentUser();
    } catch (e) {
        console.error("Layout data fetch error:", e);
    }
    const role = currentUser.role || 'GUEST';

    console.log('[Dashboard Layout] Current user:', currentUser);

    // Define which menu items are visible for each role
    const canSeeAgencies = role === 'ADMIN' || role === 'MANAGER';
    const canSeeProducts = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'WAREHOUSE_KEEPER';
    const canSeeWarehouses = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'WAREHOUSE_KEEPER';
    const canSeeAccounts = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT';
    const canSeeSalesReports = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'SALES_REPRESENTATIVE';
    const canSeeUsers = role === 'ADMIN' || role === 'MANAGER';
    const canSeeCustomers = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'SALES_REPRESENTATIVE';

    return (
        <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
            {/* Sidebar - Mobile/Desktop */}
            <aside className="w-full md:w-64 bg-emerald-800 text-white flex-shrink-0">
                <div className="p-6 border-b border-emerald-700 text-center">
                    <div className="bg-white rounded-full w-24 h-24 mx-auto mb-3 flex items-center justify-center overflow-hidden border-4 border-emerald-600 shadow-lg">
                        <Image src="/logo.jpg" alt="Logo" width={96} height={96} className="object-cover" />
                    </div>
                    <h2 className="text-xl font-bold">الاحلام للتوكيلات</h2>
                    <p className="text-xs text-emerald-200 mt-1">لوحة التحكم</p>
                    <p className="text-[10px] text-yellow-300 mt-2 font-mono">Role: {role}</p>
                </div>

                <nav className="p-4 space-y-2">
                    {/* Dashboard Home - Always visible */}
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-emerald-700/50 rounded-lg hover:bg-emerald-700 transition">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span>الرئيسية</span>
                    </Link>

                    {/* Agencies - Admin/Manager only */}
                    {canSeeAgencies && (
                        <Link href="/dashboard/agencies" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>التوكيلات (وكلاء)</span>
                        </Link>
                    )}

                    {/* Products */}
                    {canSeeProducts && (
                        <Link href="/dashboard/products" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>المنتجات والأسعار</span>
                        </Link>
                    )}

                    {/* Warehouses */}
                    {canSeeWarehouses && (
                        <Link href="/dashboard/warehouses" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>المخازن</span>
                        </Link>
                    )}

                    {/* Accounts */}
                    {canSeeAccounts && (
                        <Link href="/dashboard/accounts" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>الحسابات</span>
                        </Link>
                    )}

                    {/* Banks & Loans */}
                    {canSeeAccounts && (
                        <Link href="/dashboard/accounts/banks" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                            <span>البنوك والقروض</span>
                        </Link>
                    )}

                    {/* Sales Reports */}
                    {canSeeSalesReports && (
                        <Link href="/dashboard/reports/sales" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition text-emerald-100">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m-8 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2M9 21h6" />
                            </svg>
                            <span>تقارير المبيعات</span>
                        </Link>
                    )}

                    {/* Users - Admin/Manager only */}
                    {canSeeUsers && (
                        <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>المستخدمين</span>
                        </Link>
                    )}

                    {/* Customers */}
                    {canSeeCustomers && (
                        <Link href="/dashboard/customers" className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-700 rounded-lg transition">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>العملاء</span>
                        </Link>
                    )}
                </nav>

                <div className="mt-auto p-4 border-t border-emerald-700">
                    <Link href="/" className="flex items-center gap-3 px-4 py-2 text-red-200 hover:text-white transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>تسجيل الخروج</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
