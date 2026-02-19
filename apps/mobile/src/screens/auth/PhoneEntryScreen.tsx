import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import { Button, TextInput } from '@/components/ui';
import { useRequestOtp } from '@/hooks/useAuth';

interface PhoneEntryScreenProps {
  onOtpSent: (phone: string) => void;
}

export function PhoneEntryScreen({ onOtpSent }: PhoneEntryScreenProps) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const requestOtp = useRequestOtp();

  const formattedPhone = phone.startsWith('0')
    ? `+255${phone.slice(1)}`
    : phone.startsWith('+')
      ? phone
      : `+255${phone}`;

  const isValid = /^\+255[67]\d{8}$/.test(formattedPhone);

  const handleSubmit = () => {
    if (!isValid) return;
    requestOtp.mutate(formattedPhone, {
      onSuccess: () => onOtpSent(formattedPhone),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Fundi Wangu</Text>
          <Text style={styles.title}>{t('auth.enterPhone')}</Text>
          <Text style={styles.subtitle}>{t('auth.phoneHint')}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label={t('auth.phoneLabel')}
            placeholder="0712 345 678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={13}
            error={phone.length > 3 && !isValid ? t('auth.invalidPhone') : undefined}
            leftIcon={<Text style={styles.prefix}>+255</Text>}
          />

          <Button
            title={t('auth.sendOtp')}
            onPress={handleSubmit}
            disabled={!isValid}
            loading={requestOtp.isPending}
            fullWidth
          />
        </View>

        {requestOtp.isError && (
          <Text style={styles.errorText}>
            {(requestOtp.error as Error).message}
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 24 },
  header: { marginTop: 60, marginBottom: 40 },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary[500],
    marginBottom: 24,
  },
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
  form: { gap: 8 },
  prefix: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: 14,
    color: colors.danger[500],
    textAlign: 'center',
    marginTop: 16,
  },
});

export default PhoneEntryScreen;
