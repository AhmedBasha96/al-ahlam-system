'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    Menu,
    X,
    LayoutDashboard,
    Building2,
    Package,
    Warehouse,
    Wallet,
    History,
    Users,
    FileText,
    LogOut,
    PlusCircle,
    TrendingUp
} from 'lucide-react';

interface SidebarProps {
    role: string;
}

export default function Sidebar({ role }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const canSeeAgencies = role === 'ADMIN' || role === 'MANAGER';
    const canSeeProducts = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'WAREHOUSE_KEEPER';
    const canSeeWarehouses = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'WAREHOUSE_KEEPER';
    const canSeeAccounts = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT';
    const canSeeSalesReports = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'SALES_REPRESENTATIVE';
    const canSeeUsers = role === 'ADMIN' || role === 'MANAGER';
    const canSeeCustomers = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'SALES_REPRESENTATIVE';
    const canRecordSales = role === 'ADMIN' || role === 'MANAGER' || role === 'ACCOUNTANT' || role === 'SALES_RECORDER';

    const menuItems = [
        { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard, visible: true },
        { href: '/dashboard/agencies', label: 'التوكيلات', icon: Building2, visible: canSeeAgencies },
        { href: '/dashboard/products', label: 'الأصناف والأسعار', icon: Package, visible: canSeeProducts },
        { href: '/dashboard/warehouses', label: 'المخازن', icon: Warehouse, visible: canSeeWarehouses },
        { href: '/dashboard/accounts', label: 'الحسابات', icon: Wallet, visible: canSeeAccounts },
        { href: '/dashboard/accounts/banks', label: 'البنوك والقروض', icon: Building2, visible: canSeeAccounts },
        { href: '/dashboard/reports/sales', label: 'تقارير المبيعات', icon: History, visible: canSeeSalesReports },
        { href: '/dashboard/record-sales', label: 'تسجيل فواتير', icon: PlusCircle, visible: canRecordSales, highlighted: true },
        { href: '/dashboard/users', label: 'المستخدمين', icon: Users, visible: canSeeUsers },
        { href: '/dashboard/customers', label: 'العملاء', icon: Users, visible: canSeeCustomers },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden bg-emerald-800 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-3">
                    <Image src="/logo.jpg" alt="Logo" width={32} height={32} className="rounded-full" />
                    <span className="font-bold text-lg">الاحلام</span>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-emerald-700 rounded-lg transition"
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 right-0 h-full bg-emerald-800 text-white w-72 z-50 transition-transform duration-300 ease-in-out flex flex-col
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                md:translate-x-0 md:sticky md:top-0 md:z-auto md:w-64 md:flex-shrink-0
            `}>
                {/* Logo Section */}
                <div className="p-8 border-b border-emerald-700/50 text-center flex flex-col items-center">
                    <div className="bg-white rounded-full w-20 h-20 mb-4 flex items-center justify-center overflow-hidden border-4 border-emerald-600/50 shadow-xl group hover:scale-105 transition-transform">
                        <Image src="/logo.jpg" alt="Logo" width={80} height={80} className="object-cover" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight">الاحلام للتوكيلات</h2>
                    <p className="text-[10px] text-emerald-300/80 mt-1 uppercase tracking-widest font-bold">لوحة التحكم</p>
                    <div className="mt-3 px-3 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                        <span className="text-[10px] text-yellow-400 font-black font-mono tracking-tighter uppercase">{role}</span>
                    </div>
                </div>

                {/* Nav Section */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    {menuItems.filter(item => item.visible).map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeSidebar}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-white text-emerald-900 shadow-lg font-black scale-[1.02]'
                                        : item.highlighted
                                            ? 'bg-emerald-700/30 text-emerald-50 border border-emerald-500/20 hover:bg-emerald-700/50'
                                            : 'text-emerald-100/70 hover:bg-emerald-700 hover:text-white hover:translate-x-[-4px]'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'group-hover:text-white transition-colors'}`} />
                                <span className="text-sm">{item.label}</span>
                                {item.highlighted && !isActive && (
                                    <div className="mr-auto w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Section */}
                <div className="p-4 border-t border-emerald-700/50 bg-emerald-900/20">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 text-red-300 hover:text-red-100 hover:bg-red-500/10 rounded-xl transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-sm font-bold">تسجيل الخروج</span>
                    </Link>
                </div>
            </aside>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </>
    );
}
