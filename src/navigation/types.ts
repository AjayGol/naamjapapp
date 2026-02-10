import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Counter: undefined;
  Stats: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  SelectNaam: undefined;
  History: undefined;
  Goals: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  About: undefined;
  Support: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};
