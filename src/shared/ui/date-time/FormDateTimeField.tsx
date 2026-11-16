import type { ComponentProps } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from '@shared/lib/form';
import { DateTimeField } from './DateTimeField';

type Props<T extends FieldValues, Output> = Omit<
  ComponentProps<typeof DateTimeField>,
  'value' | 'onChange' | 'error'
> & {
  // `Output` is what the schema produces; a field only needs the input side.
  control: Control<T, unknown, Output>;
  name: FieldPath<T>;
};

// A DateTimeField bound to one form field. The field holds a Date, or null
// while nothing is chosen.
export function FormDateTimeField<T extends FieldValues, Output = T>({
  control,
  name,
  disabled = false,
  ...rest
}: Props<T, Output>) {
  const { field, fieldState } = useController({ control, name });
  const value: unknown = field.value;

  return (
    <DateTimeField
      value={value instanceof Date ? value : null}
      onChange={value => {
        field.onChange(value);
        // A picker has no blur, so choosing counts as leaving the field.
        field.onBlur();
      }}
      error={fieldState.error?.message}
      disabled={disabled || field.disabled === true}
      {...rest}
    />
  );
}
