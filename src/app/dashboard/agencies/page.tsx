import { createAgency, getAgencies } from "@/lib/actions";
import CreateAgencyForm from "./create-agency-form";
import AgenciesList from "./agencies-list";

export const dynamic = 'force-dynamic';

export default async function AgenciesPage() {
    let agencies: any[] = [];
    try {
        agencies = await getAgencies();
    } catch (e) { console.error("Agencies fetch error:", e); }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">التوكيلات التجارية</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Agency Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
                        <h3 className="text-lg font-bold mb-4 text-emerald-800">إضافة توكيل جديد</h3>
                        <CreateAgencyForm createAgencyAction={createAgency} />
                    </div>
                </div>

                {/* Agencies List */}
                <div className="lg:col-span-2">
                    <AgenciesList agencies={agencies} />
                </div>
            </div>
        </div>
    );
}
