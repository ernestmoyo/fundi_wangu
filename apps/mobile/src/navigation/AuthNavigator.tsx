import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { PhoneEntryScreen } from '@/screens/auth/PhoneEntryScreen';
import { OtpVerifyScreen } from '@/screens/auth/OtpVerifyScreen';
import { RoleSelectScreen } from '@/screens/auth/RoleSelectScreen';
import { useAuthStore } from '@/stores/auth.store';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="PhoneEntry">
        {({ navigation }) => (
          <PhoneEntryScreen
            onOtpSent={(phone) => navigation.navigate('OtpVerify', { phone })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="OtpVerify">
        {({ route, navigation }) => (
          <OtpVerifyScreen
            phone={route.params.phone}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="RoleSelect">
        {() => (
          <RoleSelectScreen
            onSelect={() => {
              // Role is set via API — navigation handled by RootNavigator
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default AuthNavigator;
