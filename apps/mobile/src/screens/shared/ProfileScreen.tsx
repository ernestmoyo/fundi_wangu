import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '@fundi-wangu/ui-components';
import { Avatar, Card, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import i18n from '@/config/i18n';

interface ProfileScreenProps {
  onEditProfile: () => void;
  onSavedLocations: () => void;
  onNotificationSettings: () => void;
}

export function ProfileScreen({
  onEditProfile,
  onSavedLocations,
  onNotificationSettings,
}: ProfileScreenProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const handleLanguageToggle = () => {
    const newLang = i18n.language === 'sw' ? 'en' : 'sw';
    void i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  const menuItems = [
    { label: t('profile.editProfile'), onPress: onEditProfile },
    { label: t('profile.savedLocations'), onPress: onSavedLocations },
    { label: t('profile.notifications'), onPress: onNotificationSettings },
    {
      label: `${t('profile.language')}: ${i18n.language === 'sw' ? 'Kiswahili' : 'English'}`,
      onPress: handleLanguageToggle,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll}>
        {/* Profile header */}
        <Card style={styles.profileCard}>
          <Avatar uri={user?.avatarUrl} name={user?.name} size={72} />
          <Text style={styles.name}>{user?.name ?? t('profile.unnamed')}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <Text style={styles.role}>{user?.role}</Text>
        </Card>

        {/* Menu */}
        <Card variant="outlined" style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuBorder]}
              onPress={item.onPress}
            >
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Logout */}
        <Button
          title={t('profile.logout')}
          onPress={handleLogout}
          variant="danger"
          loading={logout.isPending}
          fullWidth
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 28,
    marginTop: 16,
    marginBottom: 16,
  },
  name: { fontSize: 22, fontWeight: '700', color: colors.neutral[900], marginTop: 12 },
  phone: { fontSize: 15, color: colors.neutral[500], marginTop: 4 },
  role: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary[600],
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    textTransform: 'capitalize',
  },
  menuCard: { marginBottom: 24, padding: 0 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  menuLabel: { fontSize: 15, color: colors.neutral[800] },
  menuArrow: { fontSize: 20, color: colors.neutral[400] },
  logoutBtn: { marginBottom: 40 },
});

export default ProfileScreen;
