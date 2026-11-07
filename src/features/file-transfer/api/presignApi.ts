import { z } from 'zod';
import { baseApi } from '@shared/api';

// The backend hands out a short-lived URL to PUT the file to, and the URL the
// file will have afterwards. Adjust the path and shape to your API.
const presignSchema = z.object({
  uploadUrl: z.url(),
  fileUrl: z.url(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type Presigned = z.infer<typeof presignSchema>;

export type PresignRequest = { filename: string; mime: string; size: number };

const presignApi = baseApi.injectEndpoints({
  endpoints: build => ({
    presignUpload: build.mutation<Presigned, PresignRequest>({
      query: body => ({ url: 'uploads/presign', method: 'POST', body }),
      responseSchema: presignSchema,
    }),
  }),
});

export const { usePresignUploadMutation } = presignApi;
