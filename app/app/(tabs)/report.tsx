import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';

import { useState } from 'react';

import { WebView } from 'react-native-webview';

import { useHazards } from '../HazardContext';

import { useRouter } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';

import * as Location from 'expo-location';

const hazardTypes = [
  {
    label: 'Flooded Road',
    emoji: '🌊',
    color: '#E3F2FD',
  },
  {
    label: 'Pothole',
    emoji: '🕳️',
    color: '#F3E5F5',
  },
  {
    label: 'Open Drain',
    emoji: '⚠️',
    color: '#FFF3E0',
  },
  {
    label: 'Fallen Wires',
    emoji: '⚡',
    color: '#FFFDE7',
  },
];

const severities = [
  {
    label: 'Critical',
    emoji: '🔴',
  },
  {
    label: 'High',
    emoji: '🟠',
  },
  {
    label: 'Medium',
    emoji: '🟡',
  },
  {
    label: 'Low',
    emoji: '🟢',
  },
];

export default function ReportScreen() {
  const [description, setDescription] =
    useState('');

  const [selectedType, setSelectedType] =
    useState<string | null>(null);

  const [selectedSeverity, setSelectedSeverity] =
    useState<string | null>(null);

  const [photo, setPhoto] =
    useState<string | null>(null);

  const [coords, setCoords] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [showLocationMap, setShowLocationMap] =
    useState(false);

  const { addHazard } = useHazards();

  const router = useRouter();

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo access.'
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        quality: 0.3,
        base64: true,
      });

    if (!result.canceled) {
      const asset = result.assets[0];

      if (asset.base64) {
        setPhoto(
          `data:image/jpeg;base64,${asset.base64}`
        );
      } else {
        setPhoto(asset.uri);
      }
    }
  };

  const getLocation = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow location access.'
      );

      return null;
    }

    try {
      const location =
        await Location.getCurrentPositionAsync({});

      const newCoords = {
        latitude:
          location.coords.latitude,
        longitude:
          location.coords.longitude,
      };

      setCoords(newCoords);

      return newCoords;
    } catch {
      Alert.alert(
        'Location error',
        'Could not get your current location.'
      );

      return null;
    }
  };

  const handleMapMessage = (
    event: any
  ) => {
    try {
      const data = JSON.parse(
        event.nativeEvent.data
      );

      if (
        data.type ===
        'locationSelected'
      ) {
        setCoords({
          latitude: data.latitude,
          longitude: data.longitude,
        });

        setShowLocationMap(false);
      }
    } catch (error) {
      console.log(
        'Map message error:',
        error
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert(
        'Missing info',
        'Please select a hazard type.'
      );
      return;
    }

    if (!selectedSeverity) {
      Alert.alert(
        'Missing info',
        'Please select hazard severity.'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Missing info',
        'Please describe the hazard.'
      );
      return;
    }

    if (!coords) {
      Alert.alert(
        'Location required',
        'Please use your current location or choose a location on the map.'
      );
      return;
    }

    addHazard({
      type: selectedType as any,

      locationName:
        `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,

      description:
        description.trim(),

      severity:
        selectedSeverity as any,

      latitude:
        coords.latitude,

      longitude:
        coords.longitude,

      photo:
        photo || undefined,
    });

    Alert.alert(
      'Report Submitted ✅',
      'The hazard has been saved at the selected location.'
    );

    setDescription('');
    setSelectedType(null);
    setSelectedSeverity(null);
    setPhoto(null);
    setCoords(null);

    router.push('/saferoute');
  };

  const mapHTML = `
<!DOCTYPE html>
<html>

<head>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
</script>

<style>

html,
body,
#map {
  height:100%;
  margin:0;
  padding:0;
}

</style>

</head>

<body>

<div id="map"></div>

<script>

var map =
  L.map('map')
   .setView(
     [17.4147, 78.4550],
     13
   );

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution:
      '© OpenStreetMap contributors'
  }
).addTo(map);

var marker = null;

map.on('click', function(e) {

  var lat = e.latlng.lat;
  var lng = e.latlng.lng;

  if (marker) {
    map.removeLayer(marker);
  }

  marker =
    L.marker([lat, lng])
     .addTo(map)
     .bindPopup(
       'Selected hazard location'
     )
     .openPopup();

  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: 'locationSelected',
      latitude: lat,
      longitude: lng
    })
  );

});

</script>

</body>
</html>
`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 50,
      }}
    >

      <Text style={styles.title}>
        Report a Hazard
      </Text>

      <Text style={styles.headerSubtitle}>
        Help keep your community safe
      </Text>

      <TouchableOpacity
        style={styles.photoUpload}
        onPress={pickImage}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.photoPreview}
          />
        ) : (
          <>
            <Text style={styles.photoEmoji}>
              📷
            </Text>

            <Text style={styles.photoText}>
              Upload Hazard Photo
            </Text>

            <Text style={styles.photoSubtext}>
              Tap to choose a photo
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>
        Hazard Type
      </Text>

      <View style={styles.typeGrid}>

        {hazardTypes.map((type) => {
          const isSelected =
            selectedType === type.label;

          return (
            <TouchableOpacity
              key={type.label}
              style={[
                styles.typeCard,
                isSelected &&
                  styles.typeCardSelected,
              ]}
              onPress={() =>
                setSelectedType(
                  type.label
                )
              }
            >

              <View
                style={[
                  styles.typeIconCircle,
                  {
                    backgroundColor:
                      type.color,
                  },
                ]}
              >
                <Text style={styles.typeEmoji}>
                  {type.emoji}
                </Text>
              </View>

              <Text style={styles.typeLabel}>
                {type.label}
              </Text>

              {isSelected && (
                <Text style={styles.checkmark}>
                  ✓
                </Text>
              )}

            </TouchableOpacity>
          );
        })}

      </View>

      <Text style={styles.sectionLabel}>
        Hazard Severity
      </Text>

      <View style={styles.severityRow}>

        {severities.map((severity) => {
          const isSelected =
            selectedSeverity ===
            severity.label;

          return (
            <TouchableOpacity
              key={severity.label}
              style={[
                styles.severityButton,
                isSelected &&
                  styles.severitySelected,
              ]}
              onPress={() =>
                setSelectedSeverity(
                  severity.label
                )
              }
            >

              <Text>
                {severity.emoji}
              </Text>

              <Text
                style={[
                  styles.severityText,
                  isSelected &&
                    styles.severityTextSelected,
                ]}
              >
                {severity.label}
              </Text>

            </TouchableOpacity>
          );
        })}

      </View>

      <Text style={styles.sectionLabel}>
        What did you see?
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Deep water near junction, hidden pothole..."
        placeholderTextColor="#9AA5B1"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.sectionLabel}>
        Report Location
      </Text>

      <TouchableOpacity
        style={styles.locationBox}
        onPress={getLocation}
      >

        <Text style={styles.locationIcon}>
          📍
        </Text>

        <View style={{ flex: 1 }}>

          <Text style={styles.locationTitle}>
            Use My Current Location
          </Text>

          <Text style={styles.locationSubtext}>
            {coords
              ? `${coords.latitude.toFixed(
                  5
                )}, ${coords.longitude.toFixed(
                  5
                )}`
              : 'Use your current location'}
          </Text>

        </View>

      </TouchableOpacity>

      <TouchableOpacity
        style={styles.chooseLocationButton}
        onPress={() =>
          setShowLocationMap(
            !showLocationMap
          )
        }
      >
        <Text style={styles.chooseLocationText}>
          🗺️ Choose Another Location
        </Text>
      </TouchableOpacity>

      {showLocationMap && (
        <View style={styles.locationMap}>

          <WebView
            originWhitelist={['*']}
            source={{
              html: mapHTML,
            }}
            onMessage={
              handleMapMessage
            }
            style={{ flex: 1 }}
          />

          <View style={styles.mapInstruction}>
            <Text
              style={
                styles.mapInstructionText
              }
            >
              Tap anywhere on the map to
              place the hazard 📍
            </Text>
          </View>

        </View>
      )}

      {coords && (
        <View
          style={
            styles.selectedLocation
          }
        >

          <Text
            style={
              styles.selectedLocationText
            }
          >
            📍 Selected Location
          </Text>

          <Text style={styles.coordinatesText}>
            Latitude:{' '}
            {coords.latitude.toFixed(6)}
          </Text>

          <Text style={styles.coordinatesText}>
            Longitude:{' '}
            {coords.longitude.toFixed(6)}
          </Text>

        </View>
      )}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text
          style={
            styles.submitButtonText
          }
        >
          Submit Report
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#F4F8FC',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1769AA',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },

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

  photoEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },

  photoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1769AA',
  },

  photoSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },

  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263238',
    marginBottom: 12,
    marginTop: 4,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  typeEmoji: {
    fontSize: 20,
  },

  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#263238',
    textAlign: 'center',
  },

  checkmark: {
    position: 'absolute',
    top: 8,
    right: 10,
    color: '#1769AA',
    fontWeight: 'bold',
    fontSize: 14,
  },

  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },

  severityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
  },

  severitySelected: {
    borderColor: '#1769AA',
    backgroundColor: '#E3F2FD',
  },

  severityText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#455A64',
  },

  severityTextSelected: {
    color: '#1769AA',
  },

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
    marginBottom: 10,
  },

  locationIcon: {
    fontSize: 22,
    marginRight: 10,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },

  locationSubtext: {
    fontSize: 12,
    color: '#455A64',
    marginTop: 2,
  },

  chooseLocationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCEEFF',
    marginBottom: 15,
  },

  chooseLocationText: {
    color: '#1769AA',
    fontWeight: '700',
  },

  locationMap: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
  },

  mapInstruction: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor:
      'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 10,
  },

  mapInstructionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#263238',
  },

  selectedLocation: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  selectedLocationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 5,
  },

  coordinatesText: {
    fontSize: 12,
    color: '#455A64',
    marginTop: 2,
  },

  submitButton: {
    backgroundColor: '#1769AA',
    padding: 17,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },

  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});