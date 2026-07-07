# Release Policy

1. Releases are triggered by merging `develop` into `main`.
2. Release Drafter automatically handles semantic versioning and changelog generation.
3. Release tags must follow `vX.Y.Z` format.
4. No direct releases to NPM. Internal monorepo artifacts are strictly deployed via CI.
