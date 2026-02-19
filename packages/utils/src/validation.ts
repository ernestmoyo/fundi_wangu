/** Validate UUID v4 format */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Validate E.164 Tanzania phone number */
export function isValidE164(value: string): boolean {
  return /^\+255[67]\d{8}$/.test(value);
}

/** Validate that an amount is a positive integer (TZS — no floats allowed) */
export function isValidTZSAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount > 0;
}

/** Sanitize user input: trim, collapse whitespace, strip control characters */
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ');
}
