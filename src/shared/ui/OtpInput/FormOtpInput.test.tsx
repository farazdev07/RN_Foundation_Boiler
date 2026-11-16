import { useMemo } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { z } from 'zod';
import { useZodForm } from '@shared/lib/form';
import { renderWithTheme } from '../testing/renderWithTheme';
import { FormOtpInput } from './index';

function Verify({ onValid }: { onValid: (values: unknown) => void }) {
  const schema = useMemo(
    () => z.object({ code: z.string().regex(/^[1-9]\d{3}$/, 'Wrong code') }),
    [],
  );
  const form = useZodForm(schema, { defaultValues: { code: '' } });

  return (
    <FormOtpInput
      control={form.control}
      name="code"
      label="Code"
      cellCount={4}
      onComplete={form.submitWith(onValid)}
    />
  );
}

describe('FormOtpInput', () => {
  it('submits when the last digit is typed, and shows the schema error for a bad code', async () => {
    const onValid = jest.fn();
    await renderWithTheme(<Verify onValid={onValid} />);
    const input = screen.getByLabelText('Code');

    await fireEvent.changeText(input, '0123');
    expect(await screen.findByText('Wrong code')).toBeOnTheScreen();
    expect(onValid).not.toHaveBeenCalled();

    await fireEvent.changeText(input, '012');
    await fireEvent.changeText(input, '4821');

    await waitFor(() =>
      expect(onValid.mock.calls[0]?.[0]).toEqual({ code: '4821' }),
    );
  });
});
