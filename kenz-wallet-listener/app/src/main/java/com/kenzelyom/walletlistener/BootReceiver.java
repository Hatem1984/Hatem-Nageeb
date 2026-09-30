package com.kenzelyom.walletlistener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Prefs.setLastSync(context, "تم تشغيل الجهاز · فحص الرسائل المعلقة");
            if (QueueStore.count(context) > 0) {
                SyncScheduler.enqueue(context);
            }
        }
    }
}
