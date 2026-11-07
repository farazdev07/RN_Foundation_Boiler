export type ErrorContext = Record<string, unknown>;

type Reporter = (error: unknown, context?: ErrorContext) => void;

let reporter: Reporter | null = null;

// Keeps the crash-reporting vendor out of the code that reports errors. With no
// reporter set, for example without a DSN, reporting does nothing.
export const setErrorReporter = (next: Reporter | null): void => {
  reporter = next;
};

export const reportError = (error: unknown, context?: ErrorContext): void => {
  reporter?.(error, context);
};
