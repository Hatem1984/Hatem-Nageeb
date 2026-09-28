package com.kenzelyom.walletlistener;

import android.content.Context;
import android.content.SharedPreferences;

final class Prefs {
    private static final String NAME = "kenz_wallet_prefs";

    private static SharedPreferences p(Context c) {
        return c.getSharedPreferences(NAME, Context.MODE_PRIVATE);
    }

    static void savePair(Context c, String token, String webhook, String deviceId, String label) {
        p(c).edit()
                .putString("token", token)
                .putString("webhook", webhook)
                .putString("device_id", deviceId)
                .putString("device_label", label)
                .apply();
    }

    static void clearPair(Context c) {
        p(c).edit()
                .remove("token")
                .remove("webhook")
                .remove("device_id")
                .remove("device_label")
                .apply();
    }

    static String token(Context c) { return p(c).getString("token", ""); }
    static String webhook(Context c) { return p(c).getString("webhook", ""); }
    static String deviceLabel(Context c) { return p(c).getString("device_label", "غير مربوط"); }

    static void setLastEvent(Context c, String v) { p(c).edit().putString("last_event", v).apply(); }
    static String lastEvent(Context c) { return p(c).getString("last_event", "لا توجد رسائل دفع ملتقطة بعد"); }

    static void setLastSync(Context c, String v) { p(c).edit().putString("last_sync", v).apply(); }
    static String lastSync(Context c) { return p(c).getString("last_sync", "لم تتم مزامنة بعد"); }

    static void setLastError(Context c, String v) { p(c).edit().putString("last_error", v == null ? "" : v).apply(); }
    static String lastError(Context c) { return p(c).getString("last_error", "لا توجد أخطاء مسجلة"); }
    static void clearLastError(Context c) { p(c).edit().remove("last_error").apply(); }

    static boolean paired(Context c) { return !token(c).isEmpty() && !webhook(c).isEmpty(); }

    private Prefs() {}
}
