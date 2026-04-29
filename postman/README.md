# ContApp2 Postman

Import both files into Postman:

- `ContApp2 API.postman_collection.json`
- `ContApp2 Local.postman_environment.json`

Local setup:

```bash
make migrate-up
make seed-db
make backend
```

Select the `ContApp2 Local` environment before running requests.

Seed credentials:

```text
Admin: admin@contapp.local / password
User:  owner@demo.contapp.local / password
```

The login requests save `admin_access_token` and `user_access_token` into the
selected Postman environment. Refresh/logout use Postman's cookie jar, so run
them after the matching login request.
