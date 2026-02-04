import { getPurchasesReport } from "@/lib/actions/reports";
import ClientPurchasesReport from "./client-page";

export default async function PurchasesReportPage() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const reportData = await getPurchasesReport(startDate, endDate);

    return (
        <ClientPurchasesReport
            initialData={reportData}
            defaultStartDate={startDate.toISOString().split('T')[0]}
            defaultEndDate={endDate.toISOString().split('T')[0]}
        />
    );
}
