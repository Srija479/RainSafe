import {
  StyleSheet,
  View,
  Pressable,
  Text,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useHazards } from '../HazardContext';

export default function HomeScreen() {
  const router = useRouter();

  const { hazards } = useHazards();

  const activeCount =
    hazards.filter(
      (h) => h.status === 'Active'
    ).length;

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>
          🌧️ RainSafe
        </Text>

        <Text style={styles.subtitle}>
          Stay safe during heavy rainfall
        </Text>
      </View>

      <View style={styles.alertCard}>

        <Text style={styles.alertIcon}>
          ⚠️
        </Text>

        <View style={styles.alertContent}>

          <View style={styles.alertTitleRow}>

            <Text style={styles.alertTitle}>
              Flood Safety
            </Text>

            {activeCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {activeCount} active
                </Text>
              </View>
            )}

          </View>

          <Text style={styles.alertText}>
            {activeCount > 0
              ? `${activeCount} hazard${
                  activeCount > 1 ? 's' : ''
                } reported nearby. Stay alert.`
              : 'No active hazards reported nearby.'}
          </Text>

        </View>
      </View>

      <Text style={styles.sectionTitle}>
        What do you want to do?
      </Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() =>
          router.push('/saferoute')
        }
      >
        <Text style={styles.buttonIcon}>
          📍
        </Text>

        <View>
          <Text style={styles.buttonTitle}>
            Check Road Safety
          </Text>

          <Text style={styles.buttonSubtitle}>
            Find hazards near you
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() =>
          router.push('/report')
        }
      >
        <Text style={styles.buttonIcon}>
          🚨
        </Text>

        <View>
          <Text
            style={styles.secondaryButtonTitle}
          >
            Report a Hazard
          </Text>

          <Text
            style={styles.secondaryButtonSubtitle}
          >
            Help others stay safe
          </Text>
        </View>
      </Pressable>

      <View style={styles.infoCard}>

        <Text style={styles.infoTitle}>
          💡 RainSafe Tip
        </Text>

        <Text style={styles.infoText}>
          Never drive or walk through water
          when you cannot see the road
          underneath.
        </Text>

      </View>

      <Text style={styles.footer}>
        Your safety matters. Stay alert. 🌧️
      </Text>

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
    backgroundColor: '#FFF3CD',
    borderRadius: 18,
    padding: 18,
    marginBottom: 30,
    elevation: 2,
  },

  alertIcon: {
    fontSize: 28,
    marginRight: 14,
    marginTop: 2,
  },

  alertContent: {
    flex: 1,
  },

  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7A5A00',
  },

  countBadge: {
    backgroundColor: '#C62828',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  alertText: {
    fontSize: 14,
    color: '#806000',
    marginTop: 6,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    elevation: 4,
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E3EAF0',
    marginBottom: 25,
    elevation: 1,
  },

  buttonIcon: {
    fontSize: 28,
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
    borderRadius: 18,
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