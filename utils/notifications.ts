import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }
    return true;
}

export async function schedulePushNotification(title: string, body: string, triggerDate: Date) {
    if (triggerDate.getTime() <= Date.now()) {
        return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
            sound: 'default',
        },
        trigger: {
            date: triggerDate,
            type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
    });
    return id;
}

export async function cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
}
