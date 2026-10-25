# Code walkthrough

## 1. App — show these in order

Run `npm run dev` from `hal`, then open http://localhost:3000.

| Open | Point to | Say |
| --- | --- | --- |
| `lib/search-profiles.mjs` | `SEARCH_PROFILES` | “Chat returns 5 results, Voice 4, Plan 10. All request highlights.” |
| `lib/logic.mjs` | `buildSearch()` | “We include the question, location and objective. Plan uses Deep; Chat and Voice use Lite.” |
| `app/api/hal/route.ts` | `fetch('https://api.exa.ai/search', ...)` | “Here is the Plan API call. The Exa key stays on the server.” |
| Same file | `resultFor()` | “We return the answer, cited sources and timing to the app.” |

For Chat/Voice, explain: **Hal → ElevenLabs → Exa Lite → answer.**
Only open `scripts/setup-elevenlabs.mjs` if asked how the tool is connected:
`web_search` points to the same Exa search endpoint.

Show `.env.example` to explain where keys go. Keep the real `.env.local` closed.
Skip the UI markup, authentication and streaming internals during the walkthrough.

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
