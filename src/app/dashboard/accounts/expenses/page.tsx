import { getAccountRecords, getAgencies } from "@/lib/actions/accounts";
import { getSuppliers } from "@/lib/actions/suppliers";
import ClientExpensesPage from "./client-page";

export default async function ExpensesPage() {
    const expenses = await getAccountRecords('EXPENSE');
    const agencies = await getAgencies();
    const suppliers = await getSuppliers();

    return <ClientExpensesPage initialExpenses={expenses} agencies={agencies} suppliers={suppliers} />;
}
