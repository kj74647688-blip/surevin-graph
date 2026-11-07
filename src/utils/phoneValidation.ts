import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  e164: string;
  error?: string;
}

/**
 * Validates a mobile number using libphonenumber-js.
 * Defaults to Indian phone numbers ('IN', +91).
 */
export function validatePhoneNumber(
  inputPhone: string,
  defaultCountry: CountryCode = 'IN'
): PhoneValidationResult {
  const cleanInput = inputPhone.trim();

  if (!cleanInput) {
    return {
      isValid: false,
      formatted: '',
      e164: '',
      error: 'Phone number is required.',
    };
  }

  // Reject letters or illegal characters
  if (/[a-zA-Z]/.test(cleanInput)) {
    return {
      isValid: false,
      formatted: cleanInput,
      e164: '',
      error: 'Phone number cannot contain alphabetic characters.',
    };
  }

  try {
    const phoneNumber = parsePhoneNumberFromString(cleanInput, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return {
        isValid: false,
        formatted: cleanInput,
        e164: '',
        error: 'Please enter a valid mobile number (e.g., +91 98765 43210 or 9876543210).',
      };
    }

    return {
      isValid: true,
      formatted: phoneNumber.formatNational(),
      e164: phoneNumber.format('E.164'),
    };
  } catch (err) {
    return {
      isValid: false,
      formatted: cleanInput,
      e164: '',
      error: 'Invalid phone number format.',
    };
  }
}
