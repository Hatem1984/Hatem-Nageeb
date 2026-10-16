package com.kenzelyom.admin.wallet;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * Owner-only QA preview. It does not request SMS permissions, read messages,
 * make network calls, start background jobs or approve payments.
 */
public final class WalletOverviewActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(8, 65, 50));
        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(24, 24, 24, 24);
        body.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        body.setBackgroundColor(Color.rgb(250, 247, 239));

        TextView heading = new TextView(this);
        heading.setText("كنز اليوم | المحافظ");
        heading.setTextSize(23);
        heading.setTextColor(Color.rgb(7, 65, 50));
        body.addView(heading);

        info(body, "معاينة غير تشغيلية",
                "ده تصميم مبدئي لقسم المحافظ داخل KENZ Admin. "
                + "الاستقبال الآلي للرسائل غير متاح في نسخة الاختبار دي. "
                + "مفيش بيانات دفع هتتغير أو تتبعت لأي سيرفر.");
        info(body, "حالة اتصال جهاز المحافظ", "غير مربوط في نسخة QA");
        info(body, "التحويلات الواردة", "هيظهر هنا سجل التحويلات بعد ربط معتمد واختباره.");
        info(body, "تحويلات تحتاج مراجعة",
                "هيتم عرض المبالغ غير المطابقة فقط بعد اختبار التحقق المالي.");
        info(body, "الاعتماد التلقائي", "مغلق؛ التحويلات لا تتحول إلى مدفوعة من الرسائل وحدها.");

        Button back = new Button(this);
        back.setText("العودة إلى الإدارة");
        back.setAllCaps(false);
        back.setMinHeight(52);
        back.setTextColor(Color.WHITE);
        back.setBackgroundTintList(android.content.res.ColorStateList.valueOf(
                Color.rgb(8, 80, 58)));
        back.setOnClickListener(v -> finish());
        body.addView(back);

        ScrollView scroll = new ScrollView(this);
        scroll.addView(body);
        setContentView(scroll);
    }

    private void info(LinearLayout parent, String title, String description) {
        TextView heading = new TextView(this);
        heading.setText(title);
        heading.setTextSize(17);
        heading.setPadding(0, 18, 0, 5);
        heading.setTextColor(Color.rgb(8, 65, 50));
        parent.addView(heading);

        TextView detail = new TextView(this);
        detail.setText(description);
        detail.setTextSize(14);
        detail.setTextColor(Color.rgb(72, 65, 53));
        parent.addView(detail);
    }
}
