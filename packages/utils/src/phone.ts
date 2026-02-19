/**
 * Tanzania phone number utilities.
 * Tanzania numbers: +255 followed by 9 digits. Common prefixes:
 *   Vodacom (M-Pesa):   74x, 75x, 76x
 *   Airtel:             78x, 68x, 69x
 *   Tigo:               71x, 65x, 67x
 *   Halotel:            62x, 61x
 */

const TANZANIA_COUNTRY_CODE = '+255';

/** Normalize any Tanzania phone format to E.164: "0712345678" → "+255712345678" */
export function toE164(phone: string): string {
  const digits = phone.replace(/[\s\-\(\)]/g, '');

  if (digits.startsWith('+255') && digits.length === 13) {
    return digits;
  }
  if (digits.startsWith('255') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `${TANZANIA_COUNTRY_CODE}${digits.slice(1)}`;
  }
  if (digits.length === 9 && /^[67]/.test(digits)) {
    return `${TANZANIA_COUNTRY_CODE}${digits}`;
  }

  throw new Error(`Invalid Tanzania phone number: ${phone}`);
}

/** Format E.164 number for local display: "+255712345678" → "0712 345 678" */
export function formatPhoneDisplay(e164: string): string {
  const local = e164.replace('+255', '0');
  if (local.length !== 10) return local;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** Validate that a string is a valid Tanzania mobile number */
export function isValidTanzaniaPhone(phone: string): boolean {
  try {
    const e164 = toE164(phone);
    return /^\+255[67]\d{8}$/.test(e164);
  } catch {
    return false;
  }
}

/** Detect mobile money network from phone number prefix */
export function detectNetwork(
  phone: string,
): 'vodacom' | 'airtel' | 'tigo' | 'halotel' | 'unknown' {
  let normalized: string;
  try {
    normalized = toE164(phone);
  } catch {
    return 'unknown';
  }

  const subscriber = normalized.slice(4); // Remove +255
  const prefix = subscriber.slice(0, 2);

  // Vodacom: 74, 75, 76
  if (['74', '75', '76'].includes(prefix)) return 'vodacom';

  // Airtel: 78, 68, 69
  if (['78', '68', '69'].includes(prefix)) return 'airtel';

  // Tigo: 71, 65, 67
  if (['71', '65', '67'].includes(prefix)) return 'tigo';

  // Halotel: 62, 61
  if (['62', '61'].includes(prefix)) return 'halotel';

  return 'unknown';
}

/** Mask phone number for privacy in logs and displays: "+255712345678" → "+255***345678" */
export function maskPhone(e164: string): string {
  if (e164.length < 10) return '***';
  return `${e164.slice(0, 4)}***${e164.slice(7)}`;
}
