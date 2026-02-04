import { getIncomeExpensesReport } from "@/lib/actions/reports";
import { getAgencies } from "@/lib/actions/accounts";
import ClientIncomeExpensesReport from "./client-page";

export default async function IncomeExpensesReportPage() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const reportData = await getIncomeExpensesReport(startDate, endDate);
    const agencies = await getAgencies();

    return (
        <ClientIncomeExpensesReport
            initialData={reportData}
            agencies={agencies}
            defaultStartDate={startDate.toISOString().split('T')[0]}
            defaultEndDate={endDate.toISOString().split('T')[0]}
        />
    );
}
