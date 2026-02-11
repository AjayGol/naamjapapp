/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import crashlytics, {
  getCrashlytics,
} from '@react-native-firebase/crashlytics';
import { getMessaging } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';

const crash = getCrashlytics(getApp());
crash.setCrashlyticsCollectionEnabled(true);

ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
});

const messagingInstance = getMessaging(getApp());

messagingInstance.setBackgroundMessageHandler(async remoteMessage => {
  console.log('🌙 [FCM BACKGROUND DATA]');
  console.log(remoteMessage);
});

notifee.onBackgroundEvent(async () => {
  // Required handler to avoid "No task registered" warnings.
});

AppRegistry.registerComponent(appName, () => App);
