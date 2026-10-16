package com.kenzelyom.admin.wallet;

import org.junit.Test;
import static org.junit.Assert.*;

public final class WalletMessageClassifierTest {
    @Test public void acceptsIncomingVodafoneArabic() {
        assertTrue(WalletMessageClassifier.looksLikeIncomingVodafoneCash(
                "Vodafone", "تم استلام مبلغ 199 جنيه على محفظتك. مرجع اختباري 1234"));
    }
    @Test public void acceptsIncomingVodafoneEnglish() {
        assertTrue(WalletMessageClassifier.looksLikeIncomingVodafoneCash(
                "VF Cash", "You received 49 EGP. Synthetic ref 4711"));
    }
    @Test public void rejectsOutgoingTransfer() {
        assertFalse(WalletMessageClassifier.looksLikeIncomingVodafoneCash(
                "Vodafone", "تم خصم وتحويل مبلغ 199 جنيه من محفظتك"));
    }
    @Test public void rejectsProviderMismatches() {
        assertFalse(WalletMessageClassifier.looksLikeIncomingVodafoneCash(
                "BankAlert", "تم استلام مبلغ 199 جنيه في الحساب"));
    }
    @Test public void rejectsAmountlessPromotion() {
        assertFalse(WalletMessageClassifier.looksLikeIncomingVodafoneCash(
                "Vodafone", "تم استلام عرض جديد على المحفظة"));
    }
    @Test public void rejectsNoIncomingEvidence() {
        assertFalse(WalletMessageClassifier.looksLikeIncomingVodafoneCash(
                "Vodafone", "تم تحويل 199 جنيه إلى عميل آخر"));
    }
    @Test public void rejectsEmptyInputs() {
        assertFalse(WalletMessageClassifier.looksLikeIncomingVodafoneCash(null, null));
        assertFalse(WalletMessageClassifier.looksLikeIncomingVodafoneCash("Vodafone", " "));
    }
    @Test public void rejectsContradictoryOutgoingMessage() {
        assertFalse(WalletMessageClassifier.looksLikeIncomingVodafoneCash(
                "Vodafone", "تم استلام طلبك وتم خصم 49 جنيه من محفظتك"));
    }
}
