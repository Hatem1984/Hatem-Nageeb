package com.kenzelyom.walletlistener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import org.json.JSONObject;
import java.time.Instant;
import java.util.UUID;

public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) return;

        final PendingResult pending = goAsync();
        try {
            SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
            if (messages == null || messages.length == 0) return;

            String sender = messages[0] == null ? "" : messages[0].getDisplayOriginatingAddress();
            StringBuilder body = new StringBuilder();
            for (SmsMessage m : messages) {
                if (m != null && m.getDisplayMessageBody() != null) body.append(m.getDisplayMessageBody());
            }

            String text = body.toString();
            if (!WalletFilter.isWalletMessage(sender, text)) return;

            JSONObject event = new JSONObject();
            event.put("message", text);
            event.put("sms_sender", sender == null ? "" : sender);
            event.put("received_at", Instant.now().toString());
            event.put("message_id", UUID.randomUUID().toString());

            QueueStore.enqueue(context, event);
            Prefs.setLastEvent(context, "تم التقاط رسالة دفع · " + Instant.now().toString());
            Notify.show(context, 42001, "كنز اليوم", "وصلت رسالة دفع جديدة · جاري التحقق منها");
            SyncScheduler.enqueue(context);
        } catch (Throwable t) {
            Prefs.setLastError(context, "SmsReceiver: " + t.getClass().getSimpleName() + " - " + t.getMessage());
        } finally {
            pending.finish();
        }
    }
}
