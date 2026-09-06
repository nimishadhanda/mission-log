# Mission Log

Moksh's daily missions tracker — a static site (`index.html` + `app.js`) backed
by a shared Supabase table, so his check-offs and Mom's approvals sync between
devices.

## One-time setup

1. **Supabase**: create a project at supabase.com, then open the SQL Editor
   and run everything in `supabase-schema.sql`. Then go to
   Project Settings → API and copy the "Project URL" and the "anon public" key
   into `config.js`.
2. **Deploy**: push this folder to a GitHub repo, then import that repo into
   Vercel (Add New → Project → import from GitHub). No build settings needed —
   it's a static site.
3. Open the deployed URL, check an item off, and confirm it shows up under
   "Parent Review" and that approving it persists after a refresh.

## Files

- `index.html` — page structure + all styling
- `app.js` — all app logic (the weekly plan, points, streaks, ranks, rewards,
  and the Supabase load/save/realtime calls)
- `config.js` — your Supabase project URL + anon key (not secret — protected
  by the row-level-security policies in `supabase-schema.sql`)
- `supabase-schema.sql` — run once in the Supabase SQL Editor to create the
  table, seed it with existing data, and set the access policies
