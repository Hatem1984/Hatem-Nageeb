package com.kenzelyom.walletlistener;

import android.app.Application;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;

public class KenzApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        Notify.init(this);
        final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            try {
                StringWriter sw = new StringWriter();
                error.printStackTrace(new PrintWriter(sw));
                String trace = sw.toString();
                if (trace.length() > 1800) trace = trace.substring(0, 1800);
                Prefs.setLastError(this, Instant.now().toString() + "\n" + trace);
            } catch (Throwable ignored) {}
            if (previous != null) previous.uncaughtException(thread, error);
        });
    }
}
