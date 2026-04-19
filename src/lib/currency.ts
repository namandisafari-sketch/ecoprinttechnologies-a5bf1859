export function formatCurrency(amount: number | string | null | undefined, currency: string = "UGX"): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function parseCurrency(input: string): number {
  return parseFloat(input.replace(/[^\d.-]/g, "")) || 0;
}
