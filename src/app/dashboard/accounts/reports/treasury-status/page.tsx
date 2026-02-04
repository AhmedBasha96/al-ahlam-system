import { getTreasuryStatusReport } from "@/lib/actions/reports";
import ClientTreasuryStatusReport from "./client-page";

export default async function TreasuryStatusReportPage() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const reportData = await getTreasuryStatusReport(startDate, endDate);

    return (
        <ClientTreasuryStatusReport
            initialData={reportData}
            defaultStartDate={startDate.toISOString().split('T')[0]}
            defaultEndDate={endDate.toISOString().split('T')[0]}
        />
    );
}
