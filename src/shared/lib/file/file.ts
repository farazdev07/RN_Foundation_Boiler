export type FileCategory = 'image' | 'video' | 'document' | 'unknown';

const MIME_TYPES: Record<string, { category: FileCategory; mime: string }> = {
  jpg: { category: 'image', mime: 'image/jpeg' },
  jpeg: { category: 'image', mime: 'image/jpeg' },
  png: { category: 'image', mime: 'image/png' },
  gif: { category: 'image', mime: 'image/gif' },
  webp: { category: 'image', mime: 'image/webp' },
  heic: { category: 'image', mime: 'image/heic' },
  heif: { category: 'image', mime: 'image/heif' },
  svg: { category: 'image', mime: 'image/svg+xml' },
  mp4: { category: 'video', mime: 'video/mp4' },
  mov: { category: 'video', mime: 'video/quicktime' },
  webm: { category: 'video', mime: 'video/webm' },
  '3gp': { category: 'video', mime: 'video/3gpp' },
  pdf: { category: 'document', mime: 'application/pdf' },
  doc: { category: 'document', mime: 'application/msword' },
  docx: {
    category: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  xls: { category: 'document', mime: 'application/vnd.ms-excel' },
  xlsx: {
    category: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  txt: { category: 'document', mime: 'text/plain' },
  csv: { category: 'document', mime: 'text/csv' },
};

// Handles query strings and fragments, since names often come from URLs.
export const getExtension = (
  name: string | null | undefined,
): string | null => {
  const path = (name ?? '').split(/[?#]/)[0] ?? '';
  const match = /\.([a-z0-9]+)$/i.exec(path);
  return match?.[1] ? match[1].toLowerCase() : null;
};

export const categorizeFile = (
  name: string | null | undefined,
): FileCategory => {
  const extension = getExtension(name);
  return (extension && MIME_TYPES[extension]?.category) || 'unknown';
};

export const getMimeType = (name: string | null | undefined): string => {
  const extension = getExtension(name);
  return (
    (extension && MIME_TYPES[extension]?.mime) || 'application/octet-stream'
  );
};
