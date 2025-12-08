/**
 * Currency formatting utilities
 */

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: "USD")
 * @param locale - Locale string (default: "en-US")
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with thousand separators
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Percentage string
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

