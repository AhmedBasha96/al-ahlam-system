
import ClientTargetsPage from "./client-page";

export const metadata = {
    title: "أهداف المناديب | الاحلام للتوكيلات",
    description: "إدارة ومتابعة أهداف المناديب الشهرية",
};

export default function TargetsPage() {
    return (
        <div className="container mx-auto py-6">
            <ClientTargetsPage />
        </div>
    );
}
