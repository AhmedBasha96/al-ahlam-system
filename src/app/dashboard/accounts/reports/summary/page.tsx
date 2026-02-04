import { getFinancialSummary } from "@/lib/actions/reports";
import ClientFinancialSummary from "./client-page";

export default async function FinancialSummaryPage() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const reportData = await getFinancialSummary(startDate, endDate);

    return (
        <ClientFinancialSummary
            initialData={reportData}
            defaultStartDate={startDate.toISOString().split('T')[0]}
            defaultEndDate={endDate.toISOString().split('T')[0]}
        />
    );
}
