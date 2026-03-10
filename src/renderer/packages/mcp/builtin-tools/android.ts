import { tool } from 'ai'
import { z } from 'zod'
import { registerPlugin } from '@capacitor/core'
import type { AndroidSystemPlugin } from '../../../utils/android-system-plugin'

// Initialize the plugin. It will be undefined on non-Android platforms
const AndroidSystem = registerPlugin<AndroidSystemPlugin>('AndroidSystem');

// Helper to check if we are on Android
const isAndroid = () => {
    return !!AndroidSystem && (window as any).Capacitor?.getPlatform() === 'android';
}

const notSupportedMessage = "This tool is only available on Android physical devices.";

export const openAppTool = tool({
    description: 'Open an Android application by its package name (e.g., com.android.settings).',
    inputSchema: z.object({
        packageName: z.string().describe('The package name of the app to open'),
    }),
    execute: async ({ packageName }) => {
        if (!isAndroid()) return notSupportedMessage;
        try {
            const result = await AndroidSystem.openApp({ packageName });
            return result.success ? `Successfully opened app: ${packageName}` : `Failed to open app: ${result.message}`;
        } catch (e: any) {
            return `Native Plugin Error: ${e.message}`;
        }
    },
})

export const simulateClickTool = tool({
    description: 'Simulate a tap/click on the Android screen. Require Accessibility Service enabled.',
    inputSchema: z.object({
        text: z.string().optional().describe('Text of the UI element to click on'),
        x: z.number().optional().describe('X coordinate to click (if text is not provided)'),
        y: z.number().optional().describe('Y coordinate to click (if text is not provided)'),
    }).refine(data => data.text !== undefined || (data.x !== undefined && data.y !== undefined), {
        message: "Must provide either 'text' or BOTH 'x' and 'y' coordinates.",
    }),
    execute: async ({ text, x, y }) => {
        if (!isAndroid()) return notSupportedMessage;
        try {
            const result = await AndroidSystem.simulateClick({ text, x, y });
            return result.success ? 'Click simulated successfully' : `Click failed: ${result.message}`;
        } catch (e: any) {
            return `Native Plugin Error: ${e.message}`;
        }
    },
})

export const inputTextTool = tool({
    description: 'Input text into the currently focused text field. Require Accessibility Service enabled.',
    inputSchema: z.object({
        text: z.string().describe('Text to input'),
    }),
    execute: async ({ text }) => {
        if (!isAndroid()) return notSupportedMessage;
        try {
            const result = await AndroidSystem.inputText({ text });
            return result.success ? `Successfully inputted text` : `Input failed: ${result.message}`;
        } catch (e: any) {
            return `Native Plugin Error: ${e.message}`;
        }
    },
})

export const screenshotTool = tool({
    description: 'Take a screenshot of the current Android screen and return it as a Base64 image.',
    inputSchema: z.object({}),
    execute: async () => {
        if (!isAndroid()) return notSupportedMessage;
        try {
            const result = await AndroidSystem.screenshot();
            if (result.base64) {
               return `[Image Data: data:image/png;base64,${result.base64}]`;
            }
            return `Screenshot failed: ${result.message}`;
        } catch (e: any) {
             return `Native Plugin Error: ${e.message}`;
        }
    },
})

export const readSmsTool = tool({
    description: 'Read the latest SMS messages from the device. Requires SMS permission.',
    inputSchema: z.object({
       count: z.number().min(1).max(50).default(5).describe('Number of recent messages to read'),
    }),
    execute: async ({ count }) => {
        if (!isAndroid()) return notSupportedMessage;
        try {
            const result = await AndroidSystem.readSms({ count });
            if (result.messages) {
                return JSON.stringify(result.messages, null, 2);
            }
            return `Failed to read SMS: ${result.message}`;
        } catch (e: any) {
             return `Native Plugin Error: ${e.message}`;
        }
    },
})

export const listAppsTool = tool({
    description: 'List installed applications that can be launched.',
    inputSchema: z.object({}),
    execute: async () => {
         if (!isAndroid()) return notSupportedMessage;
         try {
             const result = await AndroidSystem.listApps();
             if (result.apps) {
                 return JSON.stringify(result.apps.slice(0, 100), null, 2); // Limit to 100
             }
             return `Failed to list apps: ${result.message}`;
         } catch (e: any) {
              return `Native Plugin Error: ${e.message}`;
         }
    }
})

export const checkPermissionsTool = tool({
    description: 'Check if all necessary Android system permissions (Accessibility, Screen Capture, SMS) are fully granted.',
    inputSchema: z.object({}),
    execute: async () => {
         if (!isAndroid()) return notSupportedMessage;
         try {
             const result = await AndroidSystem.checkPermissions();
             return result.granted ? 'All permissions granted.' : 'Permissions are missing. Please prompt the user to grant them via UI or ask them to go to Android Settings.';
         } catch (e: any) {
              return `Native Plugin Error: ${e.message}`;
         }
    }
})

export const requestPermissionsTool = tool({
    description: 'Prompt the user to grant necessary Android system permissions (Accessibility, System Alert Window, SMS). Opens Android Settings pages.',
    inputSchema: z.object({}),
    execute: async () => {
         if (!isAndroid()) return notSupportedMessage;
         try {
             await AndroidSystem.requestPermissions();
             return 'Permission requests have been launched. Waiting for user interaction.';
         } catch (e: any) {
              return `Native Plugin Error: ${e.message}`;
         }
    }
})


export const androidBuiltinTools: Record<string, any> = {
    '@system/android': { 
        android_open_app: openAppTool,
        android_simulate_click: simulateClickTool,
        android_input_text: inputTextTool,
        android_screenshot: screenshotTool,
        android_read_sms: readSmsTool,
        android_list_apps: listAppsTool,
        android_check_permissions: checkPermissionsTool,
        android_request_permissions: requestPermissionsTool
    },
}
