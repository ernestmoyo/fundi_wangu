import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import { Button, TextInput, Card } from '@/components/ui';
import { FundiCard } from '@/components/fundi/FundiCard';
import { MapViewComponent } from '@/components/map/MapView';
import { useBookingStore } from '@/stores/booking.store';
import { useSearchMafundi, useCreateJob } from '@/hooks/useBooking';
import { useLocation } from '@/hooks/useLocation';

interface BookingScreenProps {
  categoryId: string;
  onBack: () => void;
  onJobCreated: (jobId: string) => void;
}

export function BookingScreen({ categoryId, onBack, onJobCreated }: BookingScreenProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'location' | 'details' | 'fundi' | 'confirm'>(
    'location',
  );

  const store = useBookingStore();
  const { location, loading: locLoading, requestLocation } = useLocation();
  const createJob = useCreateJob();

  const { data: mafundiResult } = useSearchMafundi(
    categoryId,
    store.location?.latitude,
    store.location?.longitude,
  );

  const handleUseCurrentLocation = async () => {
    const loc = await requestLocation();
    if (loc) {
      store.setLocation({ latitude: loc.latitude, longitude: loc.longitude, address: loc.address ?? '' });
      store.setCategory(categoryId);
      setStep('details');
    }
  };

  const handleDetailsNext = () => {
    if (!store.description.trim()) {
      Alert.alert(t('booking.error'), t('booking.descriptionRequired'));
      return;
    }
    setStep('fundi');
  };

  const handleSelectFundi = (fundiId: string) => {
    store.setSelectedFundi(fundiId);
    setStep('confirm');
  };

  const handleSkipFundi = () => {
    store.setSelectedFundi(null);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!store.location) return;
    createJob.mutate(
      {
        category_id: categoryId,
        description: store.description,
        latitude: store.location.latitude,
        longitude: store.location.longitude,
        address: store.location.address,
        fundi_id: store.selectedFundiId ?? undefined,
      },
      {
        onSuccess: (res) => {
          if (res.data?.id) onJobCreated(res.data.id);
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Step indicator */}
        <View style={styles.steps}>
          {['location', 'details', 'fundi', 'confirm'].map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                (step === s || i < ['location', 'details', 'fundi', 'confirm'].indexOf(step)) &&
                  styles.stepDotActive,
              ]}
            />
          ))}
        </View>

        {step === 'location' && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t('booking.whereAreYou')}</Text>
            <MapViewComponent
              showUserLocation
              style={styles.map}
            />
            <Button
              title={t('booking.useCurrentLocation')}
              onPress={handleUseCurrentLocation}
              loading={locLoading}
              fullWidth
            />
          </View>
        )}

        {step === 'details' && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t('booking.describeJob')}</Text>
            <TextInput
              label={t('booking.descriptionLabel')}
              placeholder={t('booking.descriptionPlaceholder')}
              value={store.description}
              onChangeText={store.setDescription}
              multiline
              numberOfLines={4}
            />
            <Button
              title={t('common.next')}
              onPress={handleDetailsNext}
              fullWidth
            />
          </View>
        )}

        {step === 'fundi' && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t('booking.chooseFundi')}</Text>
            {mafundiResult?.data?.map((f: Record<string, unknown>) => (
              <FundiCard
                key={f.id as string}
                id={f.id as string}
                name={f.name as string}
                avatarUrl={f.avatar_url as string | null}
                tier={f.tier as import('@fundi-wangu/shared-types').FundiTier}
                rating={f.rating as number}
                reviewCount={f.review_count as number}
                distanceKm={f.distance_km as number}
                isOnline={f.is_online as boolean}
                onPress={handleSelectFundi}
              />
            ))}
            <Button
              title={t('booking.skipAutoAssign')}
              onPress={handleSkipFundi}
              variant="ghost"
              fullWidth
            />
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>{t('booking.confirmJob')}</Text>
            <Card variant="outlined" style={styles.summary}>
              <Text style={styles.summaryLabel}>{t('booking.location')}</Text>
              <Text style={styles.summaryValue}>{store.location?.address}</Text>
              <Text style={styles.summaryLabel}>{t('booking.description')}</Text>
              <Text style={styles.summaryValue}>{store.description}</Text>
              {store.selectedFundiId && (
                <>
                  <Text style={styles.summaryLabel}>{t('booking.selectedFundi')}</Text>
                  <Text style={styles.summaryValue}>{store.selectedFundiId}</Text>
                </>
              )}
            </Card>
            <Button
              title={t('booking.confirmAndBook')}
              onPress={handleConfirm}
              loading={createJob.isPending}
              fullWidth
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[300],
  },
  stepDotActive: { backgroundColor: colors.primary[500], width: 24 },
  section: { marginTop: 12, gap: 16 },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  map: { height: 200, marginBottom: 8 },
  summary: { gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral[500], textTransform: 'uppercase' },
  summaryValue: { fontSize: 15, color: colors.neutral[800], marginBottom: 8 },
});

export default BookingScreen;
