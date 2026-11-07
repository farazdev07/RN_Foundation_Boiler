import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { err, ok, type Result } from '@shared/lib/result';
import type { PickedMedia } from '@shared/lib/media-picker';
import type { Presigned, PresignRequest } from '../api/presignApi';

export type UploadResult =
  | { file: PickedMedia; ok: true; fileUrl: string }
  | { file: PickedMedia; ok: false; error: 'presign' | 'transfer' };

type Progress = (fraction: number) => void;

const fileName = (file: PickedMedia): string =>
  file.filename ?? file.uri.split('/').pop() ?? 'upload';

// Streams the file from disk, so a large video never passes through JS memory.
export const putFile = async (
  presigned: Presigned,
  file: PickedMedia,
  onProgress?: Progress,
): Promise<boolean> => {
  const path = file.uri.replace(/^file:\/\//, '');
  const request = ReactNativeBlobUtil.fetch(
    'PUT',
    presigned.uploadUrl,
    { 'Content-Type': file.mime, ...presigned.headers },
    ReactNativeBlobUtil.wrap(path),
  );
  if (onProgress) {
    request.uploadProgress({ interval: 250 }, (sent, total) =>
      onProgress(total > 0 ? sent / total : 0),
    );
  }
  try {
    const status = (await request).respInfo.status;
    return status >= 200 && status < 300;
  } catch {
    return false;
  }
};

type UploadDeps = {
  presign: (request: PresignRequest) => Promise<Presigned | null>;
  put?: typeof putFile;
  onProgress?: (index: number, fraction: number) => void;
};

// One file at a time, so a slow connection is not shared across many PUTs.
// A failure does not stop the rest; the caller gets every file's outcome.
export const uploadFiles = async (
  files: readonly PickedMedia[],
  { presign, put = putFile, onProgress }: UploadDeps,
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  for (const [index, file] of files.entries()) {
    const presigned = await presign({
      filename: fileName(file),
      mime: file.mime,
      size: file.size,
    }).catch(() => null);
    if (!presigned) {
      results.push({ file, ok: false, error: 'presign' });
      continue;
    }
    const sent = await put(presigned, file, fraction =>
      onProgress?.(index, fraction),
    );
    results.push(
      sent
        ? { file, ok: true, fileUrl: presigned.fileUrl }
        : { file, ok: false, error: 'transfer' },
    );
  }
  return results;
};

// Keeps a server-supplied name from escaping the target folder. Control
// characters are stripped on purpose, so the lint rule against them is off here.
export const safeFileName = (name: string): string =>
  // eslint-disable-next-line no-control-regex
  name.replace(/[/\\?%*:|"<>\u0000-\u001f]/g, '_').replace(/^\.+/, '') ||
  'download';

type DownloadOptions = {
  url: string;
  filename: string;
  mime: string;
  headers?: Record<string, string>;
  onProgress?: Progress;
};

// Android: into the shared Downloads collection (MediaStore), visible in the
// Files app. iOS: into the app's Documents folder; open it with openDownload.
export const downloadFile = async ({
  url,
  filename,
  mime,
  headers,
  onProgress,
}: DownloadOptions): Promise<Result<{ path: string }, 'failed'>> => {
  const name = safeFileName(filename);
  const { dirs } = ReactNativeBlobUtil.fs;
  const target = `${Platform.OS === 'ios' ? dirs.DocumentDir : dirs.CacheDir}/${name}`;

  try {
    const request = ReactNativeBlobUtil.config({
      fileCache: true,
      path: target,
      overwrite: true,
    }).fetch('GET', url, headers);
    if (onProgress) {
      request.progress({ interval: 250 }, (received, total) =>
        onProgress(total > 0 ? received / total : 0),
      );
    }
    const response = await request;
    const status = response.respInfo.status;
    if (status < 200 || status >= 300) {
      await ReactNativeBlobUtil.fs.unlink(target).catch(() => undefined);
      return err('failed');
    }
    if (Platform.OS === 'android') {
      const uri = await ReactNativeBlobUtil.media.copyToMediaStore(
        { name, parentFolder: '', mimeType: mime },
        'Download',
        target,
      );
      await ReactNativeBlobUtil.fs.unlink(target).catch(() => undefined);
      return ok({ path: uri });
    }
    return ok({ path: target });
  } catch {
    return err('failed');
  }
};

// iOS: the system "Open in..." menu. Android: an app chooser for the file.
export const openDownload = (path: string, mime: string): Promise<void> =>
  Platform.OS === 'ios'
    ? ReactNativeBlobUtil.open.optionsMenu(path)
    : ReactNativeBlobUtil.open.chooser(path, { mime });
