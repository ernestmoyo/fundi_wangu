import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import type { UserRole } from '@fundi-wangu/shared-types';
import { Card } from '@/components/ui';

interface RoleSelectScreenProps {
  onSelect: (role: UserRole) => void;
}

const ROLES: { role: UserRole; iconText: string; titleKey: string; descKey: string }[] = [
  {
    role: 'customer',
    iconText: '🏠',
    titleKey: 'roles.customer',
    descKey: 'roles.customerDesc',
  },
  {
    role: 'fundi',
    iconText: '🔧',
    titleKey: 'roles.fundi',
    descKey: 'roles.fundiDesc',
  },
];

export function RoleSelectScreen({ onSelect }: RoleSelectScreenProps) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('roles.selectTitle')}</Text>
          <Text style={styles.subtitle}>{t('roles.selectSubtitle')}</Text>
        </View>

        <View style={styles.cards}>
          {ROLES.map(({ role, iconText, titleKey, descKey }) => (
            <TouchableOpacity
              key={role}
              activeOpacity={0.7}
              onPress={() => onSelect(role)}
            >
              <Card variant="outlined" style={styles.roleCard}>
                <Text style={styles.icon}>{iconText}</Text>
                <Text style={styles.roleName}>{t(titleKey)}</Text>
                <Text style={styles.roleDesc}>{t(descKey)}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  cards: { gap: 16 },
  roleCard: {
    alignItems: 'center',
    paddingVertical: 28,
    borderColor: colors.neutral[200],
    borderWidth: 1.5,
  },
  icon: { fontSize: 40, marginBottom: 12 },
  roleName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default RoleSelectScreen;
