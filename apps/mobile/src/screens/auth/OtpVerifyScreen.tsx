import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import { OtpInput, Button } from '@/components/ui';
import { useVerifyOtp, useRequestOtp } from '@/hooks/useAuth';
import ENV from '@/config/env';

interface OtpVerifyScreenProps {
  phone: string;
  onBack: () => void;
}

export function OtpVerifyScreen({ phone, onBack }: OtpVerifyScreenProps) {
  const { t } = useTranslation();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useRequestOtp();
  const [countdown, setCountdown] = useState(ENV.OTP_RESEND_INTERVAL_SEC);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleComplete = (code: string) => {
    verifyOtp.mutate({ phone, code });
  };

  const handleResend = () => {
    resendOtp.mutate(phone);
    setCountdown(ENV.OTP_RESEND_INTERVAL_SEC);
  };

  const maskedPhone = phone.replace(/(\+255)(\d{2})(\d{4})(\d{3})/, '$1 $2 **** $4');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.verifyOtp')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.otpSentTo', { phone: maskedPhone })}
          </Text>
        </View>

        <OtpInput onComplete={handleComplete} />

        {verifyOtp.isError && (
          <Text style={styles.error}>
            {(verifyOtp.error as Error).message}
          </Text>
        )}

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdown}>
              {t('auth.resendIn', { seconds: countdown })}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendOtp.isPending}>
              <Text style={styles.resendLink}>{t('auth.resendOtp')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {verifyOtp.isPending && (
          <Button title={t('auth.verifying')} onPress={() => {}} loading fullWidth />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginTop: 12, marginBottom: 8 },
  backText: { fontSize: 15, color: colors.primary[500], fontWeight: '500' },
  header: { marginBottom: 36 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.neutral[500],
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    color: colors.danger[500],
    textAlign: 'center',
    marginTop: 16,
  },
  resendRow: {
    marginTop: 32,
    alignItems: 'center',
  },
  countdown: { fontSize: 14, color: colors.neutral[400] },
  resendLink: { fontSize: 14, fontWeight: '600', color: colors.primary[500] },
});

export default OtpVerifyScreen;
