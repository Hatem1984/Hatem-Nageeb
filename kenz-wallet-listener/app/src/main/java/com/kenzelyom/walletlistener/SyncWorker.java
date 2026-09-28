package com.kenzelyom.walletlistener;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import org.json.JSONArray;
import org.json.JSONObject;
import java.time.Instant;

public class SyncWorker extends Worker {
    public SyncWorker(@NonNull Context appContext, @NonNull WorkerParameters params) {
        super(appContext, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();
        if (!Prefs.paired(context)) {
            Prefs.setLastSync(context, "الجهاز غير مربوط بالسيرفر");
            return Result.success();
        }

        JSONArray queue = QueueStore.snapshot(context);
        if (queue.length() == 0) {
            Prefs.setLastSync(context, "لا توجد رسائل معلقة");
            return Result.success();
        }

        int sent = 0;
        try {
            for (int i = 0; i < queue.length(); i++) {
                JSONObject event = queue.optJSONObject(i);
                if (event == null) {
                    sent++;
                    continue;
                }

                JSONObject response = NetworkClient.sendWalletEvent(context, event);
                sent++;

                String state = response.optBoolean("paid", false)
                        ? "تم التحقق واعتماد الطلب"
                        : response.optBoolean("matched", false)
                            ? "تمت مطابقة التحويل مع طلب"
                            : response.optBoolean("ignored", false)
                                ? "تم تجاهل رسالة غير مكتملة"
                                : "تم إرسال رسالة المحفظة";

                Prefs.setLastSync(context, state + " · " + Instant.now().toString());
            }

            if (sent > 0) QueueStore.removeFirst(context, sent);
            return QueueStore.count(context) == 0 ? Result.success() : Result.retry();

        } catch (Exception e) {
            if (sent > 0) QueueStore.removeFirst(context, sent);
            Prefs.setLastSync(context, "تعذر الإرسال مؤقتًا؛ الرسائل محفوظة");
            Prefs.setLastError(context, "SyncWorker: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return Result.retry();
        }
    }
}
