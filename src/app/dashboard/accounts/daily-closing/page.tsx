
import { getOpenDailyClosing, getCurrentUser } from "@/lib/actions";
import { DailyClosingForm } from "./daily-closing-form";
import { getAgencies } from "@/lib/actions/accounts";

export default async function DailyClosingPage() {
    const user = await getCurrentUser();
    const agencies = await getAgencies();
    const currentAgencyId = user.agencyId || agencies[0]?.id;
    const openClosing = currentAgencyId ? await getOpenDailyClosing(currentAgencyId) : null;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 text-right">
            <h1 className="text-3xl font-black text-emerald-900 mb-8 border-b-4 border-emerald-500 pb-2 inline-block">تصفية اليومية</h1>

            <DailyClosingForm
                user={user}
                agencies={agencies}
                initialAgencyId={currentAgencyId}
                openClosing={openClosing}
            />
        </div>
    );
}
