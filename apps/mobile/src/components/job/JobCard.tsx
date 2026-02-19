import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import type { JobStatus } from '@fundi-wangu/shared-types';
import { Card } from '@/components/ui/Card';
import { JobStatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatRelativeTime } from '@fundi-wangu/utils';

interface JobCardProps {
  id: string;
  categoryName: string;
  description: string;
  status: JobStatus;
  amountTzs: number;
  createdAt: string;
  counterparty?: { name: string; avatarUrl?: string | null };
  onPress: (jobId: string) => void;
}

export function JobCard({
  id,
  categoryName,
  description,
  status,
  amountTzs,
  createdAt,
  counterparty,
  onPress,
}: JobCardProps) {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'en' ? 'en' : 'sw') as 'sw' | 'en';

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(id)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.category}>{categoryName}</Text>
            <JobStatusBadge status={status} lang={lang} />
          </View>
          <Text style={styles.amount}>{formatCurrency(amountTzs)}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.footer}>
          {counterparty && (
            <View style={styles.counterparty}>
              <Avatar uri={counterparty.avatarUrl} name={counterparty.name} size={24} />
              <Text style={styles.counterpartyName}>{counterparty.name}</Text>
            </View>
          )}
          <Text style={styles.time}>{formatRelativeTime(createdAt, lang)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  category: { fontSize: 15, fontWeight: '600', color: colors.neutral[800] },
  amount: { fontSize: 16, fontWeight: '700', color: colors.primary[600] },
  description: { fontSize: 14, color: colors.neutral[600], lineHeight: 20, marginBottom: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterparty: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  counterpartyName: { fontSize: 13, color: colors.neutral[600] },
  time: { fontSize: 12, color: colors.neutral[400] },
});

export default JobCard;
