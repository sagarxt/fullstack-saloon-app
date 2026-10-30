package com.groomish_now.backend.service.notification;

import java.util.Map;

public interface ExpoPushNotificationService {

    /**
     * Sends an Expo push notification asynchronously.
     *
     * @param expoPushToken The target user's Expo push token (e.g. ExponentPushToken[...])
     * @param title          Notification title
     * @param body           Notification body message
     * @param data           Optional key-value data payload
     */
    void sendPushNotification(String expoPushToken, String title, String body, Map<String, Object> data);
}
