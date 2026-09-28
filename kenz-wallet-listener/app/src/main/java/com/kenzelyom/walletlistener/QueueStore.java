package com.kenzelyom.walletlistener;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

final class QueueStore {
    private static final String PREF = "kenz_wallet_queue";
    private static final String KEY = "items";
    private static final int MAX = 100;

    private static SharedPreferences p(Context c) {
        return c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    static synchronized void enqueue(Context c, JSONObject item) {
        JSONArray old = snapshot(c);
        JSONArray next = new JSONArray();
        int start = Math.max(0, old.length() - (MAX - 1));
        for (int i = start; i < old.length(); i++) next.put(old.opt(i));
        next.put(item);
        p(c).edit().putString(KEY, next.toString()).apply();
    }

    static synchronized JSONArray snapshot(Context c) {
        String raw = p(c).getString(KEY, "[]");
        try { return new JSONArray(raw); }
        catch (Exception e) { return new JSONArray(); }
    }

    static synchronized void removeFirst(Context c, int count) {
        JSONArray old = snapshot(c);
        JSONArray next = new JSONArray();
        for (int i = Math.max(0, count); i < old.length(); i++) next.put(old.opt(i));
        p(c).edit().putString(KEY, next.toString()).apply();
    }

    static int count(Context c) { return snapshot(c).length(); }

    private QueueStore() {}
}
