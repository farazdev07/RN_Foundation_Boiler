import { categorizeFile, getExtension, getMimeType } from '@shared/lib/file';

describe('file', () => {
  it.each([
    ['photo.JPG', 'jpg'],
    ['https://cdn.x/clip.mp4?token=1#t=2', 'mp4'],
    ['archive.tar.gz', 'gz'],
    ['README', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('extension of %p is %p', (name, expected) => {
    expect(getExtension(name)).toBe(expected);
  });

  it.each([
    ['a.png', 'image'],
    ['a.mov', 'video'],
    ['a.pdf', 'document'],
    ['a.zip', 'unknown'],
    [null, 'unknown'],
  ])('categorises %p as %p', (name, expected) => {
    expect(categorizeFile(name)).toBe(expected);
  });

  it.each([
    [
      'a.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ['a.heic', 'image/heic'],
    ['a.unknownext', 'application/octet-stream'],
    [undefined, 'application/octet-stream'],
  ])('mime of %p is %p', (name, expected) => {
    expect(getMimeType(name)).toBe(expected);
  });
});
