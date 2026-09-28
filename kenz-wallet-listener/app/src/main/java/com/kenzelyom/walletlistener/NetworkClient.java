package com.kenzelyom.walletlistener;

import android.content.Context;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

final class NetworkClient {
    static final String DEVICE_API = "https://mjavabuxdhueziecypdy.supabase.co/functions/v1/factory-wallet-device-api";

    static JSONObject pair(String code, String deviceName) throws Exception {
        JSONObject body = new JSONObject();
        body.put("action", "pair");
        body.put("code", code);
        body.put("device_name", deviceName);
        return post(DEVICE_API, body, null);
    }

    static JSONObject deviceStatus(Context c) throws Exception {
        JSONObject body = new JSONObject();
        body.put("action", "status");
        return post(DEVICE_API, body, Prefs.token(c));
    }

    static JSONObject sendWalletEvent(Context c, JSONObject event) throws Exception {
        String endpoint = Prefs.webhook(c);
        if (endpoint.isEmpty()) throw new IOException("device_not_paired");
        return post(endpoint, event, Prefs.token(c));
    }

    private static JSONObject post(String endpoint, JSONObject body, String bearer) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(endpoint).openConnection();
        conn.setRequestMethod("POST");
        conn.setConnectTimeout(12000);
        conn.setReadTimeout(15000);
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        conn.setRequestProperty("Accept", "application/json");
        if (bearer != null && !bearer.isEmpty()) conn.setRequestProperty("Authorization", "Bearer " + bearer);

        byte[] data = body.toString().getBytes(StandardCharsets.UTF_8);
        conn.setFixedLengthStreamingMode(data.length);
        try (OutputStream os = conn.getOutputStream()) { os.write(data); }

        int status = conn.getResponseCode();
        InputStream stream = status >= 200 && status < 300 ? conn.getInputStream() : conn.getErrorStream();
        String text = read(stream);
        conn.disconnect();

        JSONObject out;
        try { out = new JSONObject(text.isEmpty() ? "{}" : text); }
        catch (Exception e) { out = new JSONObject(); }

        if (status < 200 || status >= 300) {
            throw new IOException("HTTP " + status + " " + out.optString("error", "request_failed"));
        }
        return out;
    }

    private static String read(InputStream in) throws IOException {
        if (in == null) return "";
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }

    private NetworkClient() {}
}
