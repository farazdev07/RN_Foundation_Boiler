import { z } from 'zod';
import { defineKey } from '@shared/storage';

// Device scope, so it survives logout and prefills the form. It is a username,
// not a secret; the password is never stored anywhere.
export const rememberedUsername = defineKey({
  name: 'auth.rememberedUsername',
  schema: z.string().min(1),
  version: 1,
  kind: 'user',
  scope: 'device',
});
