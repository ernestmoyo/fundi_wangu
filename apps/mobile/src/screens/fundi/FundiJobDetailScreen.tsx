import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import type { JobStatus } from '@fundi-wangu/shared-types';
import { Card, Button, Avatar, JobStatusBadge } from '@/components/ui';
import { JobStatusTimeline } from '@/components/job/JobStatusTimeline';
import { MapViewComponent } from '@/components/map/MapView';
import { useJob, useUpdateJobStatus } from '@/hooks/useBooking';
import { formatCurrency } from '@fundi-wangu/utils';

const NEXT_STATUS: Partial<Record<JobStatus, { next: JobStatus; labelKey: string }>> = {
  pending: { next: 'accepted', labelKey: 'fundi.acceptJob' },
  accepted: { next: 'en_route', labelKey: 'fundi.startRoute' },
  en_route: { next: 'arrived', labelKey: 'fundi.markArrived' },
  arrived: { next: 'in_progress', labelKey: 'fundi.startWork' },
  in_progress: { next: 'completed', labelKey: 'fundi.completeJob' },
};

interface FundiJobDetailScreenProps {
  jobId: string;
  onBack: () => void;
}

export function FundiJobDetailScreen({ jobId, onBack }: FundiJobDetailScreenProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'en' ? 'en' : 'sw') as 'sw' | 'en';
  const { data: jobRes, isLoading } = useJob(jobId);
  const updateStatus = useUpdateJobStatus();

  const job = jobRes?.data as Record<string, unknown> | undefined;

  if (isLoading || !job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = job.status as JobStatus;
  const nextAction = NEXT_STATUS[status];

  const handleNext = () => {
    if (!nextAction) return;

    if (nextAction.next === 'completed') {
      Alert.alert(t('fundi.completeTitle'), t('fundi.completeConfirm'), [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: () => updateStatus.mutate({ jobId, status: nextAction.next }),
        },
      ]);
    } else {
      updateStatus.mutate({ jobId, status: nextAction.next });
    }
  };

  const handleDecline = () => {
    Alert.alert(t('fundi.declineTitle'), t('fundi.declineConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () =>
          updateStatus.mutate({ jobId, status: 'cancelled', cancellationReason: 'Fundi declined' }),
      },
    ]);
  };

  const handleCallCustomer = () => {
    const phone = job.customer_phone as string | undefined;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.category}>{job.category_name as string}</Text>
          <JobStatusBadge status={status} lang={lang} />
        </View>

        {/* Map with directions */}
        {job.latitude && job.longitude && (
          <MapViewComponent
            region={{
              latitude: job.latitude as number,
              longitude: job.longitude as number,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            markers={[
              {
                id: 'job',
                latitude: job.latitude as number,
                longitude: job.longitude as number,
                title: job.address as string,
                type: 'customer',
              },
            ]}
            style={styles.map}
          />
        )}

        {/* Timeline */}
        <Card style={styles.section}>
          <JobStatusTimeline currentStatus={status} lang={lang} />
        </Card>

        {/* Job Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('job.details')}</Text>
          <Text style={styles.description}>{job.description as string}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('job.amount')}</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(job.agreed_amount_tzs as number)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('job.address')}</Text>
            <Text style={styles.detailValue}>{job.address as string}</Text>
          </View>
        </Card>

        {/* Customer Info */}
        {job.customer_name && (
          <Card style={styles.section}>
            <View style={styles.personRow}>
              <Avatar
                uri={job.customer_avatar_url as string | null}
                name={job.customer_name as string}
                size={48}
              />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{job.customer_name as string}</Text>
                <Text style={styles.personSub}>{t('job.customer')}</Text>
              </View>
              <Button title={t('job.call')} onPress={handleCallCustomer} variant="outline" size="sm" />
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {nextAction && (
            <Button
              title={t(nextAction.labelKey)}
              onPress={handleNext}
              loading={updateStatus.isPending}
              fullWidth
            />
          )}
          {status === 'pending' && (
            <Button
              title={t('fundi.decline')}
              onPress={handleDecline}
              variant="outline"
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  category: { fontSize: 22, fontWeight: '700', color: colors.neutral[900] },
  map: { height: 200, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.neutral[800], marginBottom: 12 },
  description: { fontSize: 15, color: colors.neutral[600], lineHeight: 22, marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  detailLabel: { fontSize: 14, color: colors.neutral[500] },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  personInfo: { flex: 1, marginLeft: 12 },
  personName: { fontSize: 16, fontWeight: '600', color: colors.neutral[800] },
  personSub: { fontSize: 13, color: colors.neutral[500], marginTop: 2 },
  actions: { gap: 12, marginBottom: 40 },
});

export default FundiJobDetailScreen;
