import { getBanks, getUpcomingInstallments } from "@/lib/actions/banks";
import ClientBanksPage from "./client-page";

export default async function BanksPage() {
    const banks = await getBanks();
    const alerts = await getUpcomingInstallments();

    return <ClientBanksPage banks={banks} alerts={alerts} />;
}
