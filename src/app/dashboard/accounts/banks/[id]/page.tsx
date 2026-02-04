import { getBankDetails } from "@/lib/actions/banks";
import ClientBankDetailsPage from "./client-page";
import { notFound } from "next/navigation";

import { getAgencies } from "@/lib/actions/accounts";

export default async function BankDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Parallel fetching for performance
    const [bank, agencies] = await Promise.all([
        getBankDetails(id),
        getAgencies()
    ]);

    if (!bank) {
        notFound();
    }

    return <ClientBankDetailsPage bank={bank} agencies={agencies} />;
}
