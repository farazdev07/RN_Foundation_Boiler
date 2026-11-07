import { Linking, Platform } from 'react-native';
import { err, ok, type Result } from '@shared/lib/result';

export type EmailParams = {
  to: string;
  subject?: string;
  body?: string;
  cc?: string;
  bcc?: string;
};

// Returns a Result instead of showing an alert, so the caller decides how to
// tell the user.
const open = async (url: string): Promise<Result<void>> => {
  try {
    await Linking.openURL(url);
    return ok(undefined);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
};

const digitsOnly = (phoneNumber: string): string | null => {
  const digits = phoneNumber.replace(/[^\d+]/g, '');
  return /\d/.test(digits) ? digits : null;
};

export const openUrl = (url: string): Promise<Result<void>> => open(url);

export const openDialer = (phoneNumber: string): Promise<Result<void>> => {
  const number = digitsOnly(phoneNumber);
  return number
    ? open(`tel:${number}`)
    : Promise.resolve(err(new Error('Invalid phone number')));
};

export const openSms = (
  phoneNumber: string,
  body?: string,
): Promise<Result<void>> => {
  const number = digitsOnly(phoneNumber);
  if (!number) {
    return Promise.resolve(err(new Error('Invalid phone number')));
  }
  // iOS separates the body with "&", Android with "?".
  const separator = Platform.OS === 'ios' ? '&' : '?';
  return open(
    body
      ? `sms:${number}${separator}body=${encodeURIComponent(body)}`
      : `sms:${number}`,
  );
};

export const openEmail = ({
  to,
  ...fields
}: EmailParams): Promise<Result<void>> => {
  const query = Object.entries(fields)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&');
  return open(`mailto:${to}${query ? `?${query}` : ''}`);
};

export const openMap = (
  latitude: number,
  longitude: number,
): Promise<Result<void>> =>
  open(
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?ll=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
  );
