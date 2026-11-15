import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type FieldValues,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';
import { reportError } from '@shared/lib/monitoring';

type Options<Input extends FieldValues, Output> = Omit<
  UseFormProps<Input, unknown, Output>,
  'resolver'
>;

// The one form pattern: a zod schema is the validation and the type of what
// `handleSubmit` hands over. Build the schema with translated messages, for
// example `z.string().min(1, t('required'))`, inside `useMemo`.
//
// Errors show after the first submit and then update as the user types.
export type ZodForm<Input extends FieldValues, Output> = UseFormReturn<
  Input,
  unknown,
  Output
> & {
  // For onPress and onSubmitEditing: validates, then calls `onValid` with the
  // parsed values. A handler that throws is reported, not left unhandled.
  submitWith: (
    onValid: (values: Output) => void | Promise<unknown>,
  ) => () => void;
};

export const useZodForm = <Input extends FieldValues, Output>(
  schema: z.ZodType<Output, Input>,
  options: Options<Input, Output> = {},
): ZodForm<Input, Output> => {
  const form = useForm<Input, unknown, Output>({
    ...options,
    resolver: zodResolver(schema),
  });

  return {
    ...form,
    submitWith: onValid => () => {
      form
        .handleSubmit(async values => {
          await onValid(values);
        })()
        .catch(reportError);
    },
  };
};
