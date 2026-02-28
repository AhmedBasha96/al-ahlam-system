import { getCurrentUser } from "@/lib/actions";
import Sidebar from "@/components/layout/sidebar";

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

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 overflow-x-hidden">
            {/* Responsive Sidebar */}
            <Sidebar role={role} />

            {/* Main Content Area */}
            <main className="flex-1 w-full p-4 md:p-8 overflow-x-hidden min-h-screen">
                {children}
            </main>
        </div>
    );
}
