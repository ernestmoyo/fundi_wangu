import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/** Root stack — decides auth vs main app */
export type RootStackParamList = {
  Auth: undefined;
  CustomerTabs: undefined;
  FundiTabs: undefined;
};

/** Auth flow screens */
export type AuthStackParamList = {
  PhoneEntry: undefined;
  OtpVerify: { phone: string };
  RoleSelect: undefined;
};

/** Customer tab navigator */
export type CustomerTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Profile: undefined;
};

/** Customer nested stack (inside tabs) */
export type CustomerStackParamList = {
  CustomerHome: undefined;
  Booking: { categoryId: string };
  JobDetail: { jobId: string };
  EditProfile: undefined;
  SavedLocations: undefined;
  NotificationSettings: undefined;
};

/** Fundi tab navigator */
export type FundiTabParamList = {
  Dashboard: undefined;
  MyJobs: undefined;
  Profile: undefined;
};

/** Fundi nested stack */
export type FundiStackParamList = {
  FundiHome: undefined;
  FundiJobDetail: { jobId: string };
  EditProfile: undefined;
  SavedLocations: undefined;
  NotificationSettings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type CustomerTabScreenProps<T extends keyof CustomerTabParamList> = BottomTabScreenProps<
  CustomerTabParamList,
  T
>;
