import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '@fundi-wangu/ui-components';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  online?: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ uri, name, size = 48, online }: AvatarProps) {
  const fontSize = size * 0.38;
  const borderRadius = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius }]}>
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      {online !== undefined && (
        <View
          style={[
            styles.indicator,
            { backgroundColor: online ? colors.success[500] : colors.neutral[400] },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  image: { resizeMode: 'cover' },
  placeholder: {
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary[700],
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
});

export default Avatar;
