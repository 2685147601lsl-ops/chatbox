package xyz.chatboxapp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import xyz.chatboxapp.app.plugins.SystemControlPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom Capacitor Plugins
        registerPlugin(SystemControlPlugin.class);
    }
}
