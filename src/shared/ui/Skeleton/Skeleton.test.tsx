import { StyleSheet } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Skeleton } from './index';

describe('Skeleton', () => {
  it('uses the requested size and the theme colour', async () => {
    await renderWithTheme(<Skeleton width={120} height={24} radius={2} />);

    expect(
      StyleSheet.flatten(
        screen.getByTestId('skeleton', { includeHiddenElements: true }).props
          .style,
      ),
    ).toMatchObject({
      width: 120,
      height: 24,
      borderRadius: 2,
      backgroundColor: '#ECEEF2',
    });
  });
});
