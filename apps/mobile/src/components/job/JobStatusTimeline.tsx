import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, JOB_STATUS_DISPLAY } from '@fundi-wangu/ui-components';
import type { JobStatus } from '@fundi-wangu/shared-types';

const STATUS_ORDER: JobStatus[] = [
  'pending',
  'accepted',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
];

interface JobStatusTimelineProps {
  currentStatus: JobStatus;
  lang?: 'sw' | 'en';
}

export function JobStatusTimeline({ currentStatus, lang = 'sw' }: JobStatusTimelineProps) {
  const isCancelledOrDisputed = currentStatus === 'cancelled' || currentStatus === 'disputed';
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <View style={styles.container}>
      {STATUS_ORDER.map((status, i) => {
        const display = JOB_STATUS_DISPLAY[status];
        const isActive = i <= currentIndex && !isCancelledOrDisputed;
        const isCurrent = status === currentStatus;

        return (
          <View key={status} style={styles.step}>
            <View style={styles.dotLine}>
              <View
                style={[
                  styles.dot,
                  isActive && { backgroundColor: colors.primary[500] },
                  isCurrent && styles.dotCurrent,
                ]}
              />
              {i < STATUS_ORDER.length - 1 && (
                <View
                  style={[
                    styles.line,
                    isActive && i < currentIndex && { backgroundColor: colors.primary[500] },
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.label,
                isActive && { color: colors.neutral[800] },
                isCurrent && { fontWeight: '600' },
              ]}
            >
              {lang === 'sw' ? display?.labelSw : display?.labelEn}
            </Text>
          </View>
        );
      })}

      {isCancelledOrDisputed && (
        <View style={styles.step}>
          <View style={styles.dotLine}>
            <View style={[styles.dot, { backgroundColor: colors.danger[500] }]} />
          </View>
          <Text style={[styles.label, { color: colors.danger[600], fontWeight: '600' }]}>
            {lang === 'sw'
              ? JOB_STATUS_DISPLAY[currentStatus]?.labelSw
              : JOB_STATUS_DISPLAY[currentStatus]?.labelEn}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  dotLine: { alignItems: 'center', marginRight: 12, width: 16 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neutral[300],
    marginTop: 2,
  },
  dotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.primary[200],
    marginLeft: -2,
  },
  line: {
    width: 2,
    height: 28,
    backgroundColor: colors.neutral[200],
    marginVertical: 2,
  },
  label: {
    fontSize: 14,
    color: colors.neutral[400],
    paddingBottom: 16,
  },
});

export default JobStatusTimeline;
