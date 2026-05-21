
import { getRepsWithCustody } from "@/lib/actions";
import RepsCustodyClient from "./client-page";

export const metadata = {
    title: "إدارة عهد وتحصيلات المناديب | الاحلام للتوكيلات",
    description: "متابعة واستلام المبالغ النقدية من المناديب",
};

export default async function RepsCustodyPage() {
    const reps = await getRepsWithCustody();

    return (
        <div className="container mx-auto py-6">
            <RepsCustodyClient initialReps={reps} />
        </div>
    );
}
