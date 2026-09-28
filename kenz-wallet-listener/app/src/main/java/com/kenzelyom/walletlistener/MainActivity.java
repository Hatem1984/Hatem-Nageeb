package com.kenzelyom.walletlistener;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONObject;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int SMS_PERMISSION = 2001;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private TextView status;
    private TextView permission;
    private TextView queue;
    private TextView lastEvent;
    private TextView lastSync;
    private TextView lastError;
    private EditText pairCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            setContentView(buildUi());
            refresh();
        } catch (Throwable t) {
            Prefs.setLastError(this, "MainActivity.onCreate: " + t.getClass().getSimpleName() + " - " + t.getMessage());
            Toast.makeText(this, "حصل خطأ في فتح التطبيق. افتحه مرة ثانية لمراجعة آخر خطأ.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdownNow();
    }

    private View buildUi() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        root.setPadding(dp(20), dp(24), dp(20), dp(30));
        root.setBackgroundColor(Color.rgb(250, 247, 239));
        scroll.addView(root);

        TextView brand = text("كنز اليوم", 28, true, Color.rgb(11, 67, 57));
        root.addView(brand);

        TextView title = text("KENZ Wallet Listener · V2", 18, true, Color.rgb(24, 24, 24));
        title.setPadding(0, dp(4), 0, dp(18));
        root.addView(title);

        status = card(root, "حالة الربط");
        permission = card(root, "صلاحية استقبال SMS");
        queue = card(root, "الرسائل في الانتظار");
        lastEvent = card(root, "آخر رسالة دفع");
        lastSync = card(root, "آخر مزامنة");
        lastError = card(root, "آخر خطأ مسجل");

        TextView note = text(
                "الخصوصية: التطبيق لا يقرأ صندوق رسائلك القديم ولا يحتاج READ_SMS. يلتقط فقط رسائل SMS الجديدة بعد التثبيت، ويفلتر رسائل المحافظ قبل إرسال أي شيء للسيرفر.",
                13, false, Color.DKGRAY);
        note.setPadding(0, dp(12), 0, dp(14));
        root.addView(note);

        pairCode = new EditText(this);
        pairCode.setHint("كود ربط الجهاز");
        pairCode.setSingleLine(true);
        pairCode.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS);
        pairCode.setTextSize(16);
        pairCode.setPadding(dp(14), dp(12), dp(14), dp(12));
        root.addView(pairCode, full());

        Button pair = button("1) ربط هذا الموبايل");
        pair.setOnClickListener(v -> pairDevice());
        root.addView(pair, full());

        Button grant = button("2) منح صلاحية استقبال SMS");
        grant.setOnClickListener(v -> requestSmsPermissionSafely());
        root.addView(grant, full());

        Button test = button("3) اختبار الاتصال بالسيرفر");
        test.setOnClickListener(v -> testConnection());
        root.addView(test, full());

        Button retry = button("إعادة إرسال الرسائل المعلقة");
        retry.setOnClickListener(v -> {
            SyncScheduler.enqueue(this);
            Toast.makeText(this, "تمت جدولة المزامنة", Toast.LENGTH_SHORT).show();
            refresh();
        });
        root.addView(retry, full());

        Button battery = secondaryButton("فتح إعدادات البطارية");
        battery.setOnClickListener(v -> {
            try {
                startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
            } catch (Throwable t) {
                startActivity(new Intent(Settings.ACTION_SETTINGS));
            }
        });
        root.addView(battery, full());

        Button reset = secondaryButton("إعادة ضبط ربط الجهاز");
        reset.setOnClickListener(v -> new AlertDialog.Builder(this)
                .setTitle("إعادة ضبط الربط؟")
                .setMessage("سيتم حذف رمز الجهاز المحلي فقط، ولن تُحذف أي طلبات أو مدفوعات.")
                .setNegativeButton("إلغاء", null)
                .setPositiveButton("إعادة ضبط", (d, which) -> {
                    Prefs.clearPair(this);
                    Prefs.clearLastError(this);
                    refresh();
                    Toast.makeText(this, "تمت إعادة ضبط الربط", Toast.LENGTH_SHORT).show();
                })
                .show());
        root.addView(reset, full());

        return scroll;
    }

    private void pairDevice() {
        final String code = pairCode.getText().toString().trim().toUpperCase();
        if (code.isEmpty()) {
            Toast.makeText(this, "اكتب كود الربط أولًا", Toast.LENGTH_SHORT).show();
            return;
        }

        status.setText("حالة الربط\nجاري الربط...");
        executor.execute(() -> {
            try {
                String name = Build.MANUFACTURER + " " + Build.MODEL;
                JSONObject j = NetworkClient.pair(code, name);
                Prefs.savePair(
                        this,
                        j.getString("device_token"),
                        j.getString("webhook_url"),
                        j.optString("device_id", ""),
                        j.optString("device_label", name)
                );
                Prefs.setLastError(this, "لا توجد أخطاء مسجلة");
                runOnUiThread(() -> {
                    pairCode.setText("");
                    Toast.makeText(this, "تم الربط. الآن اضغط منح صلاحية استقبال SMS.", Toast.LENGTH_LONG).show();
                    refresh();
                });
            } catch (Exception e) {
                Prefs.setLastError(this, "Pair: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                runOnUiThread(() -> {
                    status.setText("حالة الربط\nفشل الربط. راجع الكود والإنترنت.");
                    Toast.makeText(this, "تعذر ربط الجهاز", Toast.LENGTH_LONG).show();
                    refresh();
                });
            }
        });
    }

    private void testConnection() {
        if (!Prefs.paired(this)) {
            Toast.makeText(this, "اربط الجهاز أولًا", Toast.LENGTH_SHORT).show();
            return;
        }

        lastSync.setText("آخر مزامنة\nجاري اختبار الاتصال...");
        executor.execute(() -> {
            try {
                JSONObject j = NetworkClient.deviceStatus(this);
                String label = j.optJSONObject("device") != null
                        ? j.optJSONObject("device").optString("label", "") : "";
                Prefs.setLastSync(this, "الاتصال سليم · " + label + " · " + Instant.now().toString());
                runOnUiThread(() -> {
                    Toast.makeText(this, "الاتصال بالسيرفر سليم", Toast.LENGTH_SHORT).show();
                    refresh();
                });
            } catch (Exception e) {
                Prefs.setLastSync(this, "فشل اختبار الاتصال");
                Prefs.setLastError(this, "Connection test: " + e.getClass().getSimpleName() + " - " + e.getMessage());
                runOnUiThread(() -> {
                    Toast.makeText(this, "تعذر الاتصال بالسيرفر", Toast.LENGTH_LONG).show();
                    refresh();
                });
            }
        });
    }

    private void requestSmsPermissionSafely() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                    checkSelfPermission(Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.RECEIVE_SMS}, SMS_PERMISSION);
            } else {
                Toast.makeText(this, "صلاحية استقبال SMS مفعلة", Toast.LENGTH_SHORT).show();
                refresh();
            }
        } catch (Throwable t) {
            Prefs.setLastError(this, "SMS permission: " + t.getClass().getSimpleName() + " - " + t.getMessage());
            Toast.makeText(this, "تعذر فتح إذن SMS. افتح إعدادات التطبيق يدويًا.", Toast.LENGTH_LONG).show();
            try {
                Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(android.net.Uri.parse("package:" + getPackageName()));
                startActivity(i);
            } catch (Throwable ignored) {}
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == SMS_PERMISSION) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            Toast.makeText(this, granted ? "تم تفعيل استقبال SMS" : "لم يتم منح صلاحية SMS", Toast.LENGTH_LONG).show();
            refresh();
        }
    }

    private void refresh() {
        if (status == null) return;
        try {
            status.setText("حالة الربط\n" + (Prefs.paired(this) ? "متصل · " + Prefs.deviceLabel(this) : "غير مربوط"));
            boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
                    checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
            permission.setText("صلاحية استقبال SMS\n" + (granted ? "مفعلة ✓" : "غير مفعلة"));
            queue.setText("الرسائل في الانتظار\n" + QueueStore.count(this));
            lastEvent.setText("آخر رسالة دفع\n" + Prefs.lastEvent(this));
            lastSync.setText("آخر مزامنة\n" + Prefs.lastSync(this));
            lastError.setText("آخر خطأ مسجل\n" + Prefs.lastError(this));
        } catch (Throwable t) {
            Prefs.setLastError(this, "Refresh: " + t.getClass().getSimpleName() + " - " + t.getMessage());
        }
    }

    private TextView card(LinearLayout root, String label) {
        TextView t = text(label + "\n—", 14, false, Color.rgb(38, 38, 38));
        t.setBackgroundColor(Color.WHITE);
        t.setPadding(dp(14), dp(12), dp(14), dp(12));
        LinearLayout.LayoutParams lp = full();
        lp.setMargins(0, 0, 0, dp(9));
        root.addView(t, lp);
        return t;
    }

    private Button button(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(14);
        b.setAllCaps(false);
        b.setTextColor(Color.WHITE);
        b.setBackgroundColor(Color.rgb(11, 67, 57));
        b.setPadding(dp(12), dp(10), dp(12), dp(10));
        return b;
    }

    private Button secondaryButton(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(13);
        b.setAllCaps(false);
        b.setTextColor(Color.rgb(11, 67, 57));
        b.setBackgroundColor(Color.rgb(238, 233, 219));
        b.setPadding(dp(12), dp(10), dp(12), dp(10));
        return b;
    }

    private TextView text(String value, int sp, boolean bold, int color) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setGravity(Gravity.START);
        if (bold) t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        return t;
    }

    private LinearLayout.LayoutParams full() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        lp.setMargins(0, 0, 0, dp(10));
        return lp;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
