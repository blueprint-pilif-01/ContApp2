ContApp Production Deployment
=============================

This document describes the recommended production shape for ContApp.


Recommended Topology
--------------------

Use HTTPS at the reverse proxy or load balancer. The Go backend should stay a
plain HTTP service on the private server/network.

```text
Browser / Mobile App
        |
      HTTPS
        |
Reverse Proxy / Load Balancer
Caddy / Traefik / Nginx / Cloudflare / AWS ALB
        |
Internal HTTP
        |
ContApp Go API
        |
PostgreSQL / Object Storage / Workers
```

For the first production deployment, the preferred simple option is:

```text
VPS + Caddy + Let's Encrypt
```

Caddy can automatically issue and renew TLS certificates and redirect HTTP to
HTTPS. The backend does not need to serve TLS directly.


Backend Runtime
---------------

The Go API can listen internally:

```text
127.0.0.1:8080
```

The public API should be exposed by the proxy:

```text
https://api.yourdomain.com
```

Example proxy mapping:

```text
https://api.yourdomain.com -> http://127.0.0.1:8080
```


Required Production Environment
-------------------------------

Use production-specific environment values:

```env
APP_ENV=production
APP_HTTP_ADDR=127.0.0.1:8080
APP_API_BASE_PATH=/api/v1
APP_REFRESH_COOKIE_SECURE=true
APP_CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
APP_JWT_SECRET=<strong-random-secret>
DATABASE_URL=<production-postgres-url>
```

The frontend should call the HTTPS API URL:

```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```


Caddy Example
-------------

Example Caddyfile:

```text
api.yourdomain.com {
    reverse_proxy 127.0.0.1:8080
}
```

For the frontend:

```text
app.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
}
```

The exact frontend target depends on how the frontend is deployed. If the
frontend is built as static files, Caddy can serve those files directly.


Production Notes
----------------

- Keep PostgreSQL private. Do not expose it publicly.
- Keep the Go API private when possible. Only the reverse proxy should expose
  public ports 80 and 443.
- Run migrations before starting a new backend version.
- Store uploaded files in object storage, not inside the application container.
- Keep local Docker Compose as a development tool, not the final production
  deployment model.
- Add backups before accepting real customer data.
