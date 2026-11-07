import { z } from 'zod';

// Only the fields the app reads. Unknown fields from the server are dropped.
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  image: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
