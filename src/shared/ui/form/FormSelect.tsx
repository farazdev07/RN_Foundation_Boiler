import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from '@shared/lib/form';
import { Select, type SelectOption } from '../Select';

type Props<T extends FieldValues, Output, Value extends string> = {
  // `Output` is what the schema produces; a field only needs the input side.
  control: Control<T, unknown, Output>;
  name: FieldPath<T>;
  label: string;
  options: readonly SelectOption<Value>[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  testID?: string;
};

// A single-choice Select bound to one form field. The field holds the option's
// value, or an empty string or null while nothing is chosen.
export function FormSelect<
  T extends FieldValues,
  Output = T,
  Value extends string = string,
>({
  control,
  name,
  options,
  disabled = false,
  ...rest
}: Props<T, Output, Value>) {
  const { field, fieldState } = useController({ control, name });
  const chosen = options.find(option => option.value === field.value);

  return (
    <Select
      options={options}
      value={chosen?.value ?? null}
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
