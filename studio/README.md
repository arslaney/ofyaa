# Ofyaa Stüdyo

`/studio/` owner-only production dashboard with password or email-link login. Backend requires STUDIO_SUPABASE_URL, STUDIO_SUPABASE_ANON_KEY (publishable/anon only), and STUDIO_OWNER_EMAIL. Every private request verifies the Supabase user, confirmed owner email and studio_members membership; database RLS is a separate gate. No service-role key is used.

Apply supabase/migrations/20261020_private_studio.sql once. Seed studio_members from an existing confirmed auth user, then store a sanitized project snapshot in studio_snapshots with id primary. Seed contents are private and never committed. Existing application tables and credentials are unchanged.

GET /api/studio/config returns public SDK configuration. GET /api/studio requires owner login. POST /api/studio/requests accepts versioned, idempotent task/revision requests and records intake only. No agent runs, spend or platform publication starts automatically. Analytics are partial manual observations with unknown likes preserved as null.

The PWA caches only public shell assets. Private API responses are no-store and never enter CacheStorage. Signout clears private DOM and revision notes. Installation is optional through browser UI.

Tests: node --test tests/studio-api.test.mjs studio/auth.test.cjs. Local loopback preview uses the project's separate dashboard-preview.py and local token checks; remote deployments always require authentication.

Deployment check: anonymous private GET is 401, malformed/other-user session is denied, owner can load and record a test task, signout hides all records. An email login redirect must be explicitly allowed for https://ofyaa.com/studio/ in Supabase Auth URL Configuration; never change the existing project's Site URL.
