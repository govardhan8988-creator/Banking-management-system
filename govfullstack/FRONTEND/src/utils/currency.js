/**
 * Indian Rupee (INR) currency and numbering formatter
 * Example: 125000 -> "₹1,25,000.00"
 */
export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a numeric or decimal value to INR representation
 * @param {number|string} amount
 * @returns {string} Formatted INR string (e.g., "₹5,000.00")
 */
export function formatINR(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '₹0.00';
  return inrFormatter.format(num);
}

/**
 * Format date to standard Indian locale format
 * Example: "06 Oct 2026, 11:20 am"
 */
export function formatIndianDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
