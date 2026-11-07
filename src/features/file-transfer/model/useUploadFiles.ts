import { useCallback, useState } from 'react';
import { cleanPickedMedia, type PickedMedia } from '@shared/lib/media-picker';
import { usePresignUploadMutation } from '../api/presignApi';
import { uploadFiles, type UploadResult } from './transfer';

export const useUploadFiles = () => {
  const [presign] = usePresignUploadMutation();
  const [progress, setProgress] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (files: readonly PickedMedia[]): Promise<UploadResult[]> => {
      setUploading(true);
      setProgress(files.map(() => 0));
      try {
        return await uploadFiles(files, {
          presign: async request => {
            const result = await presign(request);
            return 'data' in result && result.data ? result.data : null;
          },
          onProgress: (index, fraction) =>
            setProgress(current =>
              current.map((value, i) => (i === index ? fraction : value)),
            ),
        });
      } finally {
        setUploading(false);
        await cleanPickedMedia();
      }
    },
    [presign],
  );

  return { upload, progress, uploading };
};
