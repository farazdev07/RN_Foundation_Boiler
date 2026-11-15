import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from '@shared/lib/form';
import { Checkbox } from '../Checkbox';

type Props<T extends FieldValues, Output> = {
  // `Output` is what the schema produces; a field only needs the input side.
  control: Control<T, unknown, Output>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
};

export function FormCheckbox<T extends FieldValues, Output = T>({
  control,
  name,
  label,
  disabled = false,
}: Props<T, Output>) {
  const { field } = useController({ control, name });

  return (
    <Checkbox
      label={label}
      checked={field.value === true}
      onChange={field.onChange}
      disabled={disabled}
    />
  );
}
