import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import type { JobStatus } from '@fundi-wangu/shared-types';
import { useJobs } from '@/hooks/useBooking';
import { JobCard } from '@/components/job/JobCard';
import { EmptyState } from '@/components/ui';

const TABS: { key: JobStatus | 'all'; labelKey: string }[] = [
  { key: 'all', labelKey: 'jobs.all' },
  { key: 'pending', labelKey: 'jobs.pending' },
  { key: 'in_progress', labelKey: 'jobs.active' },
  { key: 'completed', labelKey: 'jobs.completed' },
];

interface JobsListScreenProps {
  onJobPress: (jobId: string) => void;
}

export function JobsListScreen({ onJobPress }: JobsListScreenProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');
  const status = activeTab === 'all' ? undefined : activeTab;
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useJobs(status);

  const jobs = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('jobs.myJobs')}</Text>

      {/* Tab bar */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item: Record<string, unknown>) => item.id as string}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: Record<string, unknown> }) => (
          <JobCard
            id={item.id as string}
            categoryName={(item.category_name as string) ?? ''}
            description={item.description as string}
            status={item.status as JobStatus}
            amountTzs={item.agreed_amount_tzs as number}
            createdAt={item.created_at as string}
            onPress={onJobPress}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={t('jobs.empty')}
              message={t('jobs.emptyHint')}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  tabActive: { backgroundColor: colors.primary[500] },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.neutral[600] },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
});

export default JobsListScreen;
