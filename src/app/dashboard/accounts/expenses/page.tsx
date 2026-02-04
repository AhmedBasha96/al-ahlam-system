import { getAccountRecords, getAgencies } from "@/lib/actions/accounts";
import ClientExpensesPage from "./client-page";

export default async function ExpensesPage() {
    const expenses = await getAccountRecords('EXPENSE');
    const agencies = await getAgencies();

    return <ClientExpensesPage initialExpenses={expenses} agencies={agencies} />;
}
