import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import { useHazards } from '../HazardContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const hazardTypes = [
  { label: 'Flooded Road', emoji: '🌊' },
  { label: 'Pothole', emoji: '🕳️' },
  { label: 'Open Drain', emoji: '⚠️' },
  { label: 'Fallen Wires', emoji: '⚡' },
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
      quality: 0.5,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow location access.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setCoords({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
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
    if (!coords) {
      await getLocation();
    }
    addHazard({
      location: selectedType,
      description: description,
      severity: 'Medium',
    });
    Alert.alert('Reported', 'Thanks for keeping others safe!');
    setDescription('');
    setSelectedType(null);
    setPhoto(null);
    router.push('/safety');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report a Hazard</Text>
      <Text style={styles.headerSubtitle}>Help keep your community safe</Text>

      <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
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

      <Text style={styles.sectionLabel}>Hazard Types</Text>
      {hazardTypes.map((type) => (
        <TouchableOpacity
          key={type.label}
          style={[
            styles.typeOption,
            selectedType === type.label && styles.typeOptionSelected,
          ]}
          onPress={() => setSelectedType(type.label)}
        >
          <Text style={styles.typeEmoji}>{type.emoji}</Text>
          <Text style={styles.typeLabel}>{type.label}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>What did you see?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Deep water near junction, hidden pothole..."
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.locationBox} onPress={getLocation}>
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

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1769AA' },
  headerSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  photoUpload: {
    backgroundColor: '#DCEEFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  photoEmoji: { fontSize: 36, marginBottom: 8 },
  photoText: { fontSize: 16, fontWeight: '700', color: '#1769AA' },
  photoSubtext: { fontSize: 13, color: '#607D8B', marginTop: 4 },
  photoPreview: { width: '100%', height: 180, borderRadius: 12 },
  sectionLabel: { fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 10 },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8FC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  typeOptionSelected: {
    backgroundColor: '#DCEEFF',
    borderWidth: 2,
    borderColor: '#1769AA',
  },
  typeEmoji: { fontSize: 22, marginRight: 12 },
  typeLabel: { fontSize: 16, fontWeight: '600', color: '#263238' },
  label: { fontSize: 14, color: '#666', marginBottom: 8, marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  locationIcon: { fontSize: 22, marginRight: 10 },
  locationTitle: { fontSize: 15, fontWeight: '700', color: '#1565C0' },
  locationSubtext: { fontSize: 12, color: '#455A64', marginTop: 2 },
  submitButton: {
    backgroundColor: '#1769AA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});