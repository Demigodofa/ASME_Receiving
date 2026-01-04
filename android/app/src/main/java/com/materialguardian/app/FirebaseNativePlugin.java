package com.materialguardian.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

@CapacitorPlugin(name = "FirebaseNative")
public class FirebaseNativePlugin extends Plugin {

    @PluginMethod
    public void initialize(PluginCall call) {
        JSObject cfg = call.getObject("config");
        if (cfg == null) {
            call.reject("Missing 'config' object");
            return;
        }

        String appId = cfg.optString("appId", null);
        String apiKey = cfg.optString("apiKey", null);
        String projectId = cfg.optString("projectId", null);

        if (appId == null || apiKey == null || projectId == null) {
            call.reject("config must include appId, apiKey, projectId");
            return;
        }

        // Only initialize once
        if (FirebaseApp.getApps(getContext()).isEmpty()) {
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setApplicationId(appId)
                    .setApiKey(apiKey)
                    .setProjectId(projectId)
                    .setStorageBucket(cfg.optString("storageBucket", null))
                    .setGcmSenderId(cfg.optString("messagingSenderId", null))
                    .build();

            FirebaseApp.initializeApp(getContext(), options);
        }

        JSObject ret = new JSObject();
        ret.put("initialized", true);
        call.resolve(ret);
    }
}
