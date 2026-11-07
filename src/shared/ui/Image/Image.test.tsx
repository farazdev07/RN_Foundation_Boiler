import { StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Image } from './index';

describe('Image', () => {
  it('shows a themed placeholder behind the image', async () => {
    await renderWithTheme(
      <Image
        testID="photo"
        source={{ uri: 'https://example.com/a.png' }}
        style={{ width: 10 }}
      />,
    );

    expect(
      StyleSheet.flatten(screen.getByTestId('photo').props.style),
    ).toMatchObject({ backgroundColor: '#ECEEF2', width: 10 });
  });
});
