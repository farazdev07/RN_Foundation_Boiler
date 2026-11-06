// Dev-only logging. Never pass tokens or personal data, even here.
export const devLog = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log(...args);
  }
};

export const devWarn = (...args: unknown[]): void => {
  if (__DEV__) {
    console.warn(...args);
  }
};

export const devError = (...args: unknown[]): void => {
  if (__DEV__) {
    console.error(...args);
  }
};
