# Agent Rules & Constraints

## 1. No Simulated Git Operations
Never report that a branch was pushed, a tag was pushed, a pull request was created, a pull request was merged, or GitHub Actions passed unless there is direct evidence from Git or GitHub. If any operation fails or cannot be verified, report it explicitly instead of assuming success.
