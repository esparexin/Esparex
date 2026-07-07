import {
  RepositoryPlugin,
  RepositoryRuntimeApi,
  PluginManifest
} from "@esparex/repository-plugin-sdk";

/**
 * NextJsPlugin (v1.0)
 *
 * Checks Next.js workspaces for correct page routing configurations.
 *
 * @since v1.0.0
 */
export class NextJsPlugin implements RepositoryPlugin {
  readonly manifest: PluginManifest = {
    id: "repository-plugin-nextjs",
    version: "1.0.0",
    displayName: "Next.js Architecture Plugin",
    description: "Enforces Next.js workspace routing standards and page layouts.",
    category: "frontend",
    runtime: {
      minimum: "1.0.0"
    },
    permissions: ["governance"],
    capabilities: ["governance", "runtime"]
  };

  private runtime?: RepositoryRuntimeApi;

  async initialize(runtime: RepositoryRuntimeApi): Promise<void> {
    this.runtime = runtime;
  }

  async enable(): Promise<void> {
    // Activation logic
  }

  async disable(): Promise<void> {
    // Deactivation logic
  }

  async dispose(): Promise<void> {
    // Cleanup logic
  }

  /**
   * Verifies that pages within Next.js workspaces align to App Router or Pages Router conventions.
   */
  async auditRouting(): Promise<readonly string[]> {
    if (!this.runtime) return [];
    
    const snapshot = this.runtime.snapshot();
    if (!snapshot) return [];

    // Next.js workspaces are those with next framework
    const isNextProject = Object.keys(snapshot.technology).includes("next");
    if (!isNextProject) return [];

    const issues: string[] = [];
    const files = snapshot.repository.files;

    // Check all files under apps/ directories
    for (const file of files) {
      const normalized = file.replace(/\\/g, "/");
      
      // If using App router (app/ folder), files at page levels must be page.tsx/layout.tsx
      if (normalized.includes("/app/") && normalized.endsWith(".tsx")) {
        const isEntry = normalized.endsWith("page.tsx") || normalized.endsWith("layout.tsx") || normalized.endsWith("route.ts");
        const parts = normalized.split("/app/");
        const routePath = parts[1];
        
        // If a file is deep inside app/ but is not page, layout, loading, error, etc.
        // and doesn't sit inside a components/ directory, highlight layout debt
        if (!isEntry && !normalized.includes("/components/") && !normalized.includes("/ui/")) {
          // Check if it's placed as a direct sub-route route handler
          if (routePath.includes("/") && !routePath.startsWith("_")) {
            issues.push(`Non-routing component file placed inside routing directory: "${file}"`);
          }
        }
      }
    }

    return issues;
  }
}
