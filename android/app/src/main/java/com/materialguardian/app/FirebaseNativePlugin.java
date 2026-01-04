package com.materialguardian.app;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

@CapacitorPlugin(name = "FirebaseNative")
public class FirebaseNativePlugin extends Plugin {

    private static final String TAG = "FirebaseNativePlugin";

    /**
     * Initialize Firebase using runtime config (web-style config fields).
     * Expected call payload:
     * {
     *   apiKey, appId, projectId, storageBucket, messagingSenderId
     * }
     */
    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            // If already initialized, return ok
            if (!FirebaseApp.getApps(getContext()).isEmpty()) {
                JSObject ret = new JSObject();
                ret.put("ok", true);
                ret.put("alreadyInitialized", true);
                call.resolve(ret);
                return;
            }

            String apiKey = call.getString("apiKey");
            String appId = call.getString("appId"); // Firebase web config uses "appId"
            String projectId = call.getString("projectId");
            String storageBucket = call.getString("storageBucket");
            String messagingSenderId = call.getString("messagingSenderId");

            // Minimum required fields to avoid a junk init
            if (appId == null || projectId == null) {
                call.reject("Missing required Firebase config fields (appId, projectId).");
                return;
            }

            FirebaseOptions.Builder b = new FirebaseOptions.Builder()
                    .setApplicationId(appId)
                    .setProjectId(projectId);

            // Optional fields
            if (apiKey != null) b.setApiKey(apiKey);
            if (storageBucket != null) b.setStorageBucket(storageBucket);
            if (messagingSenderId != null) b.setGcmSenderId(messagingSenderId);

            FirebaseApp.initializeApp(getContext(), b.build());

            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("alreadyInitialized", false);
            call.resolve(ret);

        } catch (Exception e) {
            Log.e(TAG, "Firebase initialize failed", e);
            call.reject("Firebase initialize failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void isInitialized(PluginCall call) {
        boolean initialized = !FirebaseApp.getApps(getContext()).isEmpty();
        JSObject ret = new JSObject();
        ret.put("initialized", initialized);
        call.resolve(ret);
    }
}
