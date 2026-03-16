# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Skillr, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email security concerns to: **security@eooo.io**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Assessment:** Within 7 days
- **Fix:** Depends on severity, typically within 30 days

## Scope

This policy covers the Skillr application code in this repository. Third-party dependencies are managed via Composer and npm, and their vulnerabilities should be reported to respective maintainers.

## Default Credentials

The database seeder creates a default admin account (`admin@admin.com` / `password`) for development purposes only. **Change these credentials immediately** in any non-local deployment.
