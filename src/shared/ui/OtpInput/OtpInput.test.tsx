import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { OtpInput } from './index';
import { activeCell, sanitizeCode } from './otp';

describe('otp helpers', () => {
  it.each([
    ['123456', '123456'],
    ['123 456', '123456'],
    ['Your code is 4821.', '4821'],
    ['12345678', '123456'],
    ['abc', ''],
  ])('reduces %p to digits that fit', (text, expected) => {
    expect(sanitizeCode(text, 6)).toBe(expected);
  });

  it('moves the active cell with the code and stops at the last one', () => {
    expect(activeCell('', 4)).toBe(0);
    expect(activeCell('12', 4)).toBe(2);
    expect(activeCell('1234', 4)).toBe(3);
  });
});

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [code, setCode] = useState('');
  return (
    <OtpInput
      label="Verification code"
      value={code}
      onChangeText={setCode}
      cellCount={4}
      onComplete={onComplete}
    />
  );
}

describe('OtpInput', () => {
  it('takes a pasted code, strips what is not a digit and completes once', async () => {
    const onComplete = jest.fn();
    await renderWithTheme(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText('Verification code');

    await fireEvent.changeText(input, '48-21');

    expect(screen.getByDisplayValue('4821')).toBeOnTheScreen();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('4821');

    // The same full code again, as some keyboards re-send it, is not a new entry.
    await fireEvent.changeText(input, '4821');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('completes again after the code is edited and refilled', async () => {
    const onComplete = jest.fn();
    await renderWithTheme(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText('Verification code');

    await fireEvent.changeText(input, '4821');
    await fireEvent.changeText(input, '482');
    await fireEvent.changeText(input, '4829');

    expect(onComplete).toHaveBeenLastCalledWith('4829');
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('does not complete on a partial code', async () => {
    const onComplete = jest.fn();
    await renderWithTheme(<Harness onComplete={onComplete} />);

    await fireEvent.changeText(
      screen.getByLabelText('Verification code'),
      '48',
    );

    expect(onComplete).not.toHaveBeenCalled();
  });
});
