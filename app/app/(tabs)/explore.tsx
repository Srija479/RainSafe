import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useHazards, getTimeAgo } from '../HazardContext';

export default function ExploreScreen() {
  const { hazards } = useHazards();
  const activeCount = hazards.filter((h: any) => h.status === 'Active').length;

 const escapeText = (str: string) =>
    String(str || '').replace(/\\/g, '\\\\').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' ');

  const markersScript = hazards
    .filter((h: any) => h.latitude && h.longitude)
    .map((h: any) => {
      const timeAgo = getTimeAgo(h.timestamp);
      const statusColor = h.status === 'Active' ? '#C62828' : '#2E7D32';
      const loc = escapeText(h.location);
      const desc = escapeText(h.description);
      return `
      L.marker([${h.latitude}, ${h.longitude}])
        .addTo(map)
        .bindPopup(
          "<b>" + "${loc}" + "</b><br>" + "${desc}" + "<br>" +
          "<span style='color:${statusColor};font-weight:bold'>${h.status}</span> · ${timeAgo}<br>" +
          "<small>${h.latitude.toFixed(5)}, ${h.longitude.toFixed(5)}</small>"
        );
    `;
    })
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
        .leaflet-popup-content { width: 220px !important; }
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
      <View style={styles.mapWrapper}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHTML }}
          style={styles.map}
        />
        <View style={styles.statsCard}>
          <View style={styles.statsDot} />
          <Text style={styles.statsText}>{activeCount} Active Hazard{activeCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#F4F8FC' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1769AA' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  mapWrapper: { flex: 1 },
  map: { flex: 1 },
  statsCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C62828', marginRight: 8 },
  statsText: { fontSize: 13, fontWeight: '700', color: '#263238' },
});