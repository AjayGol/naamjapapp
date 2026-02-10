/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async () => {
  // Required handler to avoid "No task registered" warnings.
});

AppRegistry.registerComponent(appName, () => App);
