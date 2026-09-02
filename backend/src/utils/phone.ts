/**
 * Normalizes a phone number to a consistent format.
 * Focuses on normalizing Indian phone numbers correctly.
 * 
 * Rules:
 * - Removes spaces, dashes, and parentheses.
 * - 10 digits -> +91XXXXXXXXXX
 * - 11 digits starting with 0 -> +91XXXXXXXXXX
 * - 12 digits starting with 91 -> +91XXXXXXXXXX
 * - Already +91XXXXXXXXXX -> keep as is.
 * - Other international formats -> keep as is (adds + if not present but seems valid).
 * 
 * @param phone Raw phone number string
 * @returns Normalized phone number
 */
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';

  // Strip all non-numeric characters except leading plus
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If there's a plus not at the start, remove it (malformed)
  if (cleaned.indexOf('+') > 0) {
    cleaned = '+' + cleaned.replace(/\+/g, '');
  }

  const isInternational = cleaned.startsWith('+');
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Indian number length rules
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `+91${digitsOnly.substring(1)}`;
  }
  
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `+${digitsOnly}`;
  }

  // If it's another international number but user didn't type '+', prefix it
  if (!isInternational && digitsOnly.length > 10) {
    return `+${digitsOnly}`;
  }

  // Fallback for valid international formats or too short numbers
  return cleaned;
};
