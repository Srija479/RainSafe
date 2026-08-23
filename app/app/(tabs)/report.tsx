import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import { useHazards } from '../HazardContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const hazardTypes = [
  { label: 'Flooded Road', emoji: '🌊', color: '#E3F2FD' },
  { label: 'Pothole', emoji: '🕳️', color: '#F3E5F5' },
  { label: 'Open Drain', emoji: '⚠️', color: '#FFF3E0' },
  { label: 'Fallen Wires', emoji: '⚡', color: '#FFFDE7' },
];

export default function ReportScreen() {
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const { addHazard } = useHazards();
  const router = useRouter();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow location access.');
      return null;
    }
    const location = await Location.getCurrentPositionAsync({});
    const newCoords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setCoords(newCoords);
    return newCoords;
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Missing info', 'Please select a hazard type.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing info', 'Please describe the hazard.');
      return;
    }

    let finalCoords = coords;
    if (!finalCoords) {
      finalCoords = await getLocation();
    }

    addHazard({
      location: selectedType,
      description: description,
      severity: 'Medium',
      latitude: finalCoords?.latitude,
      longitude: finalCoords?.longitude,
      photo: photo || undefined,
    });
    Alert.alert('Reported', 'Thanks for keeping others safe!');
    setDescription('');
    setSelectedType(null);
    setPhoto(null);
    setCoords(null);
    router.push('/explore');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Report a Hazard</Text>
      <Text style={styles.headerSubtitle}>Help keep your community safe</Text>

      <TouchableOpacity style={styles.photoUpload} onPress={pickImage} activeOpacity={0.8}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photoPreview} />
        ) : (
          <>
            <Text style={styles.photoEmoji}>📷</Text>
            <Text style={styles.photoText}>Upload Hazard Photo</Text>
            <Text style={styles.photoSubtext}>Tap to choose a photo</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Hazard Type</Text>
      <View style={styles.typeGrid}>
        {hazardTypes.map((type) => {
          const isSelected = selectedType === type.label;
          return (
            <TouchableOpacity
              key={type.label}
              style={[styles.typeCard, isSelected && styles.typeCardSelected]}
              onPress={() => setSelectedType(type.label)}
              activeOpacity={0.8}
            >
              <View style={[styles.typeIconCircle, { backgroundColor: type.color }]}>
                <Text style={styles.typeEmoji}>{type.emoji}</Text>
              </View>
              <Text style={styles.typeLabel}>{type.label}</Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>What did you see?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Deep water near junction, hidden pothole..."
        placeholderTextColor="#9AA5B1"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.locationBox} onPress={getLocation} activeOpacity={0.8}>
        <Text style={styles.locationIcon}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.locationTitle}>Report Location</Text>
          <Text style={styles.locationSubtext}>
            {coords
              ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
              : 'Your current location will be saved with this report.'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.85}>
        <Text style={styles.submitButtonText}>Submit Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F4F8FC' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1769AA' },
  headerSubtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  photoUpload: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#DCEEFF',
    borderStyle: 'dashed',
  },
  photoEmoji: { fontSize: 34, marginBottom: 8 },
  photoText: { fontSize: 16, fontWeight: '700', color: '#1769AA' },
  photoSubtext: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  photoPreview: { width: '100%', height: 180, borderRadius: 12 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#263238', marginBottom: 12, marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  typeCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
  },
  typeCardSelected: {
    borderColor: '#1769AA',
    backgroundColor: '#F0F8FF',
  },
  typeIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  typeEmoji: { fontSize: 20 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: '#263238', textAlign: 'center' },
  checkmark: { position: 'absolute', top: 8, right: 10, color: '#1769AA', fontWeight: 'bold', fontSize: 14 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 14,
    color: '#263238',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  locationIcon: { fontSize: 22, marginRight: 10 },
  locationTitle: { fontSize: 14, fontWeight: '700', color: '#1565C0' },
  locationSubtext: { fontSize: 12, color: '#455A64', marginTop: 2 },
  submitButton: {
    backgroundColor: '#1769AA',
    padding: 17,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1769AA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});