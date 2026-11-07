import { ScrollView, StyleSheet } from 'react-native';
import { Text } from '@shared/ui';
import { RuntimeCheck } from './RuntimeCheck';

// Placeholder until the reference feature. RuntimeCheck is the native smoke test
// and goes when the smoke flow moves to real screens.
export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="title">RN Foundation</Text>
      <RuntimeCheck />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
});
