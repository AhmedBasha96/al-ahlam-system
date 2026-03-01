export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
export function formatUnits(quantity: number, upc: number) {
    if (upc <= 1) return `${quantity} ع`;

    const cartons = Math.floor(quantity / upc);
    const units = quantity % upc;

    if (cartons === 0) return `${units} ع`;
    if (units === 0) return `${cartons} ك`;
    return `${cartons} ك + ${units} ع`;
}

export function parseUnits(cartons: number, units: number, upc: number) {
    return (cartons * upc) + units;
}
