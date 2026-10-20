# Ofyaa Stüdyo

`/studio/` owner-only production dashboard with password login. Backend requires STUDIO_SUPABASE_URL, STUDIO_SUPABASE_ANON_KEY (publishable/anon only), and STUDIO_OWNER_EMAIL. Every private request verifies the Supabase user, confirmed owner email and studio_members membership; database RLS is a separate gate. No service-role key is used.

Apply supabase/migrations/20261020_private_studio.sql once. Seed studio_members from an existing confirmed auth user, then store a sanitized project snapshot in studio_snapshots with id primary. Seed contents are private and never committed. Existing application tables and credentials are unchanged.

GET /api/studio/config returns public SDK configuration. GET /api/studio requires owner login. POST /api/studio/requests accepts versioned, idempotent task/revision requests and records requests as received. A separately configured Codex heartbeat checks the queue every 15 minutes; this API and browser never execute agents. Video spend and publication still require the existing approvals. Analytics are partial manual observations with unknown likes preserved as null.

The PWA caches only public shell assets. Private API responses are no-store and never enter CacheStorage. Signout clears private DOM and revision notes. Installation is optional through browser UI.

Tests: node --test tests/studio-api.test.mjs studio/auth.test.cjs. Local loopback preview uses the project's separate dashboard-preview.py and local token checks; remote deployments always require authentication.

Deployment check: anonymous private GET is 401, malformed/other-user session is denied, owner can load and record a test task, signout hides all records. Passwordless email-link login is not exposed. Password recovery returns only to the explicitly authorized https://ofyaa.com/studio/ redirect. The recovery form requires a server owner probe and stays locked across reload until the user sets a new password or cancels; the existing Site URL is unchanged.

Default colourful card workspace and calendar: `/studio/#desk` (legacy `?layout=cards` also supported). React/Swapy source, build and accessibility notes: [Card view setup](../docs/studio-cards.md). Classic view is available through `?layout=classic`. Both views display the private worker health and request lifecycle; neither view starts agents.

## Codex bridge

The private snapshot may include `worker: {enabled, mode: "codex_heartbeat", pollIntervalMinutes: 15, lastCheckedAt, automationId}`. Only a valid check in the past 45 minutes marks the worker connected. Missing, stale or disabled records show that state; public config cannot verify a private worker. The heartbeat must update `lastCheckedAt` after a real check. Enabling this field alone does not start a service.

Requests expose `received`, `running`, `completed`, `cancelled`, `blocked`, or `needs_approval`, with nullable `started_at`, `completed_at` and `result_summary` database fields. Apply the separate bridge migration before deploying this adapter. The user session continues to insert only `received` requests with the existing RLS; the bridge uses its existing authorized connector to update work. No privileged key is added to the application. Idempotent retries return the current state of the original request.

While authenticated and visible, the panel refreshes its no-store snapshot every 60 seconds. Hiding the tab stops periodic refresh; signout stops refresh and clears private records, results and notes. Result summaries are displayed as text. Worker checks and next-check times are estimates from the last recorded check, not evidence of continuous execution.


## Scenario feedback and unsent notes

Scenario text is read-only; the labelled feedback/revision textarea accepts notes. A focused textarea keeps its DOM identity, selection and keyboard across minute refreshes. Unsent notes use draft identity rather than snapshot version and are cleared on signout. Full scripts scroll with the page rather than trapping touch scrolling inside a short panel.

`like_script`, `dislike_script` and `archive_script` are durable, idempotent owner-only request actions. Like accepts an optional note with an explicit non-approval default; dislike and archive require a reason. They never change editor status or grant production approval. The separate approval action is enabled only for `awaiting_user_approval` / `editor_approved` source status. The database action constraint must include the three feedback actions before deployment; the nullable `draft_context` column and INSERT grant are required; browser update privileges remain unchanged.

GET paginates the complete request history. It returns `feedbackHistory` with request identity, reason and source title/script/editor reason from immutable server-captured `draft_context` (legacy entries fall back to the canonical snapshot), annotates visible drafts as liked/disliked, and hides archived draft IDs. This is a view derivation: no snapshot is rewritten and no feedback is deleted. The activity view keeps reasons and expandable source text after removal. An archive stays in effect for that draft ID, even if later feedback likes it; revised scripts must receive a new draft ID. The server captures draft context when recording feedback and rejects client-supplied context. Coordinators and writers must read all feedback before writing; retaining older source drafts is still recommended for legacy entries. `sourceSnapshotId` identifies the snapshot supplying source text; the feedback's `snapshotId` identifies the version when the owner recorded the reason.

“Öncelikli · sonraki kontrolde” requests the next coordinator check, typically within about 15 minutes, not instant browser execution. Feedback is saved immediately; agent work remains separately scheduled and subject to existing approval and spend gates.
