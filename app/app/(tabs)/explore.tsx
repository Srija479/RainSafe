import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useHazards, getTimeAgo, Hazard } from '../HazardContext';

export default function ExploreScreen() {
  const { hazards, removeHazard } = useHazards();

  const activeHazards = hazards.filter(
    (h: Hazard) => h.status === 'Active'
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return '#D32F2F';
      case 'High':
        return '#F57C00';
      case 'Medium':
        return '#FBC02D';
      case 'Low':
        return '#388E3C';
      default:
        return '#757575';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    if (severity === 'Medium') {
      return '#8A6D00';
    }

    if (severity === 'Low') {
      return '#2E7D32';
    }

    return '#FFFFFF';
  };

  const escapeHtml = (value: any) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>');
  };

  /*
   * Create the marker code.
   */
  const markersScript = useMemo(() => {
    const validHazards = hazards.filter(
      (h: Hazard) =>
        typeof h.latitude === 'number' &&
        typeof h.longitude === 'number'
    );

    return validHazards
      .map((h: Hazard) => {
        const markerColor = getSeverityColor(h.severity);

        const type = escapeHtml(h.type);
        const location = escapeHtml(h.locationName);
        const description = escapeHtml(h.description);
        const severity = escapeHtml(h.severity);
        const status = escapeHtml(h.status);
        const timeAgo = escapeHtml(getTimeAgo(h.timestamp));

        const photoHtml = h.photo
          ? `
            <div style="margin-top:10px;">
              <img
                src="${h.photo}"
                style="
                  width:100%;
                  max-height:160px;
                  object-fit:cover;
                  border-radius:10px;
                "
              />
            </div>
          `
          : `
            <div
              style="
                margin-top:10px;
                padding:10px;
                background:#F5F5F5;
                border-radius:8px;
                color:#777;
                text-align:center;
              "
            >
              No photo uploaded
            </div>
          `;

        return `
          var marker = L.marker(
            [${h.latitude}, ${h.longitude}],
            {
              title: "${type}"
            }
          ).addTo(map);

          marker.bindPopup(
            \`
              <div
                style="
                  width:240px;
                  font-family:Arial,sans-serif;
                "
              >

                <div
                  style="
                    font-size:18px;
                    font-weight:bold;
                    color:#1769AA;
                    margin-bottom:5px;
                  "
                >
                  ${type}
                </div>

                <div
                  style="
                    font-size:13px;
                    color:#555;
                    margin-bottom:8px;
                  "
                >
                  📍 ${location}
                </div>

                <div
                  style="
                    padding:7px 10px;
                    border-radius:8px;
                    background:${markerColor};
                    color:#FFFFFF;
                    font-weight:bold;
                    display:inline-block;
                    margin-bottom:8px;
                  "
                >
                  ${severity} Severity
                </div>

                <div
                  style="
                    margin-top:4px;
                    font-size:13px;
                    color:#333;
                  "
                >
                  <b>Status:</b> ${status}
                </div>

                <div
                  style="
                    margin-top:5px;
                    font-size:13px;
                    color:#444;
                  "
                >
                  <b>Description:</b><br/>
                  ${description}
                </div>

                <div
                  style="
                    margin-top:7px;
                    font-size:12px;
                    color:#777;
                  "
                >
                  🕒 ${timeAgo}
                </div>

                <div
                  style="
                    margin-top:5px;
                    font-size:11px;
                    color:#888;
                  "
                >
                  ${Number(h.latitude).toFixed(5)},
                  ${Number(h.longitude).toFixed(5)}
                </div>

                ${photoHtml}

              </div>
            \`
          );
        `;
      })
      .join('\n');
  }, [hazards]);

  /*
   * Calculate map center.
   */
  const mapCenter = useMemo(() => {
    const validHazards = hazards.filter(
      (h: Hazard) =>
        typeof h.latitude === 'number' &&
        typeof h.longitude === 'number'
    );

    if (validHazards.length === 0) {
      // Hyderabad fallback
      return {
        latitude: 17.3850,
        longitude: 78.4867,
      };
    }

    const avgLat =
      validHazards.reduce(
        (sum, h) => sum + Number(h.latitude),
        0
      ) / validHazards.length;

    const avgLng =
      validHazards.reduce(
        (sum, h) => sum + Number(h.longitude),
        0
      ) / validHazards.length;

    return {
      latitude: avgLat,
      longitude: avgLng,
    };
  }, [hazards]);

  /*
   * Full Leaflet HTML.
   */
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
  width:100%;
  height:100%;
  margin:0;
  padding:0;
}

body {
  overflow:hidden;
}

.leaflet-popup-content {
  margin:12px;
}

.leaflet-popup-content-wrapper {
  border-radius:12px;
}

</style>

</head>

<body>

<div id="map"></div>

<script>

try {

  var map = L.map('map', {
    zoomControl: true
  }).setView(
    [${mapCenter.latitude}, ${mapCenter.longitude}],
    13
  );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(map);

  ${markersScript}

  /*
   * Automatically zoom to hazards.
   */
  var markers = [];

  ${hazards
    .filter(
      (h: Hazard) =>
        typeof h.latitude === 'number' &&
        typeof h.longitude === 'number'
    )
    .map(
      (h: Hazard) => `
        markers.push(
          L.marker([
            ${h.latitude},
            ${h.longitude}
          ])
        );
      `
    )
    .join('\n')}

  if (markers.length > 0) {

    var group = L.featureGroup(markers);

    map.fitBounds(
      group.getBounds().pad(0.25)
    );

  }

  /*
   * Force Leaflet to recalculate its size.
   */
  setTimeout(function() {
    map.invalidateSize();
  }, 500);

} catch(error) {

  document.getElementById('map').innerHTML =
    '<div style="padding:20px;color:red;font-size:16px;">' +
    'Unable to load map. Please check your internet connection.' +
    '</div>';

}

</script>

</body>
</html>
`;

  const handleRemove = (id: string) => {
    removeHazard(id);
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>
          Danger Map
        </Text>

        <Text style={styles.subtitle}>
          Reported hazards around you
        </Text>
      </View>

      {/* ACTIVE COUNT */}

      <View style={styles.countCard}>
        <View style={styles.countDot} />

        <Text style={styles.countText}>
          {activeHazards.length} Active Hazard
          {activeHazards.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* ACTUAL MAP */}

      <View style={styles.mapContainer}>

        <WebView
          originWhitelist={['*']}
          source={{ html: mapHTML }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          startInLoadingState={true}
          scrollEnabled={false}
        />

      </View>

      {/* MAP LEGEND */}

      <View style={styles.legend}>

        <Text style={styles.legendTitle}>
          Severity
        </Text>

        <View style={styles.legendRow}>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: '#D32F2F' },
              ]}
            />
            <Text>Critical</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: '#F57C00' },
              ]}
            />
            <Text>High</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: '#FBC02D' },
              ]}
            />
            <Text>Medium</Text>
          </View>

          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: '#388E3C' },
              ]}
            />
            <Text>Low</Text>
          </View>

        </View>

      </View>

      {/* REPORTED HAZARDS */}

      <ScrollView
        style={styles.hazardList}
        contentContainerStyle={styles.hazardListContent}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.listTitle}>
          Reported Hazards
        </Text>

        {hazards.length === 0 ? (

          <View style={styles.emptyCard}>

            <Text style={styles.emptyEmoji}>
              🛡️
            </Text>

            <Text style={styles.emptyTitle}>
              No hazards reported
            </Text>

            <Text style={styles.emptyText}>
              Report a hazard and it will appear
              here on the danger map.
            </Text>

          </View>

        ) : (

          hazards.map((hazard: Hazard) => {

            const severityColor =
              getSeverityColor(hazard.severity);

            const severityTextColor =
              getSeverityTextColor(hazard.severity);

            return (

              <View
                key={hazard.id}
                style={styles.hazardCard}
              >

                <View style={styles.hazardInfo}>

                  <Text style={styles.hazardType}>
                    {hazard.type}
                  </Text>

                  <Text style={styles.hazardDescription}>
                    {hazard.description}
                  </Text>

                  <View style={styles.badgesRow}>

                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor:
                            severityColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          {
                            color:
                              severityTextColor,
                          },
                        ]}
                      >
                        {hazard.severity}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        hazard.status === 'Active'
                          ? styles.statusActive
                          : styles.statusOther,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          hazard.status === 'Active'
                            ? {
                                color: '#C62828',
                              }
                            : {
                                color: '#455A64',
                              },
                        ]}
                      >
                        {hazard.status}
                      </Text>
                    </View>

                  </View>

                  {hazard.latitude &&
                    hazard.longitude && (

                      <Text style={styles.coordinates}>
                        📍{' '}
                        {hazard.latitude.toFixed(5)},
                        {' '}
                        {hazard.longitude.toFixed(5)}
                      </Text>

                    )}

                  <Text style={styles.timeText}>
                    🕒 {getTimeAgo(hazard.timestamp)}
                  </Text>

                </View>

                {/* PHOTO */}

                {hazard.photo ? (

                  <Image
                    source={{ uri: hazard.photo }}
                    style={styles.hazardPhoto}
                  />

                ) : (

                  <View style={styles.noPhoto}>
                    <Text style={styles.noPhotoText}>
                      📷
                    </Text>
                  </View>

                )}

                {/* REMOVE */}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() =>
                    handleRemove(hazard.id)
                  }
                  activeOpacity={0.8}
                >

                  <Text style={styles.removeButtonText}>
                    🗑️ Remove
                  </Text>

                </TouchableOpacity>

              </View>

            );

          })

        )}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 15,
    backgroundColor: '#F4F8FC',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1769AA',
  },

  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 5,
  },

  countCard: {
    position: 'absolute',
    top: 130,
    left: 25,
    zIndex: 20,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderRadius: 28,

    paddingHorizontal: 20,
    paddingVertical: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,

    elevation: 6,
  },

  countDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C62828',
    marginRight: 10,
  },

  countText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#263238',
  },

  /*
   * IMPORTANT:
   * Fixed map height prevents the WebView
   * from becoming invisible.
   */

  mapContainer: {
    height: 360,
    marginTop: 5,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
  },

  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  legend: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 10,

    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  legendTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 6,
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },

  hazardList: {
    flex: 1,
  },

  hazardListContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 100,
  },

  listTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 14,
  },

  hazardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,

    padding: 16,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: '#E1E7EC',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,

    elevation: 2,
  },

  hazardInfo: {
    paddingRight: 100,
  },

  hazardType: {
    fontSize: 20,
    fontWeight: '800',
    color: '#263238',
  },

  hazardDescription: {
    fontSize: 14,
    color: '#607D8B',
    marginTop: 4,
    lineHeight: 19,
  },

  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },

  severityText: {
    fontSize: 12,
    fontWeight: '800',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusActive: {
    backgroundColor: '#FFEBEE',
  },

  statusOther: {
    backgroundColor: '#ECEFF1',
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  coordinates: {
    fontSize: 12,
    color: '#546E7A',
    marginTop: 9,
  },

  timeText: {
    fontSize: 11,
    color: '#90A4AE',
    marginTop: 5,
  },

  hazardPhoto: {
    position: 'absolute',
    right: 15,
    top: 15,

    width: 90,
    height: 75,

    borderRadius: 10,
    backgroundColor: '#ECEFF1',
  },

  noPhoto: {
    position: 'absolute',
    right: 15,
    top: 15,

    width: 90,
    height: 75,

    borderRadius: 10,

    backgroundColor: '#F1F5F9',

    alignItems: 'center',
    justifyContent: 'center',
  },

  noPhotoText: {
    fontSize: 28,
    opacity: 0.5,
  },

  removeButton: {
    marginTop: 15,

    backgroundColor: '#FFEBEE',

    borderRadius: 14,

    paddingVertical: 12,

    alignItems: 'center',
  },

  removeButtonText: {
    color: '#C62828',
    fontSize: 15,
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
  },

  emptyEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#263238',
  },

  emptyText: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },

});