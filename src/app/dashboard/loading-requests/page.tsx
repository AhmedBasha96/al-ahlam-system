import { getLoadingRequests, getCurrentUser } from "@/lib/actions";
import Link from "next/link";
import LoadingRequestsList from "./loading-requests-list";

export default async function LoadingRequestsPage() {
    const requests = await getLoadingRequests();
    const user = await getCurrentUser();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">طلبات التحميل</h1>
                    <p className="text-gray-500 text-sm">متابعة وإدارة طلبات تحميل بضاعة المناديب</p>
                </div>
                {user.role === 'SALES_REPRESENTATIVE' && (
                    <Link 
                        href="/dashboard/loading-requests/new" 
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm font-bold"
                    >
                        <span>➕</span> طلب تحميل جديد
                    </Link>
                )}
            </div>

            <LoadingRequestsList initialRequests={requests as any} userRole={user.role} />
        </div>
    );
}
