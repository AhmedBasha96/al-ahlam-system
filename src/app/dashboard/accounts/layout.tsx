import { getCurrentUser } from "@/lib/actions";
import AccountsNav from "./accounts-nav";

export default async function AccountsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    return (
        <div className="space-y-8 bg-slate-50/50 min-h-screen">
            <AccountsNav role={user.role} />
            <div className="container mx-auto px-4 pb-8">{children}</div>
        </div>
    );
}
