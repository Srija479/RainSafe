import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { WebView } from 'react-native-webview';

import * as Location from 'expo-location';

import { useHazards } from '../HazardContext';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type RoutePoint = {
  lat: number;
  lon: number;
};

type Hazard = {
  id: string;
  type: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  latitude?: number;
  longitude?: number;
};

/*
 * Calculate distance from a point to one road segment.
 * Result is in meters.
 */
function distanceToSegment(
  pointLat: number,
  pointLon: number,
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
) {
  const latScale = 111320;

  const avgLat =
    ((startLat + endLat) / 2) *
    (Math.PI / 180);

  const lonScale =
    111320 * Math.cos(avgLat);

  const px = pointLon * lonScale;
  const py = pointLat * latScale;

  const ax = startLon * lonScale;
  const ay = startLat * latScale;

  const bx = endLon * lonScale;
  const by = endLat * latScale;

  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      (px - ax) ** 2 +
        (py - ay) ** 2
    );
  }

  const t =
    ((px - ax) * dx +
      (py - ay) * dy) /
    (dx * dx + dy * dy);

  const clampedT = Math.max(
    0,
    Math.min(1, t)
  );

  const closestX =
    ax + clampedT * dx;

  const closestY =
    ay + clampedT * dy;

  return Math.sqrt(
    (px - closestX) ** 2 +
      (py - closestY) ** 2
  );
}

/*
 * Calculate distance between a hazard
 * and the complete route.
 */
function distanceToRoute(
  hazardLat: number,
  hazardLon: number,
  route: RoutePoint[]
) {
  if (route.length < 2) {
    return Infinity;
  }

  let minimumDistance = Infinity;

  for (
    let i = 0;
    i < route.length - 1;
    i++
  ) {
    const start = route[i];
    const end = route[i + 1];

    const distance =
      distanceToSegment(
        hazardLat,
        hazardLon,
        start.lat,
        start.lon,
        end.lat,
        end.lon
      );

    if (
      distance <
      minimumDistance
    ) {
      minimumDistance = distance;
    }
  }

  return minimumDistance;
}

/*
 * Get numeric risk value.
 */
function getSeverityRisk(
  severity: string
) {
  switch (severity) {
    case 'Critical':
      return 30;

    case 'High':
      return 20;

    case 'Medium':
      return 10;

    case 'Low':
      return 5;

    default:
      return 0;
  }
}

/*
 * Calculate RainSafe Safety Score.
 */
function calculateSafetyScore(
  hazards: Hazard[]
) {
  if (hazards.length === 0) {
    return 100;
  }

  let penalty = 0;

  hazards.forEach((hazard) => {
    penalty += getSeverityRisk(
      hazard.severity
    );
  });

  return Math.max(
    0,
    Math.min(100, 100 - penalty)
  );
}

/*
 * Get score information.
 */
function getScoreInfo(
  score: number
) {
  if (score >= 80) {
    return {
      label: 'Very Safe',
      emoji: '🟢',
      color: '#2E7D32',
      background: '#E8F5E9',
    };
  }

  if (score >= 60) {
    return {
      label: 'Moderately Safe',
      emoji: '🟡',
      color: '#F57F17',
      background: '#FFF8E1',
    };
  }

  if (score >= 40) {
    return {
      label: 'Risky',
      emoji: '🟠',
      color: '#EF6C00',
      background: '#FFF3E0',
    };
  }

  return {
    label: 'High Risk',
    emoji: '🔴',
    color: '#C62828',
    background: '#FFEBEE',
  };
}

/*
 * Get hazard severity color.
 */
function getHazardColor(
  severity: string
) {
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
}

export default function SafeRouteScreen() {
  const { hazards } = useHazards();

  const [destination, setDestination] =
    useState('');

  const [startCoords, setStartCoords] =
    useState<Coordinate | null>(null);

  const [destCoords, setDestCoords] =
    useState<Coordinate | null>(null);

  const [route, setRoute] =
    useState<RoutePoint[]>([]);

  const [nearbyHazards, setNearbyHazards] =
    useState<any[]>([]);

  const [distanceKm, setDistanceKm] =
    useState<number | null>(null);

  const [
    estimatedMinutes,
    setEstimatedMinutes,
  ] = useState<number | null>(null);

  const [safetyScore, setSafetyScore] =
    useState<number | null>(null);

  const [nearestHazardDistance, setNearestHazardDistance] =
    useState<number | null>(null);

  const [nearestHazard, setNearestHazard] =
    useState<any | null>(null);

  const [searched, setSearched] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /*
   * Get current location.
   */
  const getMyLocation = async () => {
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
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
          }
        );

      const coords = {
        latitude:
          location.coords.latitude,

        longitude:
          location.coords.longitude,
      };

      setStartCoords(coords);

      return coords;
    } catch {
      Alert.alert(
        'Location error',
        'Could not get your current location.'
      );

      return null;
    }
  };

  /*
   * Search destination.
   */
  const searchDestination = async () => {
    if (!destination.trim()) {
      Alert.alert(
        'Enter destination',
        'Please enter a destination.'
      );

      return;
    }

    try {
      setLoading(true);
      setSearched(false);

      const query =
        encodeURIComponent(
          destination.trim()
        );

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
          {
            headers: {
              Accept:
                'application/json',

              'User-Agent':
                'RainSafe-App/1.0',
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          'Destination search failed'
        );
      }

      const results =
        await response.json();

      if (
        !results ||
        results.length === 0
      ) {
        Alert.alert(
          'Destination not found',
          'Try a more specific location.'
        );

        return;
      }

      const result = results[0];

      const destinationCoords = {
        latitude: Number(result.lat),

        longitude: Number(result.lon),
      };

      setDestCoords(
        destinationCoords
      );

      let currentCoords =
        startCoords;

      if (!currentCoords) {
        currentCoords =
          await getMyLocation();
      }

      if (!currentCoords) {
        return;
      }

      await getRoadRoute(
        currentCoords,
        destinationCoords
      );
    } catch (error) {
      console.log(
        'Destination error:',
        error
      );

      Alert.alert(
        'Search error',
        'Could not find the destination.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Calculate road route.
   */
  const getRoadRoute = async (
    start: Coordinate,
    destination: Coordinate
  ) => {
    try {
      setLoading(true);

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${start.longitude},${start.latitude};` +
        `${destination.longitude},${destination.latitude}` +
        `?overview=full&geometries=geojson`;

      const response =
        await fetch(url);

      if (!response.ok) {
        throw new Error(
          'Routing request failed'
        );
      }

      const data =
        await response.json();

      if (
        !data.routes ||
        data.routes.length === 0
      ) {
        Alert.alert(
          'Route unavailable',
          'Could not find a road route.'
        );

        return;
      }

      const selectedRoute =
        data.routes[0];

      const routeCoordinates: RoutePoint[] =
        selectedRoute.geometry.coordinates.map(
          (point: number[]) => ({
            lon: point[0],
            lat: point[1],
          })
        );

      setRoute(routeCoordinates);

      setDistanceKm(
        selectedRoute.distance / 1000
      );

      setEstimatedMinutes(
        Math.round(
          selectedRoute.duration / 60
        )
      );

      /*
       * Hazards within 300 meters
       * of the actual road route.
       */
      const ROUTE_THRESHOLD = 300;

      const foundHazards =
        hazards
          .filter((hazard: any) => {
            if (
              typeof hazard.latitude !==
                'number' ||
              typeof hazard.longitude !==
                'number'
            ) {
              return false;
            }

            if (
              hazard.status !== 'Active'
            ) {
              return false;
            }

            const distance =
              distanceToRoute(
                hazard.latitude,
                hazard.longitude,
                routeCoordinates
              );

            return (
              distance <=
              ROUTE_THRESHOLD
            );
          })
          .map((hazard: any) => {
            const distance =
              distanceToRoute(
                hazard.latitude,
                hazard.longitude,
                routeCoordinates
              );

            return {
              ...hazard,
              routeDistance: distance,
            };
          })
          .sort(
            (a: any, b: any) =>
              a.routeDistance -
              b.routeDistance
          );

      setNearbyHazards(
        foundHazards
      );

      /*
       * Find nearest hazard.
       */
      if (foundHazards.length > 0) {
        const closest =
          foundHazards[0];

        setNearestHazard(
          closest
        );

        setNearestHazardDistance(
          closest.routeDistance
        );
      } else {
        setNearestHazard(null);

        setNearestHazardDistance(
          null
        );
      }

      /*
       * Calculate RainSafe Score.
       */
      const score =
        calculateSafetyScore(
          foundHazards
        );

      setSafetyScore(score);

      setSearched(true);
    } catch (error) {
      console.log(
        'Routing error:',
        error
      );

      Alert.alert(
        'Route error',
        'Unable to calculate the road route.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Map HTML.
   */
  const mapHTML =
    startCoords &&
    destCoords &&
    route.length > 0
      ? `
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

</style>

</head>

<body>

<div id="map"></div>

<script>

var map =
  L.map('map');

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom:19,
    attribution:
      '&copy; OpenStreetMap contributors'
  }
).addTo(map);

/*
 * Start marker
 */

L.marker([
  ${startCoords.latitude},
  ${startCoords.longitude}
])
.addTo(map)
.bindPopup(
  '<b>📍 Your Location</b>'
);

/*
 * Destination marker
 */

L.marker([
  ${destCoords.latitude},
  ${destCoords.longitude}
])
.addTo(map)
.bindPopup(
  '<b>🏁 Destination</b>'
);

/*
 * Route
 */

var routeCoordinates =
  ${JSON.stringify(
    route.map((p) => [
      p.lat,
      p.lon,
    ])
  )};

var routeLine =
  L.polyline(
    routeCoordinates,
    {
      color:
        '${nearbyHazards.length > 0
          ? '#D32F2F'
          : '#2E7D32'}',

      weight:6,

      opacity:0.9
    }
  ).addTo(map);

/*
 * Hazard markers
 */

${nearbyHazards
  .map(
    (h: any) => `
L.circleMarker(
  [
    ${h.latitude},
    ${h.longitude}
  ],
  {
    radius:10,
    color:'${getHazardColor(
      h.severity
    )}',
    fillColor:'${getHazardColor(
      h.severity
    )}',
    fillOpacity:0.9,
    weight:3
  }
)
.addTo(map)
.bindPopup(
  '<b>⚠️ ${String(
    h.type
  ).replace(/'/g, "\\'")}</b><br/>' +

  'Severity: ${String(
    h.severity
  ).replace(/'/g, "\\'")}<br/>' +

  'Distance from route: ${Math.round(
    h.routeDistance
  )} m'
);
`
  )
  .join('\n')}

map.fitBounds(
  routeLine.getBounds(),
  {
    padding:[30,30]
  }
);

</script>

</body>

</html>
`
      : '';

  const scoreInfo =
    safetyScore !== null
      ? getScoreInfo(safetyScore)
      : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
    >

      {/* HEADER */}

      <View style={styles.header}>

        <Text style={styles.title}>
          Safer Route
        </Text>

        <Text style={styles.subtitle}>
          Find a route with fewer
          reported hazards
        </Text>

      </View>

      {/* SEARCH CARD */}

      <View style={styles.searchCard}>

        <Text style={styles.searchTitle}>
          Where do you want to go?
        </Text>

        <View style={styles.searchRow}>

          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={
              setDestination
            }
            placeholder="e.g. Charminar, Hyderabad"
            placeholderTextColor="#78909C"
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={
              searchDestination
            }
            disabled={loading}
          >

            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.searchButtonText
                }
              >
                Search
              </Text>
            )}

          </TouchableOpacity>

        </View>

      </View>

      {/* MAP */}

      {startCoords &&
      destCoords &&
      route.length > 0 ? (

        <View
          style={styles.mapContainer}
        >

          <WebView
            originWhitelist={['*']}
            source={{
              html: mapHTML,
            }}
            style={styles.map}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
          />

        </View>

      ) : (

        <View style={styles.emptyMap}>

          <Text
            style={styles.emptyMapEmoji}
          >
            🗺️
          </Text>

          <Text
            style={styles.emptyMapTitle}
          >
            Search for a destination
          </Text>

          <Text
            style={styles.emptyMapText}
          >
            Enter a destination above
            to calculate a safer road
            route.
          </Text>

        </View>

      )}

      {/* NEARBY HAZARD ALERT */}

      {searched &&
      nearestHazard &&
      nearestHazardDistance !== null && (

        <View
          style={styles.alertCard}
        >

          <View
            style={styles.alertHeader}
          >

            <Text
              style={styles.alertIcon}
            >
              ⚠️
            </Text>

            <View style={{ flex: 1 }}>

              <Text
                style={styles.alertTitle}
              >
                Hazard Ahead
              </Text>

              <Text
                style={styles.alertSubtitle}
              >
                A reported hazard is
                near your route
              </Text>

            </View>

          </View>

          <View
            style={styles.alertDetails}
          >

            <Text
              style={styles.alertHazardType}
            >
              {nearestHazard.type}
            </Text>

            <View
              style={styles.alertRow}
            >

              <Text
                style={styles.alertLabel}
              >
                Severity
              </Text>

              <Text
                style={[
                  styles.alertSeverity,
                  {
                    color:
                      getHazardColor(
                        nearestHazard.severity
                      ),
                  },
                ]}
              >
                {nearestHazard.severity}
              </Text>

            </View>

            <View
              style={styles.alertRow}
            >

              <Text
                style={styles.alertLabel}
              >
                Distance
              </Text>

              <Text
                style={styles.alertDistance}
              >
                {Math.round(
                  nearestHazardDistance
                )}{' '}
                m from route
              </Text>

            </View>

          </View>

          <Text
            style={styles.alertWarning}
          >
            🛑 Please slow down and
            stay alert near this
            location.
          </Text>

        </View>

      )}

      {/* SAFETY SCORE */}

      {searched &&
      safetyScore !== null &&
      scoreInfo && (

        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor:
                scoreInfo.background,
            },
          ]}
        >

          <View
            style={styles.scoreHeader}
          >

            <View>

              <Text
                style={styles.scoreTitle}
              >
                🛡️ RainSafe Safety Score
              </Text>

              <Text
                style={[
                  styles.scoreRisk,
                  {
                    color:
                      scoreInfo.color,
                  },
                ]}
              >
                {scoreInfo.emoji}{' '}
                {scoreInfo.label}
              </Text>

            </View>

            <View
              style={styles.scoreCircle}
            >

              <Text
                style={[
                  styles.scoreNumber,
                  {
                    color:
                      scoreInfo.color,
                  },
                ]}
              >
                {safetyScore}
              </Text>

              <Text
                style={styles.scoreOutOf}
              >
                /100
              </Text>

            </View>

          </View>

          <Text
            style={styles.scoreDescription}
          >
            Based on {nearbyHazards.length}{' '}
            active reported hazard
            {nearbyHazards.length !== 1
              ? 's'
              : ''}{' '}
            detected within 300 m
            of your route.
          </Text>

        </View>

      )}

      {/* ROUTE STATS */}

      {searched && (

        <View
          style={styles.statsCard}
        >

          <View style={styles.stat}>

            <Text
              style={styles.statValue}
            >
              {distanceKm
                ? distanceKm.toFixed(1)
                : '--'}{' '}
              km
            </Text>

            <Text
              style={styles.statLabel}
            >
              Distance
            </Text>

          </View>

          <View style={styles.stat}>

            <Text
              style={styles.statValue}
            >
              {estimatedMinutes ?? '--'}{' '}
              min
            </Text>

            <Text
              style={styles.statLabel}
            >
              Estimated time
            </Text>

          </View>

          <View style={styles.stat}>

            <Text
              style={styles.statValue}
            >
              {nearbyHazards.length}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Hazards
            </Text>

          </View>

        </View>

      )}

      {/* RECHECK BUTTON */}

      {route.length > 0 && (

        <TouchableOpacity
          style={styles.routeButton}
          onPress={() => {

            if (
              startCoords &&
              destCoords
            ) {

              getRoadRoute(
                startCoords,
                destCoords
              );

            }

          }}
        >

          <Text
            style={styles.routeButtonText}
          >
            🛣️ Recheck Route Safety
          </Text>

        </TouchableOpacity>

      )}

      {/* HAZARD LIST */}

      {searched &&
      nearbyHazards.length > 0 && (

        <View
          style={styles.hazardListCard}
        >

          <Text
            style={styles.hazardListTitle}
          >
            ⚠️ Hazards Near Your Route
          </Text>

          {nearbyHazards.map(
            (hazard: any) => (

              <View
                key={hazard.id}
                style={styles.hazardItem}
              >

                <View
                  style={[
                    styles.hazardDot,
                    {
                      backgroundColor:
                        getHazardColor(
                          hazard.severity
                        ),
                    },
                  ]}
                />

                <View
                  style={{ flex: 1 }}
                >

                  <Text
                    style={styles.hazardName}
                  >
                    {hazard.type}
                  </Text>

                  <Text
                    style={styles.hazardDescription}
                  >
                    {hazard.description}
                  </Text>

                  <Text
                    style={styles.hazardDistance}
                  >
                    📍{' '}
                    {Math.round(
                      hazard.routeDistance
                    )}{' '}
                    m from route
                  </Text>

                </View>

                <Text
                  style={[
                    styles.hazardSeverity,
                    {
                      color:
                        getHazardColor(
                          hazard.severity
                        ),
                    },
                  ]}
                >
                  {hazard.severity}
                </Text>

              </View>

            )
          )}

        </View>

      )}

    </ScrollView>
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
    paddingBottom: 18,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1769AA',
  },

  subtitle: {
    fontSize: 16,
    color: '#607D8B',
    marginTop: 5,
  },

  searchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    elevation: 3,
  },

  searchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 14,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    height: 52,
    backgroundColor: '#F1F5FB',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#263238',
    marginRight: 10,
  },

  searchButton: {
    height: 52,
    minWidth: 110,
    backgroundColor: '#1769AA',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  mapContainer: {
    height: 400,
    marginTop: 20,
    overflow: 'hidden',
  },

  map: {
    flex: 1,
  },

  emptyMap: {
    height: 400,
    marginTop: 20,
    backgroundColor: '#E8EEF4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  emptyMapEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },

  emptyMapTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#263238',
  },

  emptyMapText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#607D8B',
    marginTop: 7,
    lineHeight: 21,
  },

  /*
   * Nearby hazard alert
   */

  alertCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FFB74D',
  },

  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  alertIcon: {
    fontSize: 34,
    marginRight: 12,
  },

  alertTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#BF360C',
  },

  alertSubtitle: {
    fontSize: 13,
    color: '#6D4C41',
    marginTop: 3,
  },

  alertDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },

  alertHazardType: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 8,
  },

  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  alertLabel: {
    fontSize: 13,
    color: '#607D8B',
  },

  alertSeverity: {
    fontSize: 14,
    fontWeight: '800',
  },

  alertDistance: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1769AA',
  },

  alertWarning: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#5D4037',
    lineHeight: 19,
  },

  /*
   * Safety score
   */

  scoreCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    padding: 18,
  },

  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  scoreTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#263238',
  },

  scoreRisk: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },

  scoreCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },

  scoreNumber: {
    fontSize: 27,
    fontWeight: '900',
  },

  scoreOutOf: {
    fontSize: 11,
    color: '#78909C',
    marginTop: -3,
  },

  scoreDescription: {
    fontSize: 13,
    color: '#546E7A',
    lineHeight: 19,
    marginTop: 14,
  },

  /*
   * Statistics
   */

  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 18,
    elevation: 2,
  },

  stat: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1769AA',
  },

  statLabel: {
    fontSize: 12,
    color: '#607D8B',
    marginTop: 4,
  },

  /*
   * Recheck
   */

  routeButton: {
    backgroundColor: '#1769AA',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },

  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  /*
   * Hazard list
   */

  hazardListCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },

  hazardListTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#263238',
    marginBottom: 12,
  },

  hazardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
  },

  hazardDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    marginRight: 10,
  },

  hazardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#263238',
  },

  hazardDescription: {
    fontSize: 12,
    color: '#607D8B',
    marginTop: 3,
    lineHeight: 17,
  },

  hazardDistance: {
    fontSize: 12,
    color: '#1769AA',
    fontWeight: '700',
    marginTop: 5,
  },

  hazardSeverity: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
  },

});