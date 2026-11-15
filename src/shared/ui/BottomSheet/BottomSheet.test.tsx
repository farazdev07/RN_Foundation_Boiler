import { act } from '@testing-library/react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Text } from '../Text';
import { renderWithTheme } from '../testing/renderWithTheme';
import { BottomSheet } from './index';

type MockSheet = {
  present: jest.Mock;
  dismiss: jest.Mock;
  props: { onDidDismiss: () => void };
};

// The Jest mock keeps each mounted sheet, with jest.fn() methods, by name.
const native = () => {
  const { instances } = TrueSheet as unknown as {
    instances: Record<string, MockSheet>;
  };
  const [instance] = Object.values(instances);
  if (!instance) {
    throw new Error('No sheet is mounted');
  }
  return { instance };
};

const sheet = (visible: boolean, onClose = jest.fn()) => (
  <BottomSheet visible={visible} onClose={onClose} title="Filters">
    <Text>Body</Text>
  </BottomSheet>
);

describe('BottomSheet', () => {
  it('presents and dismisses the native sheet as `visible` changes, once each', async () => {
    const { rerender } = await renderWithTheme(sheet(false));
    const { present, dismiss } = native().instance;

    expect(present).not.toHaveBeenCalled();

    await rerender(sheet(true));
    await rerender(sheet(true));
    expect(present).toHaveBeenCalledTimes(1);

    await rerender(sheet(false));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('tells the screen when the user closes it, without dismissing again', async () => {
    const onClose = jest.fn();
    const { rerender } = await renderWithTheme(sheet(true, onClose));
    const { dismiss, props } = native().instance;

    await act(() => props.onDidDismiss());
    expect(onClose).toHaveBeenCalledTimes(1);

    // The screen answers by setting visible to false.
    await rerender(sheet(false, onClose));
    expect(dismiss).not.toHaveBeenCalled();

    // And it can be opened again.
    await rerender(sheet(true, onClose));
    expect(native().instance.present).toHaveBeenCalledTimes(2);
  });
});
