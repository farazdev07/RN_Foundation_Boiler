import { useMemo } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { z } from 'zod';
import { useZodForm } from '@shared/lib/form';
import { Button } from '../Button';
import { renderWithTheme } from '../testing/renderWithTheme';
import { emptyPhone, FormPhoneInput, type PhoneValue } from './index';

function Contact({ onValid }: { onValid: (values: unknown) => void }) {
  const schema = useMemo(
    () =>
      z.object({
        phone: z
          .custom<PhoneValue>()
          .refine(phone => phone.valid, 'Enter a valid number')
          .transform(phone => phone.e164),
      }),
    [],
  );
  const form = useZodForm(schema, {
    defaultValues: { phone: emptyPhone('PK') },
  });

  return (
    <>
      <FormPhoneInput
        control={form.control}
        name="phone"
        defaultCountry="PK"
        testID="phone"
      />
      <Button title="Send" onPress={form.submitWith(onValid)} />
    </>
  );
}

describe('FormPhoneInput', () => {
  it('rejects a short number, then submits the E.164 form of a valid one', async () => {
    const onValid = jest.fn();
    await renderWithTheme(<Contact onValid={onValid} />);

    await fireEvent.changeText(screen.getByTestId('phone'), '0301');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Enter a valid number')).toBeOnTheScreen();
    expect(onValid).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('phone'), '03012345678');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(onValid.mock.calls[0]?.[0]).toEqual({ phone: '+923012345678' }),
    );
  });
});
