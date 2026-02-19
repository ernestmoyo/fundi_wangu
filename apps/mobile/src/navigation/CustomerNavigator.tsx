import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@fundi-wangu/ui-components';
import { useTranslation } from 'react-i18next';
import type { CustomerTabParamList, CustomerStackParamList } from './types';
import { HomeScreen } from '@/screens/customer/HomeScreen';
import { JobsListScreen } from '@/screens/customer/JobsListScreen';
import { JobDetailScreen } from '@/screens/customer/JobDetailScreen';
import { BookingScreen } from '@/screens/customer/BookingScreen';
import { ProfileScreen } from '@/screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerHome">
        {({ navigation }) => (
          <HomeScreen
            onCategoryPress={(categoryId) => navigation.navigate('Booking', { categoryId })}
            onJobPress={(jobId) => navigation.navigate('JobDetail', { jobId })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Booking">
        {({ route, navigation }) => (
          <BookingScreen
            categoryId={route.params.categoryId}
            onBack={() => navigation.goBack()}
            onJobCreated={(jobId) =>
              navigation.replace('JobDetail', { jobId })
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="JobDetail">
        {({ route, navigation }) => (
          <JobDetailScreen
            jobId={route.params.jobId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function JobsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerHome">
        {({ navigation }) => (
          <JobsListScreen
            onJobPress={(jobId) => navigation.navigate('JobDetail', { jobId })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="JobDetail">
        {({ route, navigation }) => (
          <JobDetailScreen
            jobId={route.params.jobId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomerHome">
        {({ navigation }) => (
          <ProfileScreen
            onEditProfile={() => navigation.navigate('EditProfile')}
            onSavedLocations={() => navigation.navigate('SavedLocations')}
            onNotificationSettings={() => navigation.navigate('NotificationSettings')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export function CustomerNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: {
          borderTopColor: colors.neutral[100],
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsStack}
        options={{
          tabBarLabel: t('tabs.jobs'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default CustomerNavigator;
