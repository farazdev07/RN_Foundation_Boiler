import ImagePicker, {
  type ImageOrVideo,
  type Options,
} from 'react-native-image-crop-picker';
import { err, ok, type Result } from '@shared/lib/result';

export type PickedMedia = {
  uri: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  filename?: string;
};

export type PickFailure = 'permission' | 'unavailable' | 'failed';

export type PickOptions = {
  source: 'camera' | 'library';
  mediaType?: 'photo' | 'video' | 'any';
  multiple?: boolean;
  maxFiles?: number;
  cropping?: boolean;
  // 0 to 1. Photos only.
  quality?: number;
};

const PERMISSION = new Set([
  'E_NO_CAMERA_PERMISSION',
  'E_NO_LIBRARY_PERMISSION',
]);
const UNAVAILABLE = new Set([
  'E_PICKER_CANNOT_RUN_CAMERA_ON_SIMULATOR',
  'E_CAMERA_IS_NOT_AVAILABLE',
  'E_CANNOT_LAUNCH_CAMERA',
  'E_FAILED_TO_OPEN_CAMERA',
  'E_ACTIVITY_DOES_NOT_EXIST',
]);

const toPicked = (item: ImageOrVideo): PickedMedia => ({
  uri: item.path,
  mime: item.mime,
  size: item.size,
  width: item.width,
  height: item.height,
  ...(item.filename && { filename: item.filename }),
});

export const classifyPickError = (
  error: unknown,
): PickFailure | 'cancelled' => {
  const code = (error as { code?: string } | null)?.code ?? '';
  if (code === 'E_PICKER_CANCELLED') {
    return 'cancelled';
  }
  if (PERMISSION.has(code)) {
    return 'permission';
  }
  return UNAVAILABLE.has(code) ? 'unavailable' : 'failed';
};

// Cancelling is not an error: it resolves to an empty list.
export const pickMedia = async ({
  source,
  mediaType = 'photo',
  multiple = false,
  maxFiles,
  cropping = false,
  quality = 0.8,
}: PickOptions): Promise<Result<PickedMedia[], PickFailure>> => {
  const options = {
    mediaType,
    multiple: source === 'library' && multiple,
    cropping: mediaType === 'photo' && cropping,
    compressImageQuality: quality,
    forceJpg: true,
    ...(maxFiles !== undefined && { maxFiles }),
  } as Options;

  try {
    const picked =
      source === 'camera'
        ? await ImagePicker.openCamera(options)
        : await ImagePicker.openPicker(options);
    return ok((Array.isArray(picked) ? picked : [picked]).map(toPicked));
  } catch (error) {
    const failure = classifyPickError(error);
    return failure === 'cancelled' ? ok([]) : err(failure);
  }
};

// Deletes the temporary copies the picker made, once they are uploaded.
export const cleanPickedMedia = (): Promise<void> =>
  ImagePicker.clean().catch(() => undefined);
