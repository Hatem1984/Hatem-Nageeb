package com.kenzelyom.walletlistener;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import org.json.JSONArray;
import org.json.JSONObject;
import java.time.Instant;
import java.util.Locale;

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

                boolean paid = response.optBoolean("paid", false);
                boolean matched = response.optBoolean("matched", false);
                boolean ignored = response.optBoolean("ignored", false);
                int received = response.optInt("received_minor", 0);
                int remaining = response.optInt("remaining_minor", 0);
                String orderRef = response.optString("order_ref", "");

                String state;
                if (paid) {
                    state = "تم التحقق واعتماد الطلب";
                    Notify.show(
                            context, 42003,
                            "تم تأكيد الدفع ✓",
                            (orderRef.isEmpty() ? "" : orderRef + " · ") +
                                    "المبلغ وصل كاملًا والطلب جاهز للتسليم"
                    );
                } else if (matched) {
                    state = "تمت مطابقة التحويل مع طلب";
                    String body = "تم استلام " + money(received);
                    if (remaining > 0) body += " · المتبقي " + money(remaining);
                    Notify.show(
                            context, 42002,
                            "تم استلام دفعة",
                            (orderRef.isEmpty() ? "" : orderRef + " · ") + body
                    );
                } else if (!ignored) {
                    state = "وصل تحويل لكن لم نجد طلبًا مطابقًا";
                    Notify.show(
                            context, 42004,
                            "تحويل يحتاج مراجعة",
                            "وصلت رسالة تحويل لكن لم تتم مطابقتها بطلب مفتوح"
                    );
                } else {
                    state = "تم تجاهل رسالة لا تخص دفعة واردة";
                }

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

    private static String money(int minor) {
        return String.format(Locale.US, "%.2f ج.م", minor / 100.0);
    }
}
