import { getWarehouses } from "@/lib/actions";
import LoadingRequestForm from "./loading-request-form";
import Link from "next/link";

export default async function NewLoadingRequestPage() {
    const warehouses = await getWarehouses();
    const sortedWarehouses = warehouses.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">طلب تحميل بضاعة جديد</h1>
                    <p className="text-gray-500 text-sm">قم باختيار المخزن والأصناف المطلوبة لتحميلها لعهدتك</p>
                </div>
                <Link 
                    href="/dashboard/loading-requests" 
                    className="text-emerald-600 hover:text-emerald-800 flex items-center gap-2 border border-emerald-200 px-4 py-2 rounded-lg transition hover:bg-emerald-50"
                >
                    <span>&rarr;</span> العودة للطلبات
                </Link>
            </div>

            <LoadingRequestForm warehouses={sortedWarehouses} />
        </div>
    );
}
