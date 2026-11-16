import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from '@shared/lib/form';
import { RadioGroup } from '../RadioGroup';

type Props<T extends FieldValues, Output, Value extends string> = {
  // `Output` is what the schema produces; a field only needs the input side.
  control: Control<T, unknown, Output>;
  name: FieldPath<T>;
  label: string;
  options: readonly { value: Value; label: string }[];
  testID?: string;
};

// A RadioGroup bound to one form field.
export function FormRadioGroup<
  T extends FieldValues,
  Output = T,
  Value extends string = string,
>({ control, name, options, ...rest }: Props<T, Output, Value>) {
  const { field, fieldState } = useController({ control, name });
  const chosen = options.find(option => option.value === field.value);

  return (
    <RadioGroup
      options={options}
      value={chosen?.value ?? null}
      onChange={value => {
        field.onChange(value);
        field.onBlur();
      }}
      error={fieldState.error?.message}
      {...rest}
    />
  );
}
