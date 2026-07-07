import { RepositoryInventory } from "@esparex/repository-scanner";
import { BrainProvider, BrainFragment } from "./provider.js";
import { WorkspaceMetadata } from "../schema/index.js";

export class WorkspaceProvider implements BrainProvider {
  readonly id = "workspace-provider";

  async load(inventory: RepositoryInventory): Promise<BrainFragment> {
    const rootIdentity = inventory.identity;
    const workspaces: WorkspaceMetadata[] = rootIdentity.workspaces.map((p: string) => {
      let type: WorkspaceMetadata["type"] = "Tooling";

      if (p.startsWith("apps/")) {
        type = "Presentation";
      } else if (p.startsWith("backend/")) {
        type = "Transport";
      } else if (p === "core") {
        type = "Domain";
      } else if (p === "shared") {
        type = "Shared";
      } else if (p.startsWith("packages/")) {
        type = "Governance";
      }

      return {
        name: p.split("/").pop() || p,
        path: p,
        type,
        version: "1.0.0"
      };
    });

    return {
      namespace: "workspace",
      value: workspaces
    };
  }
}
