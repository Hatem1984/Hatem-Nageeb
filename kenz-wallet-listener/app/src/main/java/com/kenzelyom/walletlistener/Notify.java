package com.kenzelyom.walletlistener;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.Manifest;

final class Notify {
    static final String CHANNEL = "kenz_payments";

    static void init(Context c) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager n = c.getSystemService(NotificationManager.class);
            if (n != null) n.createNotificationChannel(
                    new NotificationChannel(CHANNEL, "KENZ Payments", NotificationManager.IMPORTANCE_HIGH)
            );
        }
    }

    static boolean allowed(Context c) {
        return Build.VERSION.SDK_INT < 33 ||
                c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    static void show(Context c, int id, String title, String body) {
        if (!allowed(c)) return;
        init(c);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(c, CHANNEL)
                : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_launcher)
         .setContentTitle(title)
         .setContentText(body)
         .setStyle(new Notification.BigTextStyle().bigText(body))
         .setAutoCancel(true);
        NotificationManager n = (NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (n != null) n.notify(id, b.build());
    }

    private Notify() {}
}
