package com.kenzelyom.walletlistener;

import org.junit.Test;
import static org.junit.Assert.*;

public class WalletFilterTest {
    @Test
    public void acceptsVodafoneArabicCreditMessage() {
        assertTrue(WalletFilter.isWalletMessage(
                "Vodafone Cash",
                "تم استلام 59 جنيه من 01000000000"
        ));
    }

    @Test
    public void acceptsOrangeEnglishCreditMessage() {
        assertTrue(WalletFilter.isWalletMessage(
                "Orange Cash",
                "You received EGP 120 from 01200000000"
        ));
    }

    @Test
    public void acceptsEtisalatArabicMessage() {
        assertTrue(WalletFilter.isWalletMessage(
                "Etisalat",
                "تم تحويل مبلغ 100 جنيه إلى محفظتك"
        ));
    }

    @Test
    public void rejectsUnrelatedSms() {
        assertFalse(WalletFilter.isWalletMessage(
                "BANK",
                "Your OTP is 123456"
        ));
    }

    @Test
    public void rejectsWalletPromoWithoutTransfer() {
        assertFalse(WalletFilter.isWalletMessage(
                "Vodafone",
                "استمتع بعرض Vodafone Cash الجديد اليوم"
        ));
    }
}
