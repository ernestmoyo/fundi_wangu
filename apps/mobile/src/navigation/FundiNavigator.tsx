import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@fundi-wangu/ui-components';
import { useTranslation } from 'react-i18next';
import type { FundiTabParamList, FundiStackParamList } from './types';
import { FundiHomeScreen } from '@/screens/fundi/FundiHomeScreen';
import { FundiJobDetailScreen } from '@/screens/fundi/FundiJobDetailScreen';
import { JobsListScreen } from '@/screens/customer/JobsListScreen';
import { ProfileScreen } from '@/screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator<FundiTabParamList>();
const Stack = createNativeStackNavigator<FundiStackParamList>();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FundiHome">
        {({ navigation }) => (
          <FundiHomeScreen
            onJobPress={(jobId) => navigation.navigate('FundiJobDetail', { jobId })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="FundiJobDetail">
        {({ route, navigation }) => (
          <FundiJobDetailScreen
            jobId={route.params.jobId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MyJobsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FundiHome">
        {({ navigation }) => (
          <JobsListScreen
            onJobPress={(jobId) => navigation.navigate('FundiJobDetail', { jobId })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="FundiJobDetail">
        {({ route, navigation }) => (
          <FundiJobDetailScreen
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
      <Stack.Screen name="FundiHome">
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

export function FundiNavigator() {
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
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: t('tabs.dashboard'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="MyJobs"
        component={MyJobsStack}
        options={{
          tabBarLabel: t('tabs.myJobs'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔧</Text>,
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

export default FundiNavigator;
