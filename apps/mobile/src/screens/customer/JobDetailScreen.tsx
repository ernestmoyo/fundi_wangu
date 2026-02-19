import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import { Card, Button, Avatar, JobStatusBadge } from '@/components/ui';
import { JobStatusTimeline } from '@/components/job/JobStatusTimeline';
import { MapViewComponent } from '@/components/map/MapView';
import { useJob, useUpdateJobStatus, useInitiatePayment } from '@/hooks/useBooking';
import { formatCurrency } from '@fundi-wangu/utils';

interface JobDetailScreenProps {
  jobId: string;
  onBack: () => void;
}

export function JobDetailScreen({ jobId, onBack }: JobDetailScreenProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === 'en' ? 'en' : 'sw') as 'sw' | 'en';
  const { data: jobRes, isLoading } = useJob(jobId);
  const updateStatus = useUpdateJobStatus();
  const initiatePayment = useInitiatePayment();

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

  const status = job.status as import('@fundi-wangu/shared-types').JobStatus;
  const canCancel = ['pending', 'accepted'].includes(status);
  const canPay = status === 'completed' && !(job.payment_completed as boolean);

  const handleCancel = () => {
    Alert.alert(t('job.cancelTitle'), t('job.cancelConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () =>
          updateStatus.mutate({ jobId, status: 'cancelled', cancellationReason: 'Customer cancelled' }),
      },
    ]);
  };

  const handlePay = () => {
    initiatePayment.mutate({ jobId, phone: (job.customer_phone as string) ?? '' });
  };

  const handleCallFundi = () => {
    const phone = job.fundi_phone as string | undefined;
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

        {/* Map */}
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
                type: 'job',
              },
            ]}
            style={styles.map}
            showUserLocation={false}
          />
        )}

        {/* Status Timeline */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('job.progress')}</Text>
          <JobStatusTimeline currentStatus={status} lang={lang} />
        </Card>

        {/* Details */}
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

        {/* Fundi Info */}
        {job.fundi_name && (
          <Card style={styles.section}>
            <View style={styles.fundiRow}>
              <Avatar
                uri={job.fundi_avatar_url as string | null}
                name={job.fundi_name as string}
                size={48}
              />
              <View style={styles.fundiInfo}>
                <Text style={styles.fundiName}>{job.fundi_name as string}</Text>
                <Text style={styles.fundiRating}>
                  ★ {(job.fundi_rating as number)?.toFixed(1)}
                </Text>
              </View>
              <Button title={t('job.call')} onPress={handleCallFundi} variant="outline" size="sm" />
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {canPay && (
            <Button
              title={t('job.payNow')}
              onPress={handlePay}
              loading={initiatePayment.isPending}
              fullWidth
            />
          )}
          {canCancel && (
            <Button
              title={t('job.cancel')}
              onPress={handleCancel}
              variant="danger"
              loading={updateStatus.isPending}
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
  map: { height: 180, marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 12,
  },
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
  fundiRow: { flexDirection: 'row', alignItems: 'center' },
  fundiInfo: { flex: 1, marginLeft: 12 },
  fundiName: { fontSize: 16, fontWeight: '600', color: colors.neutral[800] },
  fundiRating: { fontSize: 14, color: colors.accent[600], marginTop: 2 },
  actions: { gap: 12, marginBottom: 40 },
});

export default JobDetailScreen;
