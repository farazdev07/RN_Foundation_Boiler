import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { TextInput } from './index';

describe('TextInput', () => {
  it('is labelled and reports changes', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <TextInput label="Email" value="" onChangeText={onChangeText} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.co');

    expect(onChangeText).toHaveBeenCalledWith('a@b.co');
  });

  it('shows an error message', async () => {
    await renderWithTheme(<TextInput label="Email" error="Required" />);

    expect(screen.getByText('Required')).toBeOnTheScreen();
  });

  it('is not editable when disabled', async () => {
    await renderWithTheme(<TextInput label="Email" disabled />);

    expect(screen.getByLabelText('Email').props.editable).toBe(false);
  });

  it('toggles password visibility', async () => {
    await renderWithTheme(<TextInput label="Password" secureTextEntry />);

    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Show password' }),
    );
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Hide password' }),
    );
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('renders start and end adornments', async () => {
    await renderWithTheme(
      <TextInput label="Price" start={<Text>$</Text>} end={<Text>USD</Text>} />,
    );

    expect(screen.getByText('$')).toBeOnTheScreen();
    expect(screen.getByText('USD')).toBeOnTheScreen();
  });

  describe('multi-line (formerly MessageField)', () => {
    it('trims outer whitespace on blur when asked', async () => {
      const onChangeText = jest.fn();
      const onBlur = jest.fn();
      await renderWithTheme(
        <TextInput
          label="Message"
          multiline
          numberOfLines={4}
          trimOnBlur
          value={'  hi there \n'}
          onChangeText={onChangeText}
          onBlur={onBlur}
        />,
      );
      const input = screen.getByLabelText('Message');

      await fireEvent(input, 'focus');
      await fireEvent(input, 'blur');

      expect(onChangeText).toHaveBeenCalledWith('hi there');
      expect(onBlur).toHaveBeenCalled();
      expect(input.props.numberOfLines).toBe(4);
    });

    it('leaves already-trimmed text alone', async () => {
      const onChangeText = jest.fn();
      await renderWithTheme(
        <TextInput
          label="Message"
          trimOnBlur
          value="hi"
          onChangeText={onChangeText}
        />,
      );

      await fireEvent(screen.getByLabelText('Message'), 'blur');

      expect(onChangeText).not.toHaveBeenCalled();
    });
  });

  it('forwards focus events', async () => {
    const onFocus = jest.fn();
    await renderWithTheme(<TextInput label="Email" onFocus={onFocus} />);

    await fireEvent(screen.getByLabelText('Email'), 'focus');

    expect(onFocus).toHaveBeenCalled();
  });
});
