import { getAccountRecords, getAgencies } from "@/lib/actions/accounts";
import ClientIncomePage from "./client-page";

export default async function IncomePage() {
    const incomeRecords = await getAccountRecords('INCOME');
    const agencies = await getAgencies();

    return <ClientIncomePage initialIncome={incomeRecords} agencies={agencies} />;
}
