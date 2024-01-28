// Helper function to format number to Finnish locale with 2 decimal places
export function formatNumberToFI(num: number | undefined, minDigits: number = 2, maxDigits: number = 2): string {
    return num?.toLocaleString('fi-FI', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits }) ?? '';
}

// Helper function to format number to Finnish locale with 2 decimal places and convert to Euros
export function formatNumberToEuros(num: number | undefined, minDigits: number = 2, maxDigits: number = 2): string {
    return ((num ?? 0) / 100).toLocaleString('fi-FI', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits });
}
