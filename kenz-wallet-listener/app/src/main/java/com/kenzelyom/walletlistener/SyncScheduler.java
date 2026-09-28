package com.kenzelyom.walletlistener;

import android.content.Context;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

final class SyncScheduler {
    private static final String UNIQUE_WORK = "kenz-wallet-sync";

    static void enqueue(Context context) {
        try {
            Constraints constraints = new Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build();

            OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SyncWorker.class)
                    .setConstraints(constraints)
                    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                    .build();

            WorkManager.getInstance(context.getApplicationContext())
                    .enqueueUniqueWork(UNIQUE_WORK, ExistingWorkPolicy.KEEP, request);
        } catch (Throwable t) {
            Prefs.setLastError(context, "SyncScheduler: " + t.getClass().getSimpleName() + " - " + t.getMessage());
        }
    }

    private SyncScheduler() {}
}
