"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, Wallet, FileText, ShoppingBag, Landmark } from "lucide-react";

interface NavProps {
    role: string;
}

export default function AccountsNav({ role }: NavProps) {
    const pathname = usePathname();

    const navItems = [
        { name: "نظرة عامة", href: "/dashboard/accounts", icon: LayoutDashboard },
        { name: "الخزينة", href: "/dashboard/accounts/treasury", icon: Landmark },
        { name: "المصروفات", href: "/dashboard/accounts/expenses", icon: Receipt },
        { name: "الإيرادات", href: "/dashboard/accounts/income", icon: Wallet },
        { name: "المشتريات", href: "/dashboard/accounts/purchases", icon: ShoppingBag },
    ];

    if (role !== 'ACCOUNTANT') {
        navItems.push({ name: "التقارير", href: "/dashboard/accounts/reports", icon: FileText });
    }

    return (
        <div className="bg-white border-b shadow-sm sticky top-0 z-20">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center gap-6 overflow-x-auto no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md whitespace-nowrap",
                                    isActive
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-muted-foreground hover:text-slate-900 hover:bg-slate-100"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
