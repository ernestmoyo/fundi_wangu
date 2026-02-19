import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@fundi-wangu/ui-components';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, variant = 'elevated', padding = 16, style }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  filled: {
    backgroundColor: colors.neutral[50],
  },
});

export default Card;
