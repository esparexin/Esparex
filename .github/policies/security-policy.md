# Internal Security Policy

1. All secrets must be scanned by Gitleaks prior to merge.
2. CodeQL must pass without Critical/High vulnerabilities.
3. Third-party GitHub Actions must be trusted or pinned via Dependabot.
4. No sensitive configuration files may be committed.
