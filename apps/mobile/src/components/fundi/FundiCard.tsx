import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import type { FundiTier } from '@fundi-wangu/shared-types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { TierBadge } from '@/components/ui/Badge';

interface FundiCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  tier: FundiTier;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  hourlyRate?: number;
  isOnline: boolean;
  onPress: (fundiId: string) => void;
}

export function FundiCard({
  id,
  name,
  avatarUrl,
  tier,
  rating,
  reviewCount,
  distanceKm,
  hourlyRate,
  isOnline,
  onPress,
}: FundiCardProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'en' ? 'en' : 'sw') as 'sw' | 'en';

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(id)}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Avatar uri={avatarUrl} name={name} size={56} online={isOnline} />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              <TierBadge tier={tier} lang={lang} />
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.rating}>★ {rating.toFixed(1)}</Text>
              <Text style={styles.statSep}>·</Text>
              <Text style={styles.statText}>
                {reviewCount} {t('reviews')}
              </Text>
              <Text style={styles.statSep}>·</Text>
              <Text style={styles.statText}>
                {distanceKm.toFixed(1)} km
              </Text>
            </View>
            {hourlyRate && (
              <Text style={styles.rate}>
                TZS {hourlyRate.toLocaleString()}/{t('hour')}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.neutral[800] },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  rating: { fontSize: 13, fontWeight: '600', color: colors.accent[600] },
  statSep: { fontSize: 13, color: colors.neutral[400], marginHorizontal: 6 },
  statText: { fontSize: 13, color: colors.neutral[500] },
  rate: { fontSize: 13, fontWeight: '500', color: colors.primary[600], marginTop: 2 },
});

export default FundiCard;
