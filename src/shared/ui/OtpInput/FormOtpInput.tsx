import type { ComponentProps } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from '@shared/lib/form';
import { OtpInput } from './OtpInput';

type Props<T extends FieldValues, Output> = Omit<
  ComponentProps<typeof OtpInput>,
  'value' | 'onChangeText' | 'error'
> & {
  // `Output` is what the schema produces; a field only needs the input side.
  control: Control<T, unknown, Output>;
  name: FieldPath<T>;
};

// An OtpInput bound to one form field. Pass `onComplete` to submit as soon as
// the last digit is typed.
export function FormOtpInput<T extends FieldValues, Output = T>({
  control,
  name,
  disabled = false,
  ...rest
}: Props<T, Output>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <OtpInput
      value={typeof field.value === 'string' ? field.value : ''}
      onChangeText={field.onChange}
      error={fieldState.error?.message}
      disabled={disabled || field.disabled === true}
      {...rest}
    />
  );
}
