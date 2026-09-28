package com.kenzelyom.walletlistener;

import android.Manifest;
import android.app.Activity;
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
    private EditText pairCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildUi());
        refresh();
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    private View buildUi() {
        ScrollView scroll = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(24), dp(20), dp(30));
        root.setBackgroundColor(Color.rgb(250, 247, 239));
        scroll.addView(root);

        TextView brand = text("كنز اليوم", 28, true, Color.rgb(11, 67, 57));
        root.addView(brand);

        TextView title = text("KENZ Wallet Listener", 19, true, Color.rgb(24, 24, 24));
        title.setPadding(0, dp(4), 0, dp(18));
        root.addView(title);

        status = card(root, "حالة الربط");
        permission = card(root, "صلاحية استقبال الرسائل");
        queue = card(root, "الرسائل في الانتظار");
        lastEvent = card(root, "آخر رسالة محفظة");
        lastSync = card(root, "آخر مزامنة");

        TextView note = text(
                "الخصوصية: التطبيق لا يقرأ صندوق رسائلك القديم. يلتقط فقط رسائل SMS الجديدة التي تحمل مؤشرات المحافظ الإلكترونية، ويحفظها مؤقتًا إذا انقطع الإنترنت.",
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

        Button pair = button("ربط هذا الموبايل");
        pair.setOnClickListener(v -> pairDevice());
        root.addView(pair, full());

        Button grant = button("منح صلاحية استقبال SMS");
        grant.setOnClickListener(v -> requestSmsPermission());
        root.addView(grant, full());

        Button test = button("اختبار الاتصال بالسيرفر");
        test.setOnClickListener(v -> testConnection());
        root.addView(test, full());

        Button retry = button("إعادة إرسال الرسائل المعلقة");
        retry.setOnClickListener(v -> {
            SyncJobService.schedule(this);
            Toast.makeText(this, "تم جدولة المزامنة", Toast.LENGTH_SHORT).show();
            refresh();
        });
        root.addView(retry, full());

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
                String name = Build.MANUFACTURER + " " + Build.MODEL + " · " +
                        Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
                JSONObject j = NetworkClient.pair(code, name);
                Prefs.savePair(
                        this,
                        j.getString("device_token"),
                        j.getString("webhook_url"),
                        j.optString("device_id", ""),
                        j.optString("device_label", name)
                );
                runOnUiThread(() -> {
                    pairCode.setText("");
                    Toast.makeText(this, "تم ربط الموبايل بنجاح", Toast.LENGTH_LONG).show();
                    requestSmsPermission();
                    refresh();
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    status.setText("حالة الربط\nفشل الربط. راجع كود الربط وحاول مرة أخرى.");
                    Toast.makeText(this, "تعذر ربط الجهاز", Toast.LENGTH_LONG).show();
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
                    Toast.makeText(this, "الاتصال سليم", Toast.LENGTH_SHORT).show();
                    refresh();
                });
            } catch (Exception e) {
                Prefs.setLastSync(this, "فشل اختبار الاتصال");
                runOnUiThread(() -> {
                    Toast.makeText(this, "تعذر الاتصال بالسيرفر", Toast.LENGTH_LONG).show();
                    refresh();
                });
            }
        });
    }

    private void requestSmsPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                checkSelfPermission(Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECEIVE_SMS}, SMS_PERMISSION);
        } else {
            Toast.makeText(this, "صلاحية SMS مفعلة", Toast.LENGTH_SHORT).show();
            refresh();
        }
    }

    private void refresh() {
        if (status == null) return;
        status.setText("حالة الربط\n" + (Prefs.paired(this) ? "متصل · " + Prefs.deviceLabel(this) : "غير مربوط"));
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
                checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;
        permission.setText("صلاحية استقبال الرسائل\n" + (granted ? "مفعلة ✓" : "غير مفعلة"));
        queue.setText("الرسائل في الانتظار\n" + QueueStore.count(this));
        lastEvent.setText("آخر رسالة محفظة\n" + Prefs.lastEvent(this));
        lastSync.setText("آخر مزامنة\n" + Prefs.lastSync(this));
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
