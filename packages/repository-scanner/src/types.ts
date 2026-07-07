export interface RepositoryInventory {
  readonly identity: {
    readonly name: string;
    readonly version: string;
    readonly packageManager: string;
    readonly workspaces: readonly string[];
  };
  readonly dependencies: {
    readonly [packageName: string]: {
      readonly [dependencyName: string]: string;
    };
  };
  readonly git: {
    readonly branch: string;
    readonly commit: string;
    readonly repositoryHash: string;
    readonly inventoryHash: string;
  };
  readonly files: readonly string[];
}

export interface ScannerPlugin {
  readonly id: string;
  discover(workspaceRoot: string): Promise<Partial<RepositoryInventory>>;
}
export type ImmutableInventory = Readonly<RepositoryInventory>;
