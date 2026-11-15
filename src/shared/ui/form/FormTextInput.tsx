import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from '@shared/lib/form';
import { TextInput, type TextInputProps } from '../TextInput';

type Props<T extends FieldValues, Output> = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'error' | 'ref'
> & {
  // `Output` is what the schema produces; a field only needs the input side.
  control: Control<T, unknown, Output>;
  name: FieldPath<T>;
};

// A TextInput bound to one form field: value, change, blur, error text and the
// ref that `setFocus` and focus-on-error use.
export function FormTextInput<T extends FieldValues, Output = T>({
  control,
  name,
  onBlur,
  ...rest
}: Props<T, Output>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <TextInput
      ref={field.ref}
      value={typeof field.value === 'string' ? field.value : ''}
      onChangeText={field.onChange}
      onBlur={event => {
        field.onBlur();
        onBlur?.(event);
      }}
      error={fieldState.error?.message}
      disabled={field.disabled === true}
      {...rest}
    />
  );
}
