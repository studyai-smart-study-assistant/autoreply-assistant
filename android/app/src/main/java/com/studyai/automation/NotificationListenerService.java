package com.studyai.automation;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Reads supported messaging notifications and executes notification-level direct replies. */
public class NotificationListenerService extends android.service.notification.NotificationListenerService {
    private static final String PREFS = "study_ai_automation";
    private static final String[] TARGET_PACKAGES = {"com.whatsapp", "com.whatsapp.w4b", "com.instagram.android"};

    @Override public void onNotificationPosted(StatusBarNotification notification) {
        if (notification == null || !isTargetPackage(notification.getPackageName())) return;
        if (!getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean("active", true)) return;

        Notification source = notification.getNotification();
        Bundle extras = source.extras;
        String title = extras.getString(Notification.EXTRA_TITLE, "Unknown sender");
        CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
        if (TextUtils.isEmpty(text)) return;

        String packageName = notification.getPackageName();
        if (!isTargetEnabled(packageName)) return;

        String message = text.toString();
        ReplyAction action = findReplyAction(source);
        if (action == null) return;

        String reply = resolveTemplateReply(message);
        if (TextUtils.isEmpty(reply)) return;
        if (sendDirectReply(action, reply)) {
            persistEvent(title, packageName, message, reply);
        }
    }

    private boolean isTargetPackage(String packageName) {
        for (String target : TARGET_PACKAGES) if (target.equals(packageName)) return true;
        return false;
    }

    private boolean isTargetEnabled(String packageName) {
        try {
            String raw = getSharedPreferences(PREFS, MODE_PRIVATE).getString("config", "{}");
            JSONObject config = new JSONObject(raw);
            JSONObject targets = config.optJSONObject("targets");
            if (targets == null) return true;
            if (packageName.startsWith("com.instagram")) return targets.optBoolean("instagram", true);
            return packageName.equals("com.whatsapp") || packageName.equals("com.whatsapp.w4b") ? targets.optBoolean("whatsapp", true) : false;
        } catch (Exception ignored) { return true; }
    }

    private ReplyAction findReplyAction(Notification notification) {
        int count = NotificationCompat.getActionCount(notification);
        for (int i = 0; i < count; i++) {
            NotificationCompat.Action action = NotificationCompat.getAction(notification, i);
            if (action == null || action.actionIntent == null) continue;
            RemoteInput[] inputs = action.getRemoteInputs();
            if (inputs != null && inputs.length > 0) return new ReplyAction(action.actionIntent, inputs[0]);
        }
        return null;
    }

    private String resolveTemplateReply(String message) {
        try {
            String raw = getSharedPreferences(PREFS, MODE_PRIVATE).getString("config", "{}");
            JSONObject config = new JSONObject(raw);
            JSONArray rules = config.optJSONArray("rules");
            String lower = message.toLowerCase(Locale.ROOT);
            if (rules != null) {
                for (int i = 0; i < rules.length(); i++) {
                    JSONObject rule = rules.getJSONObject(i);
                    if (!rule.optBoolean("enabled", true)) continue;
                    String[] triggers = rule.optString("trigger", "").split(",");
                    for (String trigger : triggers) if (lower.contains(trigger.trim().toLowerCase(Locale.ROOT))) return rule.optString("response", "");
                }
            }
            if ("skip".equals(config.optString("fallback", "ai"))) return "";
        } catch (Exception ignored) { }
        return "";
    }

    private boolean sendDirectReply(ReplyAction action, String reply) {
        try {
            Bundle input = new Bundle();
            input.putCharSequence(action.remoteInput.getResultKey(), reply);
            Intent fillIn = new Intent();
            RemoteInput.addResultsToIntent(new RemoteInput[]{action.remoteInput}, fillIn, input);
            action.pendingIntent.send(this, 0, fillIn);
            return true;
        } catch (PendingIntent.CanceledException ignored) { return false; }
    }

    private void persistEvent(String sender, String packageName, String message, String reply) {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putLong("last_reply_at", System.currentTimeMillis()).apply();
        // The web layer reads its own local log. This compact event marker is available for a future sync channel.
        android.util.Log.i("StudyAI", "Replied to " + sender + " via " + packageName + ": " + message + " -> " + reply);
    }

    private static class ReplyAction {
        final PendingIntent pendingIntent;
        final RemoteInput remoteInput;
        ReplyAction(PendingIntent pendingIntent, RemoteInput remoteInput) { this.pendingIntent = pendingIntent; this.remoteInput = remoteInput; }
    }
}
