import { getBankMovementsReport } from "@/lib/actions/reports";
import ClientBankMovementsReport from "./client-page";

export default async function BankMovementsReportPage() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const reportData = await getBankMovementsReport(startDate, endDate);

    return (
        <ClientBankMovementsReport
            initialData={reportData}
            defaultStartDate={startDate.toISOString().split('T')[0]}
            defaultEndDate={endDate.toISOString().split('T')[0]}
        />
    );
}
