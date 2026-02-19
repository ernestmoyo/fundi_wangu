import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import RNMapView, { Marker, type Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '@fundi-wangu/ui-components';
import ENV from '@/config/env';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  type?: 'customer' | 'fundi' | 'job';
}

interface MapViewProps {
  region?: Region;
  markers?: MapMarker[];
  onRegionChange?: (region: Region) => void;
  onMarkerPress?: (markerId: string) => void;
  showUserLocation?: boolean;
  style?: object;
}

const MARKER_COLORS: Record<string, string> = {
  customer: colors.primary[500],
  fundi: colors.accent[500],
  job: colors.warning[500],
};

export function MapViewComponent({
  region,
  markers = [],
  onRegionChange,
  onMarkerPress,
  showUserLocation = true,
  style,
}: MapViewProps) {
  return (
    <View style={[styles.container, style]}>
      <RNMapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={region ?? ENV.DEFAULT_MAP_REGION}
        onRegionChangeComplete={onRegionChange}
        showsUserLocation={showUserLocation}
        showsMyLocationButton
        showsCompass
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
            pinColor={MARKER_COLORS[marker.type ?? 'job'] ?? colors.primary[500]}
            onPress={() => onMarkerPress?.(marker.id)}
          />
        ))}
      </RNMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', borderRadius: 16 },
  map: { flex: 1 },
});

export default MapViewComponent;
