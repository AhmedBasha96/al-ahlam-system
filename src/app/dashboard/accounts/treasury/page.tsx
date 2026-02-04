import { getAgencies, getTreasuryTransactions } from "@/lib/actions/accounts";
import ClientTreasuryPage from "./client-page";

export default async function TreasuryPage() {
    const agencies = await getAgencies();
    // Default to show ALL on simple load, or client can default to one.
    // Let's pass data to client wrapper
    const initialTransactions = await getTreasuryTransactions();

    return <ClientTreasuryPage agencies={agencies} initialTransactions={initialTransactions} />;
}
