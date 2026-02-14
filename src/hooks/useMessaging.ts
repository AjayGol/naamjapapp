import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

export const useMessaging = () => {
  useEffect(() => {
    // if (!isNavReady) {
    //   return;
    // }

    // const notificationCount = async () => {
    //   const token = await getStorageData('Token');
    //   Api.setToken(token);
    //   try {
    //     let notificationCountresponseJson = await Api.withToken({
    //       url: configJSON.getUnreadNotificationCount,
    //       method: configJSON.httpGetMethod,
    //       headers: {
    //         'Content-Type': configJSON.httpApiContentType,
    //       },
    //     });
    //     let responseJson = JSON.parse(notificationCountresponseJson);
    //     if (responseJson) {
    //       if (responseJson && responseJson.unread_notification) {
    //         let temp = responseJson.unread_notification;
    //         contextType.authContext.setNotificationCount(temp);
    //       }
    //       if (responseJson.length !== 0) {
    //         contextType.authContext.setShowDot(true);
    //       } else {
    //         contextType.authContext.setShowDot(false);
    //       }
    //     }
    //   } catch (error) {
    //     console.log('errorerrorerrornotificationCount2', error);
    //   }
    // };

    const setupMessaging = async () => {
      try {
        await messaging().registerDeviceForRemoteMessages();

        let enabled = false;

        // 🔔 Android 13+ (API 33+) requires POST_NOTIFICATIONS
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const status = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );

          if (status === PermissionsAndroid.RESULTS.GRANTED) {
            enabled = true;
          }
        } else {
          // 🔔 iOS & Android < 13
          const authStatus = await messaging().requestPermission();
          enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        }

        // Fallback check if already allowed
        if (!enabled) {
          const oldStatus = await messaging().hasPermission?.();
          if (
            oldStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            oldStatus === messaging.AuthorizationStatus.PROVISIONAL
          ) {
            enabled = true;
          }
        }

        if (enabled) {
          getTokenAndListeners().then();
        }
      } catch (error) {
        console.log('setupMessaging Error:', error);
      }
    };

    const getTokenAndListeners = async () => {
      // CleverTap.setDebugLevel(3);
      // CleverTap.registerForPush();
      //
      // let fcmToken = await messaging().getToken();
      // if (fcmToken) {
      //   await setStorageData('fcmToken', fcmToken);
      // }
      //
      // CleverTap.addListener(
      //   CleverTap.CleverTapPushNotificationClicked,
      //   (event: any) => {
      //     ManageNavigation(event);
      //   },
      // );
      //
      // CleverTap.createNotificationChannelGroup('opiGoChannel', 'opiGoGroup');

      // 🔔 App opened from background
      messaging().onNotificationOpenedApp((message: any) => {
        if (message?.data?.keysandvalues) {
          const data = JSON.parse(message.data.keysandvalues);
          // ManageNavigation(data);
        }
        // ✅ Update badge count when user taps notification
        // notificationCount();
      });

      // 🔔 Foreground notification
      messaging().onMessage(async message => {
        console.log('@@@@Message', message);
        // if (message?.data?.screen_name) {
        //   // Toast.show({
        //   //   type: 'success',
        //   //   text1: message.notification?.title ?? message.notification?.body,
        //   //   onPress: () => {
        //   //     ManageNavigation(message.data);
        //   //     Toast.hide();
        //   //   },
        //   // });
        // }
        // ✅ Update badge count immediately on foreground push
        // notificationCount().then();
      });

      // 🔔 App launched from quit state
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification?.data?.keysandvalues) {
        // @ts-ignore
        console.log(
          'Push Notification data====>',
          JSON.parse(initialNotification.data.keysandvalues),
        );
        // const data = JSON.parse(initialNotification.data.keysandvalues);
        // ManageNavigation(data).then();
        // ✅ Update badge count when app launched by notification
        // notificationCount().then();
      }
    };

    setupMessaging().then();
  }, []);
};
