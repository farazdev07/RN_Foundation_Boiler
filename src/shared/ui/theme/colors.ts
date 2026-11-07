export type ColorTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;
  primary: string;
  border: string;
  disabled: string;
  error: string;
  success: string;
  overlay: string;
};

export const lightColors: ColorTokens = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#ECEEF2',
  textPrimary: '#14181F',
  textSecondary: '#5B6472',
  textOnPrimary: '#FFFFFF',
  primary: '#1F6FEB',
  border: '#DDE1E7',
  disabled: '#B8BFCA',
  error: '#C62828',
  success: '#2E7D32',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const darkColors: ColorTokens = {
  background: '#0F1216',
  surface: '#181C22',
  surfaceMuted: '#232832',
  textPrimary: '#F2F4F7',
  textSecondary: '#A3ACBA',
  textOnPrimary: '#FFFFFF',
  primary: '#4C8DF5',
  border: '#2E3440',
  disabled: '#4A5261',
  error: '#EF5350',
  success: '#66BB6A',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
