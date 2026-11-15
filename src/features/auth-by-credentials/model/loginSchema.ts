import { z } from 'zod';

// Takes the translated message rather than calling i18n, so the schema is a
// pure function and the form rebuilds it when the language changes.
export const loginSchema = (required: string) =>
  z.object({
    username: z.string().trim().min(1, required),
    password: z.string().min(1, required),
    remember: z.boolean(),
  });

export type LoginValues = z.output<ReturnType<typeof loginSchema>>;
