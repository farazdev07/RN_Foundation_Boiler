import { ScrollView, StyleSheet, Text } from 'react-native';
import { RuntimeCheck } from './RuntimeCheck';

// Placeholder until Phase 4. RuntimeCheck is the Phase 3 native smoke test.
export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>RN Foundation</Text>
      <RuntimeCheck />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
});
