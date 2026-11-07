import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  downloadFile,
  openDownload,
  putFile,
  safeFileName,
  uploadFiles,
} from './transfer';

const blob = jest.mocked(ReactNativeBlobUtil);
const request = (
  ReactNativeBlobUtil as unknown as {
    __request: (status?: number) => Promise<unknown>;
  }
).__request;

const file = (name: string) => ({
  uri: `file:///tmp/${name}`,
  mime: 'image/jpeg',
  size: 10,
  filename: name,
});
const presigned = {
  uploadUrl: 'https://bucket.test/put',
  fileUrl: 'https://cdn.test/a.jpg',
};

describe('uploadFiles', () => {
  it('uploads each file and reports every outcome, even after a failure', async () => {
    const presign = jest
      .fn()
      .mockResolvedValueOnce(presigned)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...presigned, fileUrl: 'https://cdn.test/c' });
    const put = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const files = [file('a.jpg'), file('b.jpg'), file('c.jpg')];

    const results = await uploadFiles(files, { presign, put });

    expect(results).toEqual([
      { file: files[0], ok: true, fileUrl: 'https://cdn.test/a.jpg' },
      { file: files[1], ok: false, error: 'presign' },
      { file: files[2], ok: false, error: 'transfer' },
    ]);
    expect(presign).toHaveBeenCalledWith({
      filename: 'a.jpg',
      mime: 'image/jpeg',
      size: 10,
    });
  });

  it('treats a presign that throws as a presign failure', async () => {
    const presign = jest.fn().mockRejectedValueOnce(new Error('offline'));

    const [result] = await uploadFiles([file('a.jpg')], {
      presign,
      put: jest.fn(),
    });

    expect(result).toMatchObject({ ok: false, error: 'presign' });
  });

  it('reports progress per file', async () => {
    const onProgress = jest.fn();
    const put = jest.fn(async (_p, _f, progress?: (n: number) => void) => {
      progress?.(0.5);
      return true;
    });

    await uploadFiles([file('a.jpg')], {
      presign: async () => presigned,
      put,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledWith(0, 0.5);
  });
});

describe('putFile', () => {
  it('streams the file from disk with its content type', async () => {
    expect(
      await putFile(
        { ...presigned, headers: { 'x-amz-acl': 'private' } },
        file('a.jpg'),
      ),
    ).toBe(true);

    expect(blob.fetch).toHaveBeenLastCalledWith(
      'PUT',
      'https://bucket.test/put',
      { 'Content-Type': 'image/jpeg', 'x-amz-acl': 'private' },
      'ReactNativeBlobUtil-file:///tmp/a.jpg',
    );
  });

  it('fails on a non-2xx answer', async () => {
    blob.fetch.mockReturnValueOnce(request(403) as never);

    expect(await putFile(presigned, file('a.jpg'))).toBe(false);
  });
});

describe('safeFileName', () => {
  it.each([
    ['report.pdf', 'report.pdf'],
    ['../../etc/passwd', '_.._etc_passwd'],
    ['a:b*c?.png', 'a_b_c_.png'],
    ['', 'download'],
  ])('turns %j into %j', (input, expected) => {
    expect(safeFileName(input)).toBe(expected);
  });
});

describe('downloadFile', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
    jest.clearAllMocks();
  });

  it('on iOS, saves into Documents', async () => {
    Platform.OS = 'ios';

    const result = await downloadFile({
      url: 'https://cdn.test/r.pdf',
      filename: 'r.pdf',
      mime: 'application/pdf',
    });

    expect(result).toEqual({ ok: true, value: { path: '/docs/r.pdf' } });
    expect(blob.config).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/docs/r.pdf' }),
    );
  });

  it('on Android, moves the file into the Downloads collection', async () => {
    Platform.OS = 'android';

    const result = await downloadFile({
      url: 'https://cdn.test/r.pdf',
      filename: 'r.pdf',
      mime: 'application/pdf',
    });

    expect(result).toEqual({
      ok: true,
      value: { path: 'content://downloads/1' },
    });
    expect(blob.media.copyToMediaStore).toHaveBeenCalledWith(
      { name: 'r.pdf', parentFolder: '', mimeType: 'application/pdf' },
      'Download',
      '/cache/r.pdf',
    );
    expect(blob.fs.unlink).toHaveBeenCalledWith('/cache/r.pdf');
  });

  it('fails and cleans up on a non-2xx answer', async () => {
    Platform.OS = 'ios';
    blob.fetch.mockReturnValueOnce(request(404) as never);

    const result = await downloadFile({
      url: 'https://cdn.test/missing',
      filename: 'missing.pdf',
      mime: 'application/pdf',
    });

    expect(result).toEqual({ ok: false, error: 'failed' });
    expect(blob.fs.unlink).toHaveBeenCalledWith('/docs/missing.pdf');
  });

  it('opens a download with the platform menu', async () => {
    Platform.OS = 'ios';
    await openDownload('/docs/r.pdf', 'application/pdf');
    expect(blob.open.optionsMenu).toHaveBeenCalledWith('/docs/r.pdf');

    Platform.OS = 'android';
    await openDownload('content://downloads/1', 'application/pdf');
    expect(blob.open.chooser).toHaveBeenCalledWith('content://downloads/1', {
      mime: 'application/pdf',
    });
  });
});
