package com.kenzelyom.admin.wallet;

import java.util.Locale;

/**
 * Classifies synthetic wallet SMS candidates for future opt-in review.
 * NEVER used as evidence of payment; the server must independently verify every payment.
 * No Android SMS permissions, storage, network calls, or notification side effects.
 */
public final class WalletMessageClassifier {
    private WalletMessageClassifier() {}

    public static boolean looksLikeIncomingVodafoneCash(String sender, String message) {
        if (message == null || message.trim().isEmpty()) return false;
        String s = normalize(sender) + " " + normalize(message);
        boolean provider = any(s, "vodafone", "vf cash", "vfcash", "vf-cash", "فودافون", "ڤودافون");
        boolean amount = any(s, "جنيه", "ج.م", "egp", " e.g.p ");
        boolean numeric = s.matches("(?s).*\\d+(?:[.,]\\d{1,2})?.*");
        boolean incoming = any(s, "استلم", "استلام", "تم اضافه", "تم اضافة", "اضيف", "تم ايداع",
                "received", "credited", "payment received", "تم استقبال");
        boolean outgoing = any(s, "تم خصم", "تم ارسال", "ارسلت", "قمت بتحويل",
                "تم سحب", "debited", "you sent", "transferred from your wallet");
        return provider && amount && numeric && incoming && !outgoing;
    }

    private static boolean any(String text, String... values) {
        for (String v : values) if (text.contains(v)) return true;
        return false;
    }

    private static String normalize(String text) {
        if (text == null) return "";
        return text.toLowerCase(Locale.ROOT)
                .replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي');
    }
}
