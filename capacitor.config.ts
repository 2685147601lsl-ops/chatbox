import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'xyz.chatboxapp.app',
    appName: 'Chatbox',
    webDir: 'release/app/dist/renderer',
    server: {
        androidScheme: 'https'
    }
};

export default config;
