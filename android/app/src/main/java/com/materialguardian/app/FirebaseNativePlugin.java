package com.materialguardian.app;

import android.text.TextUtils;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import java.util.List;

@CapacitorPlugin(name = "FirebaseNative")
public class FirebaseNativePlugin extends Plugin {

    @PluginMethod
    public void initialize(PluginCall call) {
        JSObject config = call.getObject("config", null);
        if (config == null) {
            call.reject("config is required");
            return;
        }

        String apiKey = config.getString("apiKey");
        String appId = config.getString("appId");
        String projectId = config.getString("projectId");
        String storageBucket = config.getString("storageBucket");
        String messagingSenderId = config.getString("messagingSenderId");
        String databaseUrl = config.getString("databaseURL");

        if (isEmpty(apiKey) || isEmpty(appId) || isEmpty(projectId)) {
            call.reject("config.apiKey, config.appId, and config.projectId are required");
            return;
        }

        List<FirebaseApp> apps = FirebaseApp.getApps(getContext());
        if (apps != null && !apps.isEmpty()) {
            call.resolve(result("already-initialized"));
            return;
        }

        FirebaseOptions.Builder options = FirebaseOptions.builder()
            .setApiKey(apiKey)
            .setApplicationId(appId)
            .setProjectId(projectId);

        if (!isEmpty(storageBucket)) {
            options.setStorageBucket(storageBucket);
        }
        if (!isEmpty(messagingSenderId)) {
            options.setGcmSenderId(messagingSenderId);
        }
        if (!isEmpty(databaseUrl)) {
            options.setDatabaseUrl(databaseUrl);
        }

        FirebaseApp app = FirebaseApp.initializeApp(getContext(), options.build());
        if (app == null) {
            call.reject("Failed to initialize Firebase (no default app)");
            return;
        }

        call.resolve(result("initialized"));
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    private JSObject result(String status) {
        JSObject obj = new JSObject();
        obj.put("status", status);
        return obj;
    }
}
