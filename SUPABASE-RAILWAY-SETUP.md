# Supabase Auth and Railway PostgreSQL Setup

YayaAiki now uses Supabase Auth in the browser and verifies Supabase bearer tokens on the Railway server. Manus OAuth is no longer required.

## Supabase project settings

Create or use a Supabase project. In Supabase, enable the Google provider under Authentication → Providers, or change `provider: "google"` in `client/src/lib/supabase.ts` to a provider enabled in the project. Add these redirect URLs under Authentication → URL Configuration:

```text
https://yayaaiki.com/
https://yayaaiki-production.up.railway.app/
https://localhost:3000/
```

For Google, create OAuth credentials in Google Cloud Console and set the authorized redirect URI to the Supabase callback shown on the Supabase Google provider page, usually `https://<project-ref>.supabase.co/auth/v1/callback`. Put the Google Client ID and Client Secret into Supabase, not Railway. In Authentication → Providers → Email, enable email/password sign-up and choose whether new users must confirm their email.

Copy the project URL and anon public key from Supabase Project Settings → API.

## Railway variables for the YayaAiki service

Set these variables in Railway → YayaAiki → Variables:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<Supabase anon public key>
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase anon public key>
OWNER_OPEN_ID=<Supabase Auth user UUID for the owner, optional until first login>
OWNER_NAME=Raheem Larry Babatunde
```

`VITE_SUPABASE_ANON_KEY` is intended to be browser-visible. Never expose a Supabase service-role key in Vite variables or commit it to GitHub. `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, and the old Manus OAuth variables are no longer needed by this implementation.

## PostgreSQL migration

The repository now uses `drizzle-orm/node-postgres`, `pg-core`, and the PostgreSQL Drizzle dialect. After Railway variables are set, run from the linked local repository:

```bash
railway run pnpm db:push
```

This generates and applies PostgreSQL migrations to the Railway Postgres service. Then deploy the latest code:

```bash
railway up
railway logs
```

The migration command must finish without `DATABASE_URL is required`, driver, or connection errors. Run it a second time to confirm it is idempotent. The expected application table is `users`; inspect it from Railway's Postgres service or with a PostgreSQL client. `DATABASE_URL` must reference Railway Postgres, not the Supabase project database.

## Verify

Open:

```text
https://yayaaiki.com/
https://yayaaiki.com/for-business
https://yayaaiki.com/start-work
```

A protected workspace should offer Google and email/password login. After login, the server mirrors the Supabase user into the PostgreSQL `users` table.
