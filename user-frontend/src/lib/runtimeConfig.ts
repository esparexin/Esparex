export interface RuntimeConfig {
  apiUrl: string;
  maintenanceMode: boolean;
  minAppVersion: string;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.esparex.in',
  maintenanceMode: false,
  minAppVersion: '1.0.0',
};

let cachedConfig: RuntimeConfig | null = null;

/**
 * Loads runtime configuration from /config/runtime-config.json.
 * This allows updating API endpoints or enabling maintenance mode 
 * without a rebuild/re-deployment of the APK or Web app.
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) return cachedConfig;

  // Only fetch on client side
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  try {
    const response = await fetch('/config/runtime-config.json', { 
      cache: 'no-store',
      // Ensure we don't hang if the file is missing
      signal: AbortSignal.timeout(2000) 
    });
    
    if (!response.ok) throw new Error('Failed to fetch runtime config');
    
    cachedConfig = await response.json();
    return cachedConfig!;
  } catch (error) {
    console.warn('⚠️ Runtime config load failed, using environment fallbacks:', error);
    return DEFAULT_CONFIG;
  }
}
