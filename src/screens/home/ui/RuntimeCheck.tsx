/* eslint-disable no-restricted-imports -- Phase 3 native smoke test only; deleted in Phase 4 once shared/storage and shared/lib/network exist. */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import * as Keychain from 'react-native-keychain';
import { createMMKV } from 'react-native-mmkv';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

type Status = 'pending' | 'pass' | 'fail';

const CHECKS = ['worklet', 'mmkv', 'keychain', 'netinfo', 'gesture'] as const;
type Check = (typeof CHECKS)[number];

const KEYCHAIN_SERVICE = 'runtime-check';

export function RuntimeCheck() {
  const [results, setResults] = useState<Record<Check, Status>>({
    worklet: 'pending',
    mmkv: 'pending',
    keychain: 'pending',
    netinfo: 'pending',
    gesture: 'pending',
  });

  const report = (check: Check, status: Status) =>
    setResults(current => ({ ...current, [check]: status }));

  const pulse = useSharedValue(1);
  const offsetX = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true);

    const markWorklet = () => report('worklet', 'pass');
    scheduleOnUI(() => {
      'worklet';
      scheduleOnRN(markWorklet);
    });

    try {
      const storage = createMMKV({ id: 'runtime-check' });
      storage.set('probe', 'ok');
      report('mmkv', storage.getString('probe') === 'ok' ? 'pass' : 'fail');
    } catch {
      report('mmkv', 'fail');
    }

    Keychain.setGenericPassword('probe', 'ok', { service: KEYCHAIN_SERVICE })
      .then(() => Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE }))
      .then(stored =>
        report(
          'keychain',
          stored && stored.password === 'ok' ? 'pass' : 'fail',
        ),
      )
      .catch(() => report('keychain', 'fail'));

    NetInfo.fetch()
      .then(() => report('netinfo', 'pass'))
      .catch(() => report('netinfo', 'fail'));
  }, [pulse]);

  const markGesture = () => report('gesture', 'pass');
  const pan = usePanGesture({
    onUpdate: event => {
      'worklet';
      offsetX.value = event.translationX;
    },
    onDeactivate: () => {
      'worklet';
      offsetX.value = withTiming(0);
      scheduleOnRN(markGesture);
    },
  });

  const boxStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ translateX: offsetX.value }],
  }));

  return (
    <View style={styles.container}>
      {CHECKS.map(check => (
        <Text key={check} testID={`check-${check}`}>
          {`${check}: ${results[check]}`}
        </Text>
      ))}
      <GestureDetector gesture={pan}>
        <Animated.View
          testID="check-gesture-box"
          style={[styles.box, boxStyle]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  box: {
    backgroundColor: '#1F6FEB',
    borderRadius: 8,
    height: 96,
    width: 96,
  },
});
