package xyz.chatboxapp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import xyz.chatboxapp.app.plugins.SystemControlPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom Capacitor Plugins BEFORE super.onCreate
        registerPlugin(SystemControlPlugin.class);
        
        super.onCreate(savedInstanceState);
    }
}
