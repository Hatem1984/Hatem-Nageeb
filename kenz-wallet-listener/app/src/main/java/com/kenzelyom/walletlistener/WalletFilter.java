package com.kenzelyom.walletlistener;

import java.util.Locale;

final class WalletFilter {
    static boolean isWalletMessage(String sender, String body) {
        String s = (sender == null ? "" : sender).toLowerCase(Locale.ROOT);
        String b = (body == null ? "" : body).toLowerCase(Locale.ROOT);
        String all = s + " " + b;

        boolean provider =
                all.contains("vodafone") || all.contains("vf-cash") || all.contains("vf cash") ||
                all.contains("فودافون") || all.contains("ڤودافون") ||
                all.contains("orange cash") || all.contains("orangecash") ||
                all.contains("اورنج") || all.contains("أورنج") ||
                all.contains("etisalat") || all.contains("e&") || all.contains("eand") ||
                all.contains("اتصالات") || all.contains("إي آند") || all.contains("اي اند") ||
                all.contains("we pay") || all.contains("wepay") || all.contains("وي باي");

        boolean amount = b.contains("جنيه") || b.contains("ج.م") || b.contains("egp");
        boolean transfer =
                b.contains("استلم") || b.contains("استلام") || b.contains("تم تحويل") ||
                b.contains("تحويل") || b.contains("received") || b.contains("transfer");

        return provider && amount && transfer;
    }

    private WalletFilter() {}
}
