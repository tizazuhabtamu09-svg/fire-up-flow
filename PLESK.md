# Deploying to Plesk (static SPA + Google Auth)

## 1. Build the static site

```sh
npm install
npm run build:static
```

This runs the build in SPA mode (no SSR, no Node/Worker server) and writes a
self-contained folder to **`dist-static/`** containing a fully populated
`index.html`, hashed `assets/`, and `.htaccess`. Upload the *contents* of
`dist-static/` into the domain's document root, usually `httpdocs/`.

`npm run build` still produces the SSR/server build; use `build:static` for
Plesk.

The bundled `.htaccess` rewrites every route to `index.html`, so deep links such
as `/workers` or `/oauth-callback` work after a hard refresh — all routing is
handled client-side by TanStack Router. Make sure Plesk's Apache config has
**mod_rewrite** enabled and that `.htaccess` overrides are allowed (Domains →
Apache & nginx Settings). If nginx serves static files directly, enable
"Proxy mode" so Apache handles the rewrites.

## 1b. Environment variables (build time)

Create `.env` (or set them in the shell) before building — they are inlined
into the bundle:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key>
```

`VITE_SUPABASE_PUBLISHABLE_KEY` is accepted as an alias. Both values are public
by design; never put a service-role key in a `VITE_*` variable.

> Note: the admin-only account creation, password reset, avatar signing and
> registration-origin features run as server functions and require the Node
> host. On plain static hosting those admin screens will not work; everything
> else (browsing, auth, bookings, profiles) talks to Supabase directly from the
> browser.

## 2. Import the database (phpMyAdmin)

1. Plesk → **Databases** → *Add Database*; create the database and a user, and
   set the collation to `utf8mb4_unicode_ci` (required for Amharic text).
2. Open **phpMyAdmin** from Plesk and select the new database.
3. Go to the **Import** tab → *Choose File* → pick `database.sql` from the
   project root → Format: **SQL** → **Import**.
4. Verify the tables were created (users, profiles, user_roles, workers,
   applications, bookings, employee_requests, payments, …).
5. Seed the first admin manually in phpMyAdmin: insert a row in `users`, a
   matching row in `profiles`, then a row in `user_roles` with `role = 'admin'`.

Keep the DB host, name, user, and password in server-side environment variables
(Plesk → Websites & Domains → your domain → **Node.js / PHP settings** →
environment variables). Never commit them.

## 3. Google OAuth configuration

All redirect targets are built from `window.location.origin` at runtime, so the
same build works on the preview domain and on production without code changes.

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
*Credentials* → your **OAuth 2.0 Client ID (Web application)**:

**Authorized JavaScript origins**
```
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized redirect URIs**
```
https://yourdomain.com/oauth-callback
https://www.yourdomain.com/oauth-callback
```

Also add your domain under *OAuth consent screen → Authorized domains*, and
enable the scopes `openid`, `.../auth/userinfo.email`, and
`.../auth/userinfo.profile`.

## 4. Post-deploy checklist

- [ ] Deep link (e.g. `https://yourdomain.com/workers`) loads after a refresh
- [ ] HTTPS + "Permanent SEO-safe 301 redirect from HTTP to HTTPS" enabled in Plesk
- [ ] `database.sql` imported and tables visible in phpMyAdmin
- [ ] Google sign-in completes and lands on `/oauth-callback`
- [ ] Admin account can reach `/backoffice`
