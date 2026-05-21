import { getAgencies } from "@/lib/actions/accounts";
import { getOperationProfitReport } from "@/lib/actions/reports";
import ClientOperationProfitReport from "./client-page";

export default async function OperationProfitReportPage() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const initialData = await getOperationProfitReport(startOfMonth, endOfMonth);
    const agencies = await getAgencies();

    return (
        <ClientOperationProfitReport
            initialData={initialData}
            agencies={agencies}
            defaultStartDate={startOfMonth.toISOString().split('T')[0]}
            defaultEndDate={endOfMonth.toISOString().split('T')[0]}
        />
    );
}
