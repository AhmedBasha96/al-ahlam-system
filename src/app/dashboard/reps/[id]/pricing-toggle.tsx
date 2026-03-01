'use client';

import { toggleRepPricing } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PricingToggle({ repId, currentType }: { repId: string, currentType?: 'WHOLESALE' | 'RETAIL' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            await toggleRepPricing(repId);
            router.refresh();
        } catch (error) {
            alert('Failed to update pricing type');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isWholesale = currentType === 'WHOLESALE';

    return (
        <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${isWholesale
                ? 'bg-purple-50 text-purple-400 border-purple-100'
                : 'bg-blue-50 text-blue-400 border-blue-100'
                }`}
            title="نوع التسعير ثابت ولا يمكن تغييره"
        >
            {isWholesale ? 'سعر جملة' : 'سعر قطاعي'}
            <span className="text-[10px] opacity-60">
                (مغلق 🔒)
            </span>
        </div>
    );
}
