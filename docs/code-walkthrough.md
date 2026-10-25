# Code walkthrough

## 1. App — layout → controller → provider

Run `npm run dev` from `hal`, then open http://localhost:3000.

| Open | Say |
| --- | --- |
| `app/page.tsx` | “This only assembles the screen and connects components to actions.” |
| `app/components/conversation.tsx` and `composer.tsx` | “The conversation displays results; the composer handles input. Neither calls an API.” |
| `app/hooks/use-hal.ts` → `send()` | “This coordinates requests, cancellation and conversation state.” |
| `lib/plan-client.mjs` → `app/api/hal/route.ts` | “Plan goes through our server, where the Exa key stays private.” |
| `lib/logic.mjs` → `buildSearch()` | “This builds the Exa request: question, location, objective and highlights.” |
| `lib/search-profiles.mjs` | “Chat gets 5 results, Voice 4, Plan 10.” |

Chat uses `lib/eleven-chat.ts`; Voice uses `app/components/eleven-voice.tsx`.
Both connect through ElevenLabs, whose `web_search` tool calls Exa Lite.
Plan calls Exa Deep through the server route.

**Why the split:** “I can change the UI without changing search, or change a
provider without rewriting the conversation display.”

Other focused files:

- `hal-header.tsx`: country menu and profile button.
- `account-dialogs.tsx`: membership/access dialogs and focus handling.
- `use-hal-location.ts`: device location and reverse geocoding.
- `lib/hal-types.ts`: shared conversation and response types.

Show `.env.example` for key setup; keep the real `.env.local` closed.
Skip the dialog and location internals unless asked.

## 2. Judging — input → Gemini → score

Open `scripts/judge.mjs`. Its numbered comments show the Gemini call and saving
results. The scoring rubric is in `scripts/evaluation/judge-core.mjs`.

Say: **“We give Gemini each question, its expected criteria and retrieved evidence.
It returns a score from 1 to 5 and a reason.”**

Set `GEMINI_API_KEY` and `GEMINI_JUDGE_MODEL` in `.env.local`, then run from `hal`:

```sh
npm run judge -- \
  --input ../outputs/hal-eval-sample/all-location-final.json \
  --output .data/evaluation/retrieval.json \
  --ids q01,q02,q03 --dry-run
```

- Remove `--dry-run` to call Gemini and save scores.
- Remove `--ids q01,q02,q03` to judge all 40.
- Repeat the command to resume after a timeout.
- Open `.data/evaluation/retrieval.json`: show `score` and `judge_note`.

This scores **retrieved evidence**, as in the Exa FT report. To score final Hal
answers, provide saved answers and add `--target answer`. It does not rerun Exa.
The input path above is the saved workspace dataset; use your exported JSON on
another machine. It accepts an array or `{ "records": [...] }`, with `id`,
`query`, and `response.results[].highlights` (or `sources[].excerpt`).
