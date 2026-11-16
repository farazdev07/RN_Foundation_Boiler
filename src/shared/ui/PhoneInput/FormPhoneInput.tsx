import type { ComponentProps } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from '@shared/lib/form';
import { emptyPhone, PhoneInput } from './PhoneInput';
import type { CountryCode, PhoneValue } from './phone';

type Props<T extends FieldValues, Output> = Omit<
  ComponentProps<typeof PhoneInput>,
  'value' | 'onChange' | 'error'
> & {
  // `Output` is what the schema produces; a field only needs the input side.
  control: Control<T, unknown, Output>;
  name: FieldPath<T>;
  // Used while the field has no value yet.
  defaultCountry: CountryCode;
};

const isPhoneValue = (value: unknown): value is PhoneValue =>
  typeof value === 'object' && value !== null && 'e164' in value;

// A PhoneInput bound to one form field. The field holds a PhoneValue; validate
// it in the schema with `.refine(phone => phone.valid, message)` and send
// `phone.e164`.
export function FormPhoneInput<T extends FieldValues, Output = T>({
  control,
  name,
  defaultCountry,
  disabled = false,
  ...rest
}: Props<T, Output>) {
  const { field, fieldState } = useController({ control, name });

  return (
    <PhoneInput
      value={
        isPhoneValue(field.value) ? field.value : emptyPhone(defaultCountry)
      }
      onChange={field.onChange}
      error={fieldState.error?.message}
      disabled={disabled || field.disabled === true}
      {...rest}
    />
  );
}
