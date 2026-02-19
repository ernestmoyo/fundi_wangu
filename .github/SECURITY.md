# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Fundi Wangu, please report it responsibly.

**Do NOT open a public issue for security vulnerabilities.**

Instead, email: **security@fundiwangu.co.tz**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond within 48 hours and work with you to resolve the issue.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Security Practices

- All user data is encrypted at rest (AES-256)
- NIN numbers are encrypted before storage
- Passwords are not stored (OTP-based authentication)
- All API endpoints use JWT authentication
- Rate limiting on auth and sensitive endpoints
- CORS restricted to known origins in production
- CSP headers enforced on web applications
- Webhook signatures verified with HMAC
- SQL injection prevented via parameterized queries
- Non-root Docker containers in production
