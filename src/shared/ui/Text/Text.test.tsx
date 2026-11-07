import { StyleSheet } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { darkColorPreference } from '../testing/themePreference';
import { Text } from './index';

const styleOf = (text: string) =>
  StyleSheet.flatten(screen.getByText(text).props.style);

describe('Text', () => {
  beforeEach(() => {
    createMMKV({ id: 'device' }).clearAll();
  });

  it('applies the variant and colour tokens', async () => {
    await renderWithTheme(
      <Text variant="title" color="error" align="center">
        Hello
      </Text>,
    );

    expect(styleOf('Hello')).toMatchObject({
      fontSize: 24,
      fontFamily: 'OpenSans-Bold',
      color: '#C62828',
      textAlign: 'center',
    });
  });

  it('follows the dark theme', async () => {
    darkColorPreference();

    await renderWithTheme(<Text>Hello</Text>);

    expect(styleOf('Hello').color).toBe('#F2F4F7');
  });

  it('lets a caller extend the style', async () => {
    await renderWithTheme(<Text style={{ opacity: 0.5 }}>Hello</Text>);

    expect(styleOf('Hello').opacity).toBe(0.5);
  });
});
