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
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${isWholesale
                    ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                    : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                }`}
            title="اضغط للتغيير"
        >
            {loading ? '...' : (isWholesale ? 'سعر جملة' : 'سعر قطاعي')}
            <span className="text-[10px] opacity-60">
                (تغيير ↻)
            </span>
        </button>
    );
}
