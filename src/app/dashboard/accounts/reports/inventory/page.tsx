import { getInventoryReport } from "@/lib/actions/reports";
import ClientInventoryReport from "./client-page";

export default async function InventoryReportPage() {
    const reportData = await getInventoryReport();

    return <ClientInventoryReport initialData={reportData} />;
}
