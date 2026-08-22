import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
export default function HomeScreen() {
    const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🌧️ RainSafe</Text>
        <Text style={styles.subtitle}>Stay safe during heavy rainfall</Text>
      </View>

      <View style={styles.alertCard}>
        <Text style={styles.alertIcon}>⚠️</Text>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>Flood Safety</Text>
          <Text style={styles.alertText}>
            Avoid flooded roads and report hidden hazards.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>What do you want to do?</Text>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/safety')}>
        <Text style={styles.buttonIcon}>📍</Text>
        <View>
          <Text style={styles.buttonTitle}>Check Road Safety</Text>
          <Text style={styles.buttonSubtitle}>Find hazards near you</Text>
        </View>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/report')}>
        <Text style={styles.buttonIcon}>🚨</Text>
        <View>
          <Text style={styles.secondaryButtonTitle}>Report a Hazard</Text>
          <Text style={styles.secondaryButtonSubtitle}>Help others stay safe</Text>
        </View>
      </Pressable>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 RainSafe Tip</Text>
        <Text style={styles.infoText}>
          Never drive or walk through water when you cannot see the road underneath.
        </Text>
      </View>

      <Text style={styles.footer}>Your safety matters. Stay alert. 🌧️</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FC',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 25,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1769AA',
  },
  subtitle: {
    fontSize: 16,
    color: '#607D8B',
    marginTop: 5,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 16,
    padding: 18,
    marginBottom: 30,
  },
  alertIcon: {
    fontSize: 30,
    marginRight: 14,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7A5A00',
  },
  alertText: {
    fontSize: 14,
    color: '#806000',
    marginTop: 4,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1769AA',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D6E2EA',
    marginBottom: 25,
  },
  buttonIcon: {
    fontSize: 30,
    marginRight: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonSubtitle: {
    fontSize: 13,
    color: '#DCEEFF',
    marginTop: 4,
  },
  secondaryButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
  },
  secondaryButtonSubtitle: {
    fontSize: 13,
    color: '#78909C',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 18,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#455A64',
  },
  footer: {
    textAlign: 'center',
    color: '#90A4AE',
    fontSize: 13,
    marginTop: 'auto',
    marginBottom: 15,
  },
});