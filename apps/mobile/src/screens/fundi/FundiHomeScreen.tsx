import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { colors } from '@fundi-wangu/ui-components';
import { Card, Avatar, TierBadge } from '@/components/ui';
import { JobCard } from '@/components/job/JobCard';
import { useAuthStore } from '@/stores/auth.store';
import { useFundiStore } from '@/stores/fundi.store';
import { api } from '@/lib/api';
import { queryClient } from '@/config/query';
import { formatCurrency } from '@fundi-wangu/utils';

interface FundiHomeScreenProps {
  onJobPress: (jobId: string) => void;
}

export function FundiHomeScreen({ onJobPress }: FundiHomeScreenProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { isOnline, setOnline } = useFundiStore();
  const lang = (i18n.language === 'en' ? 'en' : 'sw') as 'sw' | 'en';

  const { data: statusRes } = useQuery({
    queryKey: ['fundiStatus'],
    queryFn: () => api.fundi.getStatus(),
  });

  const { data: walletRes } = useQuery({
    queryKey: ['fundiWallet'],
    queryFn: () => api.fundi.getWallet(),
  });

  const { data: pendingJobs } = useQuery({
    queryKey: ['fundiPendingJobs'],
    queryFn: () => api.jobs.list({ status: 'pending', page: 1, per_page: 5 }),
  });

  const toggleOnline = useMutation({
    mutationFn: () => api.fundi.toggleStatus(!isOnline),
    onSuccess: () => {
      setOnline(!isOnline);
      void queryClient.invalidateQueries({ queryKey: ['fundiStatus'] });
    },
  });

  const status = statusRes?.data as Record<string, unknown> | undefined;
  const wallet = walletRes?.data as Record<string, unknown> | undefined;
  const jobs = (pendingJobs?.data ?? []) as Record<string, unknown>[];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header with online toggle */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar uri={user?.avatarUrl} name={user?.name} size={48} online={isOnline} />
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{user?.name ?? t('fundi.dashboard')}</Text>
              {status?.tier && (
                <TierBadge
                  tier={status.tier as import('@fundi-wangu/shared-types').FundiTier}
                  lang={lang}
                />
              )}
            </View>
          </View>
          <View style={styles.toggle}>
            <Text style={styles.toggleLabel}>
              {isOnline ? t('fundi.online') : t('fundi.offline')}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={() => toggleOnline.mutate()}
              trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
              thumbColor={isOnline ? colors.primary[500] : colors.neutral[500]}
            />
          </View>
        </View>

        {/* Wallet */}
        <Card style={styles.walletCard}>
          <Text style={styles.walletLabel}>{t('fundi.walletBalance')}</Text>
          <Text style={styles.walletAmount}>
            {formatCurrency(wallet?.available_balance_tzs as number ?? 0)}
          </Text>
          <View style={styles.walletRow}>
            <View>
              <Text style={styles.walletSubLabel}>{t('fundi.pendingBalance')}</Text>
              <Text style={styles.walletSubValue}>
                {formatCurrency(wallet?.pending_balance_tzs as number ?? 0)}
              </Text>
            </View>
            <View>
              <Text style={styles.walletSubLabel}>{t('fundi.todayEarnings')}</Text>
              <Text style={styles.walletSubValue}>
                {formatCurrency(wallet?.today_earnings_tzs as number ?? 0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{status?.rating as number ?? 0}</Text>
            <Text style={styles.statLabel}>{t('fundi.rating')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{status?.jobs_completed as number ?? 0}</Text>
            <Text style={styles.statLabel}>{t('fundi.completed')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>
              {((status?.acceptance_rate as number ?? 0) * 100).toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>{t('fundi.acceptance')}</Text>
          </Card>
        </View>

        {/* Pending Jobs */}
        {jobs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('fundi.newRequests')}</Text>
            {jobs.map((job) => (
              <JobCard
                key={job.id as string}
                id={job.id as string}
                categoryName={(job.category_name as string) ?? ''}
                description={job.description as string}
                status={job.status as import('@fundi-wangu/shared-types').JobStatus}
                amountTzs={job.agreed_amount_tzs as number}
                createdAt={job.created_at as string}
                onPress={onJobPress}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { marginLeft: 12, gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: colors.neutral[900] },
  toggle: { alignItems: 'center' },
  toggleLabel: { fontSize: 11, color: colors.neutral[500], marginBottom: 4 },
  walletCard: {
    backgroundColor: colors.primary[500],
    marginBottom: 16,
    padding: 20,
  },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  walletAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginVertical: 4 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  walletSubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  walletSubValue: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary[600] },
  statLabel: { fontSize: 11, color: colors.neutral[500], marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 12,
  },
});

export default FundiHomeScreen;
