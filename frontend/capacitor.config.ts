import type { CapacitorConfig } from '@capacitor/cli';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const serverUrl =
    process.env.CAPACITOR_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    '';

const config: CapacitorConfig = {
  appId: 'com.esparex.app',
  appName: 'Esparex',
  // This app runs best in Capacitor as a hosted HTTPS wrapper around the
  // deployed Next.js app. `capacitor-shell` only satisfies local copy/sync.
  webDir: 'capacitor-shell',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith('http://'),
        },
      }
    : {}),
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
    Keyboard: {
      resize: "body",
      style: "default",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
