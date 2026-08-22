import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useHazards } from '../HazardContext';

export default function SafetyScreen() {
  const { hazards } = useHazards();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check Road Safety</Text>
      <Text style={styles.subtitle}>Recent hazard reports near you</Text>

      <FlatList
        data={hazards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.location}>{item.location}</Text>
              <Text style={[styles.severity, item.severity === 'High' ? styles.high : styles.medium]}>
                {item.severity}
              </Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F4F8FC' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#263238' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  location: { fontSize: 16, fontWeight: '700', color: '#263238' },
  severity: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  high: { backgroundColor: '#FFE0E0', color: '#C62828' },
  medium: { backgroundColor: '#FFF3CD', color: '#7A5A00' },
  description: { fontSize: 14, color: '#455A64', marginTop: 6 },
  time: { fontSize: 12, color: '#90A4AE', marginTop: 8 },
});
