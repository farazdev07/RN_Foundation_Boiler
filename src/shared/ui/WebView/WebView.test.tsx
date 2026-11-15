import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { WebView } from './index';
import { isAllowedUrl, originOf } from './origin';

const allowed = ['https://pay.example.com'];

describe('origin', () => {
  it.each([
    ['https://pay.example.com/checkout?id=1', 'https://pay.example.com'],
    ['https://PAY.example.com', 'https://pay.example.com'],
    ['https://pay.example.com:8443/x', 'https://pay.example.com:8443'],
    ['http://pay.example.com', null],
    ['https://pay.example.com@evil.io/', null],
    [['javascript', 'alert(1)'].join(':'), null],
    ['tel:+123', null],
    ['', null],
  ])('reads the origin of %p', (url, expected) => {
    expect(originOf(url)).toBe(expected);
  });

  it.each([
    ['https://pay.example.com/3ds', true],
    ['https://pay.example.com.evil.io/3ds', false],
    ['https://evil.io/?next=https://pay.example.com', false],
    ['https://sub.pay.example.com/', false],
    ['http://pay.example.com/', false],
    ['https://pay.example.com:444/', false],
  ])('decides whether %p may load', (url, expected) => {
    expect(isAllowedUrl(url, allowed)).toBe(expected);
  });
});

describe('WebView', () => {
  it('stops navigation that leaves the allowed origins and reports it', async () => {
    const onBlocked = jest.fn();
    await renderWithTheme(
      <WebView
        testID="web"
        uri="https://pay.example.com/checkout"
        allowedOrigins={allowed}
        onBlocked={onBlocked}
      />,
    );
    const decide = screen.getByTestId('web').props
      .onShouldStartLoadWithRequest as (request: { url: string }) => boolean;

    expect(decide({ url: 'https://pay.example.com/3ds' })).toBe(true);
    expect(onBlocked).not.toHaveBeenCalled();

    expect(decide({ url: 'https://evil.io/phish' })).toBe(false);
    expect(decide({ url: 'tel:+123' })).toBe(false);
    expect(onBlocked.mock.calls).toEqual([
      ['https://evil.io/phish'],
      ['tel:+123'],
    ]);
  });

  it('refuses to load a starting address outside the allowed origins', async () => {
    await renderWithTheme(
      <WebView testID="web" uri="https://evil.io/" allowedOrigins={allowed} />,
    );

    expect(screen.queryByTestId('web')).toBeNull();
    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
  });
});
