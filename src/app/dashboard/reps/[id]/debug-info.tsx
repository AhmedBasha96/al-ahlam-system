'use client';

type Props = {
    rep: any;
    products: any[];
}

export default function DebugInfo({ rep, products }: Props) {
    if (process.env.NODE_ENV === 'production') return null;

    const sampleProduct = products[0];

    return (
        <div className="fixed bottom-4 left-4 bg-black/90 text-green-400 p-4 rounded-lg text-xs font-mono z-50 max-w-sm ltr" dir="ltr">
            <h3 className="font-bold text-white mb-2">🔍 DEBUG INFO</h3>
            <div className="space-y-1">
                <p>Rep Name: <span className="text-white">{rep.name}</span></p>
                <p>Rep ID: <span className="text-white">{rep.id}</span></p>
                <p>Pricing Type (Raw): <span className="text-yellow-400">"{rep.pricingType}"</span></p>
                <div className="border-t border-gray-700 my-2 pt-2">
                    <p>Sample Product: {sampleProduct?.name}</p>
                    <p>Wholesale Price: <span className="text-yellow-400">{sampleProduct?.wholesalePrice}</span></p>
                    <p>Retail Price: <span className="text-yellow-400">{sampleProduct?.retailPrice}</span></p>
                </div>
                <div className="border-t border-gray-700 my-2 pt-2">
                    <p>Logic Test:</p>
                    <p>Is WHOLESALE? {rep.pricingType === 'WHOLESALE' ? 'YES' : 'NO'}</p>
                    <p>Applied Price: {rep.pricingType === 'WHOLESALE' ? sampleProduct?.wholesalePrice : sampleProduct?.retailPrice}</p>
                </div>
            </div>
        </div>
    );
}
