package com.kenzelyom.walletlistener;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SyncJobService extends JobService {
    private static final int JOB_ID = 42019;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    static void schedule(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null) return;
        JobInfo info = new JobInfo.Builder(JOB_ID, new ComponentName(c, SyncJobService.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                .setPersisted(true)
                .setMinimumLatency(1000)
                .setBackoffCriteria(30000, JobInfo.BACKOFF_POLICY_EXPONENTIAL)
                .build();
        js.schedule(info);
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        executor.execute(() -> {
            boolean retry = false;
            int sent = 0;
            try {
                if (!Prefs.paired(this)) {
                    Prefs.setLastSync(this, "الجهاز غير مربوط بالسيرفر");
                    jobFinished(params, false);
                    return;
                }

                JSONArray queue = QueueStore.snapshot(this);
                for (int i = 0; i < queue.length(); i++) {
                    JSONObject event = queue.optJSONObject(i);
                    if (event == null) { sent++; continue; }
                    try {
                        JSONObject response = NetworkClient.sendWalletEvent(this, event);
                        sent++;
                        String state = response.optBoolean("paid", false)
                                ? "تم التحقق واعتماد الطلب"
                                : response.optBoolean("matched", false)
                                    ? "تمت مطابقة التحويل مع طلب"
                                    : "تم إرسال رسالة المحفظة";
                        Prefs.setLastSync(this, state + " · " + Instant.now().toString());
                    } catch (Exception e) {
                        retry = true;
                        Prefs.setLastSync(this, "تعذر الإرسال مؤقتًا؛ محفوظ للمحاولة التالية");
                        break;
                    }
                }
                if (sent > 0) QueueStore.removeFirst(this, sent);
                if (QueueStore.count(this) > 0) retry = true;
            } finally {
                jobFinished(params, retry);
            }
        });
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return QueueStore.count(this) > 0;
    }
}
