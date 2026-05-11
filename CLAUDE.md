# CLAUDE.md

Guidance for AI assistants working in this repository.

## Product

**ofyaa** — a bilingual (Turkish / English) voice journal. The user records a short voice memo; the app transcribes it, runs it through Claude for a non-judgmental reflection (mood, themes, summary, follow-up question), and stores the result in Supabase.

Tagline: *"sesli günlük. biraz küs, biraz dürüst."*

## Repository layout

```
ofyaa/
├── index.html       # Entire frontend: HTML + CSS + vanilla JS (~2.2k lines)
├── api/
│   └── analyze.js   # Vercel Edge Function: transcription + Claude analysis
├── package.json     # Only declares vercel dev/deploy scripts
├── vercel.json      # Edge function config + root rewrite
└── .env.example     # Environment variable template
```

There is **no build step, no bundler, no framework, no test suite**. Everything ships as static files plus one serverless function.

## Architecture

### Frontend (`index.html`)

- Single HTML file containing all markup, CSS (custom design tokens), and JS. No external bundling.
- View routing is DOM-class based: `switchView(name)` toggles `.active` on `#view-<name>` elements. Views: `auth-loading`, `auth`, `auth-sent`, `home`, `recording`, `processing`, `insight`, `history`, `settings`.
- Global mutable state lives in a single `state` object (`index.html:1494`).
- Supabase JS client is loaded from CDN (`@supabase/supabase-js@2`); the project URL and **anon** key are hardcoded at `index.html:1253-1254` (public by design — RLS enforces access on the server).
- i18n: dictionary at `I18N` (`index.html:1263`), helper `t(key)`, language persisted in `localStorage.ofyaa_lang` and mirrored to `user_profiles.language` in Supabase.
- Recording flow:
  1. `startRecording()` opens `getUserMedia` + `MediaRecorder` + Web Speech API (`SpeechRecognition`).
  2. On stop, `decideAndProcess()` picks one of two paths:
     - **Transcript path** — if Web Speech produced enough words, POST JSON `{ transcript, duration, language }` to `/api/analyze`.
     - **Audio path** — otherwise POST `multipart/form-data` with the recorded `audio/webm` blob (used as fallback for Firefox / older iOS where Web Speech isn't available).
  3. `runAnalysis()` renders the result in the `insight` view; user chooses save (insert into `recordings`) or discard.
- Mock fallback: if `/api/analyze` fails and `USE_MOCK_FALLBACK = true` (`index.html:1925`), the UI fabricates a plausible insight from `MOCK_POOLS` and shows a "mock mode" toast. This is **intentional** for graceful degradation — keep the toggle if you touch this code.

### Backend (`api/analyze.js`)

Vercel Edge runtime function (`runtime: 'edge'`, `maxDuration: 30`). Handles two content types on `POST`:

| Content-Type | Path | Source field |
| --- | --- | --- |
| `application/json` | Skip transcription; analyze the supplied `transcript` directly. | `webspeech` |
| `multipart/form-data` | Transcribe the `audio` blob via **Deepgram** (`nova-2`), then analyze. | `deepgram` |

Analysis: calls Claude (model `claude-haiku-4-5-20251001`) with a hand-tuned system prompt (TR or EN variant) and parses the JSON response into `{ mood, themes, summary, question }`. Error messages are bilingual via the `ERRORS` table.

### Data model (Supabase)

Tables referenced from the client (schemas live in the Supabase project, not in this repo):

- `recordings` — `user_id`, `duration_seconds`, `language`, `source`, `transcript`, `mood`, `themes` (array), `summary`, `question`, `created_at`. RLS expected to scope by `user_id`.
- `user_profiles` — `user_id`, `language`.

Auth uses Supabase magic-link OTP (`signInWithOtp`).

## Environment variables

Set in Vercel project settings (and `.env.local` for `vercel dev`):

- `ANTHROPIC_API_KEY` — **required**. Used by `analyze.js` to call Claude.
- `DEEPGRAM_API_KEY` — required for the audio-upload (Firefox / fallback) path. Without it, audio-path requests fail with a transcription error; the JSON transcript path still works.

> ⚠️ `.env.example` still mentions `OPENAI_API_KEY` (Whisper) — that is **stale**. The current code uses Deepgram, not Whisper. When editing, fix `.env.example` to match.

The Supabase URL and anon key are **hardcoded** in `index.html`, not read from env.

## Development workflow

```bash
npm run dev      # vercel dev — local server with edge function emulation
npm run deploy   # vercel --prod
```

For pure frontend tweaks (no `/api/analyze` changes), any static server pointed at the repo root will load the app — but the API call will 404, so the mock fallback will kick in.

There is no linter, formatter, or test runner configured. Do not invent one without being asked.

## Known gotchas

1. **`vercel.json` rewrite mismatch.** `vercel.json` rewrites `/` to `/duru-app-connected.html`, but the only HTML file is `index.html`. Vercel falls back to serving `index.html` for `/` since the rewrite target 404s — but this is fragile. If you touch routing, decide whether to fix `vercel.json` or rename the file. Don't silently "fix" one side without checking the deployed behavior.
2. **`.env.example` is out of date** (OpenAI vs Deepgram, above).
3. **Supabase anon key in source** is intentional — it's the public anon key, secured by RLS policies. Do not treat it as a leaked secret.
4. **Edge runtime constraints.** `api/analyze.js` runs on Vercel Edge, not Node. No Node built-ins, no filesystem, `fetch` only. Keep dependencies zero.
5. **Web Speech API is Chrome/Edge/Safari only.** Firefox and old iOS fall through to the audio + Deepgram path. Both paths must keep working.
6. **Single-file frontend.** Resist the urge to extract modules unless the user asks. The whole app is designed to be one file.

## Conventions for edits

- **Stay vanilla.** No React, no bundler, no TypeScript, no npm dependencies for the frontend.
- **Match the tone.** Turkish copy is intentionally lowercase, conversational, slightly melancholic. English mirrors that. Don't sanitize it into corporate-speak. See the `PROMPT_TR` / `PROMPT_EN` system prompts and the `I18N` table for the voice.
- **Bilingual everywhere.** Any new user-facing string must be added under both `tr` and `en` in `I18N`, and any new error key must exist in both `ERRORS.tr` and `ERRORS.en` in `analyze.js`.
- **Keep the mock fallback path alive** unless explicitly asked to remove it.
- **Don't touch the Claude model ID** (`claude-haiku-4-5-20251001`) or response schema (`mood`, `themes`, `summary`, `question`) without coordinating both `analyze.js` and `renderInsight()` in `index.html`.
- Commit messages in this repo have been terse (e.g. "Update analyze.js"). When committing, prefer a slightly more descriptive message focused on *why*, but you don't need to match the existing style.

## Branch policy

Per the harness instructions for this session: develop on `claude/add-claude-documentation-88uC1` (or whatever branch the task specifies). Do not push to `main` without explicit permission. Do not open a PR unless asked.
