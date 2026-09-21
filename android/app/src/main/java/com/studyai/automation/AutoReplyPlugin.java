package com.studyai.automation;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AutoReply")
public class AutoReplyPlugin extends Plugin {
    private static final String PREFS = "study_ai_automation";

    private boolean hasNotificationAccess() {
        String enabledListeners = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        if (TextUtils.isEmpty(enabledListeners)) return false;
        ComponentName component = new ComponentName(getContext(), NotificationListenerService.class);
        return enabledListeners.contains(component.flattenToString());
    }

    @PluginMethod
    public void isNotificationAccessEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", hasNotificationAccess());
        call.resolve(result);
    }

    @PluginMethod
    public void openNotificationAccess(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void setServiceEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("active", enabled).apply();
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void getServiceStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("active", false));
        result.put("accessGranted", hasNotificationAccess());
        call.resolve(result);
    }

    @PluginMethod
    public void syncConfig(PluginCall call) {
        JSObject config = call.getObject("config");
        if (config == null) {
            call.reject("config is required");
            return;
        }
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("config", config.toString()).apply();
        JSObject result = new JSObject();
        result.put("synced", true);
        call.resolve(result);
    }
}
