package com.materialguardian.app;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import java.util.List;

@CapacitorPlugin(name = "FirebaseNative")
public class FirebaseNativePlugin extends Plugin {

    private static final String TAG = "FirebaseNativePlugin";

    /**
     * Initializes Firebase once using a "web-style" config object.
     *
     * Expected payload:
     *  { config: { appId, apiKey, projectId, storageBucket?, messagingSenderId? } }
     *
     * Returns:
     *  { ok: true, initialized: true, alreadyInitialized: boolean, apps: number }
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            JSObject cfg = call.getObject("config");
            if (cfg == null) {
                call.reject("Missing 'config' object. Expected: { config: { appId, apiKey, projectId, ... } }");
                return;
            }

            String appId = cfg.optString("appId", null);
            String apiKey = cfg.optString("apiKey", null);
            String projectId = cfg.optString("projectId", null);

            // Validate minimum required fields
            if (isBlank(appId) || isBlank(apiKey) || isBlank(projectId)) {
                call.reject("Firebase config must include non-empty appId, apiKey, projectId");
                return;
            }

            // If already initialized, do nothing
            List<FirebaseApp> apps = FirebaseApp.getApps(getContext());
            if (apps != null && !apps.isEmpty()) {
                JSObject ret = new JSObject();
                ret.put("ok", true);
                ret.put("initialized", true);
                ret.put("alreadyInitialized", true);
                ret.put("apps", apps.size());
                call.resolve(ret);
                return;
            }

            FirebaseOptions.Builder b = new FirebaseOptions.Builder()
                    .setApplicationId(appId)
                    .setApiKey(apiKey)
                    .setProjectId(projectId);

            // Optional fields
            String storageBucket = cfg.optString("storageBucket", null);
            if (!isBlank(storageBucket)) b.setStorageBucket(storageBucket);

            String messagingSenderId = cfg.optString("messagingSenderId", null);
            if (!isBlank(messagingSenderId)) b.setGcmSenderId(messagingSenderId);

            FirebaseApp.initializeApp(getContext(), b.build());

            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("initialized", true);
            ret.put("alreadyInitialized", false);
            ret.put("apps", FirebaseApp.getApps(getContext()).size());
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Firebase initialize failed", e);
            call.reject("Firebase initialize failed: " + (e.getMessage() != null ? e.getMessage() : e.toString()), e);
        }
    }

    /**
     * Returns whether Firebase has been initialized in this process.
     * { initialized: boolean, apps: number }
     */
    @PluginMethod
    public void isInitialized(PluginCall call) {
        List<FirebaseApp> apps = FirebaseApp.getApps(getContext());
        JSObject ret = new JSObject();
        ret.put("initialized", apps != null && !apps.isEmpty());
        ret.put("apps", apps == null ? 0 : apps.size());
        call.resolve(ret);
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
