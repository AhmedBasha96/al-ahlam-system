import { getProfitLossReport } from "@/lib/actions/reports";
import { getAgencies } from "@/lib/actions/accounts";
import ClientProfitLossReport from "./client-page";

export default async function ProfitLossReportPage() {
    // Get default report (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const reportData = await getProfitLossReport(startDate, endDate);
    const agencies = await getAgencies();

    return (
        <ClientProfitLossReport
            initialData={reportData}
            agencies={agencies}
            defaultStartDate={startDate.toISOString().split('T')[0]}
            defaultEndDate={endDate.toISOString().split('T')[0]}
        />
    );
}
