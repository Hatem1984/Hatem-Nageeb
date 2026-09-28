package com.kenzelyom.walletlistener;

import android.app.Activity;
import android.os.Build;
import android.content.pm.PackageManager;

final class NotifPermission {
    static void ask(Activity a) {
        if (Build.VERSION.SDK_INT >= 33 &&
            a.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            a.requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 2002);
        }
    }
    private NotifPermission() {}
}
