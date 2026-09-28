package com.kenzelyom.walletlistener;

import java.util.Locale;

final class WalletFilter {
    static boolean isWalletMessage(String sender, String body) {
        String s = (sender == null ? "" : sender).toLowerCase(Locale.ROOT);
        String b = (body == null ? "" : body).toLowerCase(Locale.ROOT);
        String all = normalize(s + " " + b);

        boolean provider = containsAny(all,
                "vodafone", "vf cash", "vfcash", "vf-cash", "فودافون", "ڤودافون",
                "orange cash", "orangecash", "اورنج",
                "etisalat cash", "etisalat", "e& money", "eand", "اتصالات", "اي اند",
                "we pay", "wepay", "وي باي");

        boolean amount =
                containsAny(all, "جنيه", "ج.م", "egp", " le ") ||
                all.matches(".*\\b\\d+(?:\\.\\d{1,2})?\\b.*");

        boolean transfer = containsAny(all,
                "استلم", "استلام", "تم تحويل", "تحويل", "تم اضافه", "تم اضافة",
                "received", "credited", "transfer", "cash transfer");

        return provider && amount && transfer;
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String n : needles) if (haystack.contains(n)) return true;
        return false;
    }

    private static String normalize(String v) {
        return v.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي');
    }

    private WalletFilter() {}
}
