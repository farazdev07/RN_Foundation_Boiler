import { countryNamesEn } from './countryNames.en';
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

export type { CountryCode };

export type Country = {
  code: CountryCode;
  callingCode: string;
  name: string;
  flag: string;
};

export type PhoneValue = {
  // What the user typed, kept as is so editing never jumps around.
  text: string;
  country: CountryCode;
  // Set when the number parses; E.164, the format to store and send.
  e164: string | null;
  // Length check against the country's metadata, not a full pattern check.
  valid: boolean;
};

// Regional indicator symbols: "PK" becomes the Pakistan flag emoji.
export const flagEmoji = (code: string): string =>
  String.fromCodePoint(
    ...[...code.toUpperCase()].map(
      letter => 0x1f1e6 + letter.charCodeAt(0) - 65,
    ),
  );

type DisplayNames = { of: (code: string) => string | undefined };

const fromTable = (code: string): string => countryNamesEn[code] ?? code;

// Intl.DisplayNames when the engine has it. Hermes does not, so the app falls
// back to a bundled English table (the app is English only), then the code.
export const countryNamer = (locale?: string): ((code: string) => string) => {
  const Ctor = (
    Intl as { DisplayNames?: new (l?: string[], o?: object) => DisplayNames }
  ).DisplayNames;
  if (!Ctor) {
    return fromTable;
  }
  try {
    const names = new Ctor(locale ? [locale] : undefined, { type: 'region' });
    return code => names.of(code) ?? fromTable(code);
  } catch {
    return fromTable;
  }
};

export const listCountries = (locale?: string): Country[] => {
  const name = countryNamer(locale);
  return getCountries()
    .map(code => ({
      code,
      callingCode: getCountryCallingCode(code),
      name: name(code),
      flag: flagEmoji(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
};

export const matchesCountry = (country: Country, query: string): boolean => {
  const needle = query.trim().toLowerCase().replace(/^\+/, '');
  return (
    needle === '' ||
    country.name.toLowerCase().includes(needle) ||
    country.code.toLowerCase() === needle ||
    country.callingCode.startsWith(needle)
  );
};

export const toPhoneValue = (
  text: string,
  country: CountryCode,
): PhoneValue => {
  const parsed = parsePhoneNumberFromString(text, country);
  return {
    text,
    country,
    e164: parsed?.number ?? null,
    valid: parsed?.isValid() ?? false,
  };
};

// Formats as the user types, for the country they picked.
export const formatAsYouType = (text: string, country: CountryCode): string =>
  new AsYouType(country).input(text);
