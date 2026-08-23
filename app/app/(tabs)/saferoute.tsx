import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useHazards } from '../HazardContext';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isNearRoute(
  hazardLat: number,
  hazardLon: number,
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  thresholdMeters = 500
) {
  const distToStart = getDistance(hazardLat, hazardLon, startLat, startLon);
  const distToEnd = getDistance(hazardLat, hazardLon, endLat, endLon);
  return Math.min(distToStart, distToEnd) < thresholdMeters;
}

export default function SafeRouteScreen() {
  const { hazards } = useHazards();
  const [startCoords, setStartCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyHazards, setNearbyHazards] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);

  const getMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow location access.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setStartCoords({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setDestCoords(null);
    setChecked(false);
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapTap') {
        setDestCoords({ latitude: data.lat, longitude: data.lng });
        setChecked(false);
      }
    } catch (e) {}
  };

  const checkRoute = () => {
    if (!startCoords || !destCoords) {
      Alert.alert('Missing info', 'Set your location and tap a destination on the map.');
      return;
    }
    const found = hazards.filter(
      (h: any) =>
        h.latitude &&
        h.longitude &&
        h.status === 'Active' &&
        isNearRoute(h.latitude, h.longitude, startCoords.latitude, startCoords.longitude, destCoords.latitude, destCoords.longitude)
    );
    setNearbyHazards(found);
    setChecked(true);
  };

  const mapHTML = startCoords
    ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${startCoords.latitude}, ${startCoords.longitude}], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        L.marker([${startCoords.latitude}, ${startCoords.longitude}]).addTo(map).bindPopup('Start (You)').openPopup();

        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapTap', lat: e.latlng.lat, lng: e.latlng.lng }));
        });

        ${
          destCoords
            ? `
        L.marker([${destCoords.latitude}, ${destCoords.longitude}]).addTo(map).bindPopup('Destination');
        L.polyline([[${startCoords.latitude}, ${startCoords.longitude}], [${destCoords.latitude}, ${destCoords.longitude}]], {color: '${nearbyHazards.length > 0 ? '#C62828' : '#2E7D32'}', weight: 4}).addTo(map);
        `
            : ''
        }

        ${hazards
          .filter((h: any) => h.latitude && h.longitude)
          .map(
            (h: any) => `
          L.circleMarker([${h.latitude}, ${h.longitude}], {radius: 6, color: '${h.status === 'Active' ? '#C62828' : '#2E7D32'}', fillOpacity: 0.8}).addTo(map);
        `
          )
          .join('\n')}
      </script>
    </body>
    </html>
  `
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>Safe Route</Text>
        <Text style={styles.subtitle}>
          {!startCoords ? 'Set your location to begin' : !destCoords ? 'Tap on the map to pick a destination' : 'Tap "Check" to see if the route is safe'}
        </Text>
      </View>

      {!startCoords && (
        <TouchableOpacity style={styles.locationButton} onPress={getMyLocation}>
          <Text style={styles.locationButtonText}>📍 Use My Location to Start</Text>
        </TouchableOpacity>
      )}

      {startCoords && (
        <View style={styles.mapContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHTML }}
            style={{ flex: 1 }}
            onMessage={handleMapMessage}
          />
        </View>
      )}

      {startCoords && destCoords && !checked && (
        <TouchableOpacity style={styles.checkButton} onPress={checkRoute}>
          <Text style={styles.checkButtonText}>Check Route Safety</Text>
        </TouchableOpacity>
      )}

      {checked && (
        <View style={[styles.resultCard, nearbyHazards.length > 0 ? styles.resultDanger : styles.resultSafe]}>
          <Text style={styles.resultTitle}>
            {nearbyHazards.length > 0
              ? `⚠️ ${nearbyHazards.length} hazard${nearbyHazards.length > 1 ? 's' : ''} near this route`
              : '✅ Route looks clear'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FC' },
  headerBox: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1769AA' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  locationButton: {
    backgroundColor: '#1769AA', borderRadius: 14, padding: 16, alignItems: 'center', marginHorizontal: 20,
  },
  locationButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mapContainer: { flex: 1 },
  checkButton: {
    backgroundColor: '#1769AA', borderRadius: 14, padding: 16, alignItems: 'center', margin: 20, marginBottom: 10,
  },
  checkButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultCard: { borderRadius: 14, padding: 16, margin: 20, marginTop: 10 },
  resultDanger: { backgroundColor: '#FFEBEE' },
  resultSafe: { backgroundColor: '#E8F5E9' },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#263238' },
});