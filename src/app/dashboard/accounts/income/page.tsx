import { getAccountRecords, getAgencies } from "@/lib/actions/accounts";
import { getCurrentUser } from "@/lib/actions";
import { getSuppliers } from "@/lib/actions/suppliers";
import ClientIncomePage from "./client-page";

export default async function IncomePage() {
    const incomeRecords = await getAccountRecords('INCOME');
    const agencies = await getAgencies();
    const suppliers = await getSuppliers();
    const currentUser = await getCurrentUser();

    return <ClientIncomePage initialIncome={incomeRecords} agencies={agencies} suppliers={suppliers} userRole={currentUser?.role} />;
}
