import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useHazards } from '../HazardContext';

export default function ExploreScreen() {
  const { hazards } = useHazards();

  const markersScript = hazards
    .filter((h: any) => h.latitude && h.longitude)
    .map(
      (h: any) => `
      L.marker([${h.latitude}, ${h.longitude}])
        .addTo(map)
        .bindPopup(
          "<b>${h.location}</b><br>${h.description}<br><small>${h.latitude.toFixed(5)}, ${h.longitude.toFixed(5)}</small>"
        );
    `
    )
    .join('\n');

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([17.4147, 78.4550], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        ${markersScript}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danger Map</Text>
        <Text style={styles.subtitle}>Reported hazards around you</Text>
      </View>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#F4F8FC' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1769AA' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  map: { flex: 1 },
});