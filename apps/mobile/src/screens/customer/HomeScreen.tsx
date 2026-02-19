import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import { useAuthStore } from '@/stores/auth.store';
import { useJobs } from '@/hooks/useBooking';
import { Card, Avatar } from '@/components/ui';
import { JobCard } from '@/components/job/JobCard';

const SERVICE_CATEGORIES = [
  { id: 'plumbing', icon: '🔧', labelKey: 'categories.plumbing' },
  { id: 'electrical', icon: '⚡', labelKey: 'categories.electrical' },
  { id: 'carpentry', icon: '🪚', labelKey: 'categories.carpentry' },
  { id: 'painting', icon: '🎨', labelKey: 'categories.painting' },
  { id: 'cleaning', icon: '🧹', labelKey: 'categories.cleaning' },
  { id: 'masonry', icon: '🧱', labelKey: 'categories.masonry' },
  { id: 'welding', icon: '🔩', labelKey: 'categories.welding' },
  { id: 'ac_repair', icon: '❄️', labelKey: 'categories.acRepair' },
];

interface HomeScreenProps {
  onCategoryPress: (categoryId: string) => void;
  onJobPress: (jobId: string) => void;
}

export function HomeScreen({ onCategoryPress, onJobPress }: HomeScreenProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: activeJobs } = useJobs('in_progress');

  const greeting = user?.name
    ? `${t('home.greeting')}, ${user.name.split(' ')[0]}!`
    : `${t('home.greeting')}!`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.subtitle}>{t('home.whatDoYouNeed')}</Text>
          </View>
          <Avatar uri={user?.avatarUrl} name={user?.name} size={44} />
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>{t('home.services')}</Text>
        <View style={styles.grid}>
          {SERVICE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
              onPress={() => onCategoryPress(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryLabel}>{t(cat.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Jobs */}
        {activeJobs?.pages?.[0]?.data && activeJobs.pages[0].data.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('home.activeJobs')}</Text>
            {activeJobs.pages[0].data.slice(0, 3).map((job: Record<string, unknown>) => (
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
    marginBottom: 28,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.neutral[900] },
  subtitle: { fontSize: 15, color: colors.neutral[500], marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 14,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryLabel: { fontSize: 11, fontWeight: '500', color: colors.neutral[700], textAlign: 'center' },
});

export default HomeScreen;
