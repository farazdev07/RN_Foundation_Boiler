import { useMemo } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { z } from 'zod';
import { useZodForm } from '@shared/lib/form';
import { Button } from '../Button';
import { renderWithTheme } from '../testing/renderWithTheme';
import {
  FormCheckbox,
  FormRadioGroup,
  FormSelect,
  FormTextInput,
} from './index';

type Values = { email: string; age: number; terms: boolean };

function SignUp({ onValid }: { onValid: (values: Values) => void }) {
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().trim().pipe(z.email('Enter an email')),
        // A text field holds a string; the schema turns it into the number
        // the submit handler receives.
        age: z
          .string()
          .transform(Number)
          .pipe(z.number().min(18, 'Adults only')),
        terms: z.literal(true, 'Accept the terms'),
      }),
    [],
  );
  const form = useZodForm(schema, {
    defaultValues: { email: '', age: '' },
  });

  return (
    <>
      <FormTextInput control={form.control} name="email" label="Email" />
      <FormTextInput control={form.control} name="age" label="Age" />
      <FormCheckbox control={form.control} name="terms" label="Terms" />
      <Button title="Send" onPress={form.submitWith(onValid)} />
    </>
  );
}

describe('form pattern', () => {
  it('blocks an invalid submit and shows each field error', async () => {
    const onValid = jest.fn();
    await renderWithTheme(<SignUp onValid={onValid} />);

    await fireEvent.changeText(screen.getByLabelText('Age'), '12');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Enter an email')).toBeOnTheScreen();
    expect(screen.getByText('Adults only')).toBeOnTheScreen();
    expect(onValid).not.toHaveBeenCalled();
  });

  it('clears an error as the field is corrected, then submits parsed values', async () => {
    const onValid = jest.fn();
    await renderWithTheme(<SignUp onValid={onValid} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Enter an email')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Email'), ' a@b.co ');
    await screen.findByDisplayValue(' a@b.co ');
    expect(screen.queryByText('Enter an email')).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Age'), '30');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Terms' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    await screen.findByDisplayValue('30');
    expect(onValid.mock.calls[0]?.[0]).toEqual({
      email: 'a@b.co',
      age: 30,
      terms: true,
    });
  });

  describe('choice fields', () => {
    const countries = [
      { value: 'pk', label: 'Pakistan' },
      { value: 'ae', label: 'UAE' },
    ] as const;
    const plans = [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
    ] as const;

    function Plan({ onValid }: { onValid: (values: unknown) => void }) {
      const schema = useMemo(
        () =>
          z.object({
            country: z.enum(['pk', 'ae'], 'Choose a country'),
            plan: z.enum(['free', 'pro'], 'Choose a plan'),
          }),
        [],
      );
      const form = useZodForm(schema, {
        defaultValues: { country: '', plan: '' },
      });

      return (
        <>
          <FormSelect
            control={form.control}
            name="country"
            label="Country"
            options={countries}
            testID="country"
          />
          <FormRadioGroup
            control={form.control}
            name="plan"
            label="Plan"
            options={plans}
            testID="plan"
          />
          <Button title="Send" onPress={form.submitWith(onValid)} />
        </>
      );
    }

    it('shows an error for each empty choice, then submits the chosen values', async () => {
      const onValid = jest.fn();
      await renderWithTheme(<Plan onValid={onValid} />);

      await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

      expect(await screen.findByText('Choose a country')).toBeOnTheScreen();
      expect(screen.getByText('Choose a plan')).toBeOnTheScreen();
      expect(onValid).not.toHaveBeenCalled();

      await fireEvent.press(screen.getByTestId('country'));
      await fireEvent.press(await screen.findByTestId('country-ae'));
      await fireEvent.press(screen.getByTestId('plan-pro'));
      await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() =>
        expect(onValid.mock.calls[0]?.[0]).toEqual({
          country: 'ae',
          plan: 'pro',
        }),
      );
      expect(screen.queryByText('Choose a country')).toBeNull();
    });
  });
});
