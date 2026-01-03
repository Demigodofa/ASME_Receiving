package com.materialguardian.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Install the AndroidX splash screen
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        // Keep on screen for approximately 4 seconds
        final long start = System.currentTimeMillis();
        splashScreen.setKeepOnScreenCondition(new SplashScreen.KeepOnScreenCondition() {
            @Override
            public boolean shouldKeepOnScreen() {
                return System.currentTimeMillis() - start < 4000;
            }
        });
        super.onCreate(savedInstanceState);
    }
}
