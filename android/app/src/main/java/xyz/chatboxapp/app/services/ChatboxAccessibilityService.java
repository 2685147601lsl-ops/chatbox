package xyz.chatboxapp.app.services;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Path;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

// This service must be enabled by the user in Settings -> Accessibility
public class ChatboxAccessibilityService extends AccessibilityService {

    private static final String TAG = "ChatboxAccessService";
    
    // Static instance hack for easy access from Plugin 
    // (In production, use bound services or EventBus/Broadcasts)
    public static ChatboxAccessibilityService instance;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        Log.i(TAG, "Accessibility Service Connected!");
        instance = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Handle window state changes, focus changes etc if needed for context
    }

    @Override
    public void onInterrupt() {
        Log.w(TAG, "Accessibility Service Interrupted");
        instance = null;
    }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    /**
     * Attempts to find a node by text and click it.
     */
    public boolean clickByText(String text) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return false;

        java.util.List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(text);
        for (AccessibilityNodeInfo node : nodes) {
            if (node.isClickable()) {
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                return true;
            } else {
                // If the node itself isn't clickable, let's try its parent
                AccessibilityNodeInfo parent = node.getParent();
                while (parent != null) {
                    if (parent.isClickable()) {
                        parent.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        return true;
                    }
                    parent = parent.getParent();
                }
            }
        }
        return false;
    }

    /**
     * Dispatch an exact coordinates click gesture using AccessibilityService API (Requires API 24+)
     */
    public boolean clickByCoordinates(float x, float y) {
        Path clickPath = new Path();
        clickPath.moveTo(x, y);
        GestureDescription.StrokeDescription clickStroke =
                new GestureDescription.StrokeDescription(clickPath, 0, 100);
        GestureDescription.Builder clickBuilder = new GestureDescription.Builder();
        clickBuilder.addStroke(clickStroke);
        return dispatchGesture(clickBuilder.build(), null, null);
    }

    /**
     * Inputs text into the currently focused Editable node
     */
    public boolean inputTextIntoFocusedNode(String text) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return false;

        AccessibilityNodeInfo focusedNode = findFocusedNode(root);
        if (focusedNode != null && focusedNode.isEditable()) {
            android.os.Bundle arguments = new android.os.Bundle();
            arguments.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
            focusedNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments);
             return true;
        }
        return false;
    }

    private AccessibilityNodeInfo findFocusedNode(AccessibilityNodeInfo node) {
        if (node.isFocused()) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo focused = findFocusedNode(node.getChild(i));
            if (focused != null) return focused;
        }
        return null;
    }
}
