import ImagePicker from 'react-native-image-crop-picker';
import { classifyPickError, pickMedia } from './mediaPicker';

const picker = jest.mocked(ImagePicker);
const photo = {
  path: 'file:///tmp/a.jpg',
  mime: 'image/jpeg',
  size: 1200,
  width: 10,
  height: 20,
  filename: 'a.jpg',
};
const coded = (code: string) => Object.assign(new Error(code), { code });

describe('classifyPickError', () => {
  it.each([
    ['E_PICKER_CANCELLED', 'cancelled'],
    ['E_NO_CAMERA_PERMISSION', 'permission'],
    ['E_NO_LIBRARY_PERMISSION', 'permission'],
    ['E_PICKER_CANNOT_RUN_CAMERA_ON_SIMULATOR', 'unavailable'],
    ['E_CAMERA_IS_NOT_AVAILABLE', 'unavailable'],
    ['E_NO_IMAGE_DATA_FOUND', 'failed'],
  ])('maps %s to %s', (code, expected) => {
    expect(classifyPickError(coded(code))).toBe(expected);
  });

  it('treats an error without a code as a failure', () => {
    expect(classifyPickError(new Error('boom'))).toBe('failed');
    expect(classifyPickError(null)).toBe('failed');
  });
});

describe('pickMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns what the user picked as a typed list', async () => {
    picker.openPicker.mockResolvedValueOnce([photo] as never);

    const result = await pickMedia({ source: 'library', multiple: true });

    expect(result).toEqual({
      ok: true,
      value: [
        {
          uri: 'file:///tmp/a.jpg',
          mime: 'image/jpeg',
          size: 1200,
          width: 10,
          height: 20,
          filename: 'a.jpg',
        },
      ],
    });
    expect(picker.openPicker).toHaveBeenCalledWith(
      expect.objectContaining({ multiple: true, mediaType: 'photo' }),
    );
  });

  it('treats cancelling as picking nothing, not as an error', async () => {
    picker.openCamera.mockRejectedValueOnce(coded('E_PICKER_CANCELLED'));

    expect(await pickMedia({ source: 'camera' })).toEqual({
      ok: true,
      value: [],
    });
  });

  it('reports a missing permission', async () => {
    picker.openCamera.mockRejectedValueOnce(coded('E_NO_CAMERA_PERMISSION'));

    expect(await pickMedia({ source: 'camera' })).toEqual({
      ok: false,
      error: 'permission',
    });
  });

  it('never asks the camera for several files or crops a video', async () => {
    picker.openCamera.mockResolvedValueOnce(photo as never);

    await pickMedia({
      source: 'camera',
      multiple: true,
      mediaType: 'video',
      cropping: true,
    });

    expect(picker.openCamera).toHaveBeenCalledWith(
      expect.objectContaining({ multiple: false, cropping: false }),
    );
  });
});
