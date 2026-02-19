import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, JOB_STATUS_DISPLAY, TIER_DISPLAY } from '@fundi-wangu/ui-components';
import type { JobStatus, FundiTier } from '@fundi-wangu/shared-types';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, backgroundColor, size = 'sm' }: BadgeProps) {
  return (
    <View
      style={[
        styles.base,
        size === 'md' && styles.md,
        { backgroundColor: backgroundColor ?? colors.neutral[100] },
      ]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: color ?? colors.neutral[700] }]}>
        {label}
      </Text>
    </View>
  );
}

export function JobStatusBadge({ status, lang = 'sw' }: { status: JobStatus; lang?: 'sw' | 'en' }) {
  const display = JOB_STATUS_DISPLAY[status];
  if (!display) return null;
  return (
    <Badge
      label={lang === 'sw' ? display.labelSw : display.labelEn}
      color={display.textColor}
      backgroundColor={display.bgColor}
    />
  );
}

export function TierBadge({ tier, lang = 'sw' }: { tier: FundiTier; lang?: 'sw' | 'en' }) {
  const display = TIER_DISPLAY[tier];
  if (!display) return null;
  return (
    <Badge
      label={lang === 'sw' ? display.labelSw : display.labelEn}
      color={display.textColor}
      backgroundColor={display.bgColor}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textMd: {
    fontSize: 13,
  },
});

export default Badge;
