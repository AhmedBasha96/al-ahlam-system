import { getAccountRecords, getAgencies } from "@/lib/actions/accounts";
import { getSuppliers } from "@/lib/actions/suppliers";
import ClientIncomePage from "./client-page";

export default async function IncomePage() {
    const incomeRecords = await getAccountRecords('INCOME');
    const agencies = await getAgencies();
    const suppliers = await getSuppliers();

    return <ClientIncomePage initialIncome={incomeRecords} agencies={agencies} suppliers={suppliers} />;
}
