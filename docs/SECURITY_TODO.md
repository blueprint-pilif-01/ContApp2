ContApp Security To-Do
======================

This file tracks security work required before production.


Transport And Proxy
-------------------

[ ] Put the backend behind HTTPS using Caddy, Traefik, Nginx, Cloudflare, or a
    cloud load balancer.
[ ] Redirect all HTTP traffic to HTTPS.
[ ] Set `APP_REFRESH_COOKIE_SECURE=true` in production.
[ ] Configure production CORS with only real frontend origins.
[ ] Add security headers at the reverse proxy:
    - Strict-Transport-Security
    - X-Content-Type-Options
    - X-Frame-Options or CSP frame-ancestors
    - Referrer-Policy
    - Content-Security-Policy
[ ] Trust `X-Forwarded-For` and `X-Forwarded-Proto` only from the known proxy.
[ ] Log the real client IP after proxy trust is implemented.


Authentication And Sessions
---------------------------

[ ] Use a strong production `APP_JWT_SECRET`.
[ ] Keep access token TTL short.
[ ] Keep refresh token cookies HttpOnly.
[ ] Confirm refresh cookies use Secure and SameSite settings appropriate for
    the production frontend/backend domain setup.
[ ] Keep logout revoking refresh sessions and invalidating current access
    tokens.
[ ] Add rate limiting for login, refresh, and password reset routes.
[ ] Add account lockout or progressive delay after repeated failed login
    attempts.
[ ] Add password reset flow with short-lived single-use tokens.
[ ] Add password policy and breach/common-password checks before real users.
[ ] Add optional two-factor authentication for owners/admins later.


Authorization And Data Isolation
--------------------------------

[ ] Add automated tests for organisation data isolation on every repository.
[ ] Add tests for role/permission denial paths.
[ ] Ensure platform admin actions are audited.
[ ] Ensure normal accounts cannot access platform admin endpoints.
[ ] Add feature entitlement checks for paid extension endpoints.
[ ] Add usage limit checks where feature limits apply.


Database
--------

[ ] Use a private production PostgreSQL network.
[ ] Use least-privilege DB users for app runtime and migrations if possible.
[ ] Enable automated backups.
[ ] Test restore from backup.
[ ] Add monitoring for failed migrations and DB connection failures.
[ ] Avoid storing raw binary signatures in DB long-term if object storage is
    better for scale.
[ ] Review all soft-delete uniqueness rules before production data import.


Files And Object Storage
------------------------

[ ] Store files in S3-compatible object storage.
[ ] Keep object storage buckets private.
[ ] Use signed URLs for controlled file access.
[ ] Validate file size and MIME type.
[ ] Add malware scanning before exposing uploaded files to users.
[ ] Add per-organisation storage limits.


Logging And Monitoring
----------------------

[ ] Do not log passwords, tokens, refresh cookies, or full request bodies.
[ ] Add structured request logging in production.
[ ] Add error tracking.
[ ] Add uptime checks for `/health` and `/ready`.
[ ] Add alerts for 5xx spikes, DB errors, and failed background jobs.
[ ] Keep audit events for security-relevant actions.


Operations
----------

[ ] Keep secrets out of Git.
[ ] Use environment variables or a secret manager for production secrets.
[ ] Build and deploy immutable application artifacts.
[ ] Run migrations as a controlled deployment step.
[ ] Add a rollback plan.
[ ] Add dependency vulnerability scanning.
[ ] Add container/image scanning if deployed with containers.
