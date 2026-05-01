import type { CapacitorConfig } from '@capacitor/cli';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  'https://esparex.in';

const config: CapacitorConfig = {
  appId: 'in.esparex.app',
  appName: 'Esparex',
  webDir: 'capacitor-shell',
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith('http://'),
  },
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
