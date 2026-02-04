import { getLoansReport } from "@/lib/actions/reports";
import ClientLoansReport from "./client-page";

export default async function LoansReportPage() {
    const reportData = await getLoansReport();

    return <ClientLoansReport initialData={reportData} />;
}
