/**
 * Tanzania Shilling (TZS) formatting and fee calculation.
 * All monetary values on the platform are stored as integers (no floats)
 * to prevent rounding errors in financial calculations.
 */

/** Format integer TZS amount for display: 25000 → "TZS 25,000" */
export function formatTZS(amountTzs: number): string {
  const formatted = Math.abs(amountTzs)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return amountTzs < 0 ? `TZS -${formatted}` : `TZS ${formatted}`;
}

/** Parse a TZS display string back to integer: "TZS 25,000" → 25000 */
export function parseTZS(formatted: string): number {
  const cleaned = formatted.replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid TZS amount: ${formatted}`);
  }
  return parsed;
}

/**
 * Calculate platform fees for a booking.
 * VAT is applied to the platform fee (not the gross amount) per Tanzania TRA rules.
 * Math.ceil prevents fractional shillings — platform always rounds up.
 */
export function calculateFees(
  grossAmountTzs: number,
  platformFeePercent: number,
  vatPercent: number,
): {
  grossAmountTzs: number;
  platformFeeTzs: number;
  vatTzs: number;
  netToFundiTzs: number;
} {
  if (grossAmountTzs < 0) {
    throw new Error('Amount cannot be negative');
  }
  if (!Number.isInteger(grossAmountTzs)) {
    throw new Error('Amount must be an integer (TZS)');
  }

  const platformFeeTzs = Math.ceil(grossAmountTzs * (platformFeePercent / 100));
  const vatTzs = Math.ceil(platformFeeTzs * (vatPercent / 100));
  const netToFundiTzs = grossAmountTzs - platformFeeTzs;

  return {
    grossAmountTzs,
    platformFeeTzs,
    vatTzs,
    netToFundiTzs,
  };
}
