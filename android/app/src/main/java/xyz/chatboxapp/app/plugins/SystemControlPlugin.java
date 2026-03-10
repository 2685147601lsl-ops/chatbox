package xyz.chatboxapp.app.plugins;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;
import androidx.activity.result.ActivityResult;

import xyz.chatboxapp.app.services.ScreenshotHelper;

@CapacitorPlugin(name = "AndroidSystem")
public class SystemControlPlugin extends Plugin {
    private static final String TAG = "AndroidSystemPlugin";
    private ScreenshotHelper screenshotHelper;

    @Override
    public void load() {
        super.load();
        screenshotHelper = new ScreenshotHelper(getContext());
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null || packageName.isEmpty()) {
            call.reject("Must provide an app package name");
            return;
        }

        try {
            PackageManager pm = getContext().getPackageManager();
            Intent launchIntent = pm.getLaunchIntentForPackage(packageName);
            if (launchIntent != null) {
                getContext().startActivity(launchIntent);
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } else {
                 call.reject("App not found or cannot be launched: "+ packageName);
            }
        } catch (Exception e) {
            call.reject("Failed to open app: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        try {
             // Example: Navigate to Accessibility Settings
             Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
             intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
             getContext().startActivity(intent);

             // Note: In a full robust app, we would also check and request SMS, Location, Overlay here
             JSObject ret = new JSObject();
             ret.put("success", true);
             ret.put("message", "Opened Accessibility Settings. Please enable Chatbox.");
             call.resolve(ret);
        } catch (Exception e) {
             call.reject("Failed to open settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
         JSObject ret = new JSObject();
         // Check accessibility service
         boolean hasA11y = isAccessibilityServiceEnabled();
         
         // For now, if Accessibility is granted, we say true (since screenshots request dynamically)
         ret.put("granted", hasA11y); 
         call.resolve(ret);
    }
    
    private boolean isAccessibilityServiceEnabled() {
        android.view.accessibility.AccessibilityManager am = (android.view.accessibility.AccessibilityManager) getContext().getSystemService(android.content.Context.ACCESSIBILITY_SERVICE);
        if (am == null) return false;
        java.util.List<android.accessibilityservice.AccessibilityServiceInfo> enabledServices = am.getEnabledAccessibilityServiceList(android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
        for (android.accessibilityservice.AccessibilityServiceInfo enabledService : enabledServices) {
            android.content.pm.ServiceInfo enabledServiceInfo = enabledService.getResolveInfo().serviceInfo;
            if (enabledServiceInfo.packageName.equals(getContext().getPackageName()) && enabledServiceInfo.name.equals(xyz.chatboxapp.app.services.ChatboxAccessibilityService.class.getName())) {
                return true;
            }
        }
        return false;
    }

    @PluginMethod
    public void simulateClick(PluginCall call) {
         if (xyz.chatboxapp.app.services.ChatboxAccessibilityService.instance == null) {
              if (isAccessibilityServiceEnabled()) {
                  call.reject("Accessibility Service is enabled in system but memory instance is missing. Please toggle it OFF and ON again in Android Settings.");
              } else {
                  call.reject("Accessibility Service is not running or enabled. Please prompt the user to enable it.");
              }
              return;
         }
         
         String text = call.getString("text");
         Float x = call.getFloat("x");
         Float y = call.getFloat("y");
         
         boolean success = false;
         if (text != null && !text.isEmpty()) {
              success = xyz.chatboxapp.app.services.ChatboxAccessibilityService.instance.clickByText(text);
         } else if (x != null && y != null) {
              success = xyz.chatboxapp.app.services.ChatboxAccessibilityService.instance.clickByCoordinates(x, y);
         } else {
              call.reject("Must provide text or x/y coordinates");
              return;
         }
         
         if (success) {
             JSObject ret = new JSObject();
             ret.put("success", true);
             call.resolve(ret);
         } else {
             call.reject("Failed to simulate click. Target not found or action denied.");
         }
    }
    
    @PluginMethod
    public void inputText(PluginCall call) {
        if (xyz.chatboxapp.app.services.ChatboxAccessibilityService.instance == null) {
              if (isAccessibilityServiceEnabled()) {
                  call.reject("Accessibility Service is enabled in system but memory instance is missing. Please toggle it OFF and ON again in Android Settings.");
              } else {
                  call.reject("Accessibility Service is not running or enabled. Please prompt the user to enable it.");
              }
              return;
         }
         String text = call.getString("text");
         if (text == null || text.isEmpty()) {
             call.reject("Text to input is missing");
             return;
         }
         boolean success = xyz.chatboxapp.app.services.ChatboxAccessibilityService.instance.inputTextIntoFocusedNode(text);
         if (success) {
             JSObject ret = new JSObject();
             ret.put("success", true);
             call.resolve(ret);
         } else {
             call.reject("Failed to input text. No focused editable field found.");
         }
    }

    @PluginMethod
    public void screenshot(PluginCall call) {
        Intent intent = screenshotHelper.getScreenCaptureIntent();
        startActivityForResult(call, intent, "screenCaptureResult");
    }

    @ActivityCallback
    private void screenCaptureResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == android.app.Activity.RESULT_OK && result.getData() != null) {
            screenshotHelper.startProjectionAndTakeScreenshot(result.getResultCode(), result.getData(), new ScreenshotHelper.ScreenshotCallback() {
                @Override
                public void onScreenshotTaken(String base64Image) {
                    JSObject ret = new JSObject();
                    ret.put("base64", base64Image);
                    call.resolve(ret);
                }

                @Override
                public void onError(String error) {
                    call.reject("Screenshot capture failed: " + error);
                }
            });
        } else {
            call.reject("User denied screen capture permission");
        }
    }

    @PluginMethod
    public void readSms(PluginCall call) {
        if (androidx.core.content.ContextCompat.checkSelfPermission(getContext(), android.Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("READ_SMS permission not granted. Please request permissions first.");
            return;
        }

        int count = call.getInt("count", 5);
        JSArray messagesArray = new JSArray();

        try {
            android.database.Cursor cursor = getContext().getContentResolver().query(
                    Uri.parse("content://sms/inbox"),
                    new String[]{"_id", "address", "date", "body"},
                    null, null, "date DESC LIMIT " + count
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    JSObject msg = new JSObject();
                    msg.put("address", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                    msg.put("body", cursor.getString(cursor.getColumnIndexOrThrow("body")));     
                    long dateLong = cursor.getLong(cursor.getColumnIndexOrThrow("date"));
                    msg.put("datetime", new java.util.Date(dateLong).toString());
                    messagesArray.put(msg);
                }
                cursor.close();
            }

            JSObject ret = new JSObject();
            ret.put("messages", messagesArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to read SMS: " + e.getMessage());
        }
    }

    @PluginMethod
    public void listApps(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            Intent intent = new Intent(Intent.ACTION_MAIN, null);
            intent.addCategory(Intent.CATEGORY_LAUNCHER);
            java.util.List<android.content.pm.ResolveInfo> apps = pm.queryIntentActivities(intent, 0);

            JSArray appsArray = new JSArray();
            for (android.content.pm.ResolveInfo resolveInfo : apps) {
                JSObject app = new JSObject();
                app.put("name", resolveInfo.loadLabel(pm).toString());
                app.put("packageName", resolveInfo.activityInfo.packageName);
                appsArray.put(app);
            }

            JSObject ret = new JSObject();
            ret.put("apps", appsArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to list apps: " + e.getMessage());
        }
    }
}
