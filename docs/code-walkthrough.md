# Hal code walkthrough

## 1. UI app: where Exa fits

Start with the running app, then open these files in order. Comments marked
`WALKTHROUGH` identify the integration points.

| Show | File | What to explain |
| --- | --- | --- |
| Search settings | `lib/search-profiles.mjs` | Chat: 5 results; Voice: 4; Plan: 10. All use `highlights: true`. |
| Plan request | `lib/logic.mjs` → `buildSearch()` | Query, city/country, coordinates when known, objective, Deep, highlights and structured answer format. |
| **Actual Exa call** | `app/api/hal/route.ts` → `POST()` | Server sends the request to `https://api.exa.ai/search`, using `EXA_API_KEY`. |
| Answer on screen | `app/api/hal/route.ts` → `resultFor()`; `app/page.tsx` | Exa's answer, cited sources and timing return to Hal. Streaming updates the answer as data arrives. |
| Chat and Voice | `scripts/setup-elevenlabs.mjs`; `lib/search-profiles.mjs` → `configureSearchTool()` | ElevenLabs calls Exa Lite through its `web_search` tool. The tool holds the Exa secret; the session supplies the result count. |

**Talk track:** “We pass the question and location to Exa, choose the search type
and result count for the mode, and request highlights. Hal displays the answer
and sources. Plan calls Exa directly; Chat and Voice use the same search API
through ElevenLabs.”

### Add the API key and run

From the `hal` directory:

```sh
npm ci
# Add EXA_API_KEY and ELEVENLABS_API_KEY to .env.local.
# For a NEW ElevenLabs setup only:
npm run setup:voice
npm run dev
```

Open http://localhost:3000. Existing setups reuse their saved agent IDs; you do
not need to rerun setup for a code walkthrough. Use `.env.example` as the list of
settings; never display the real `.env.local` during the presentation.

For an existing ElevenLabs tool, `node scripts/update-search-profiles.mjs` applies
profile changes remotely and updates the local agent-version pin. It changes
shared tool configuration: use it when deliberately updating that integration,
then sync the version pin to Vercel and start new sessions.

Plan reads the Exa key on the server. Chat/Voice's Exa key is stored as an
ElevenLabs workspace secret during setup. Neither goes into browser code.

**Implementation details worth knowing:** the local 6,000 estimated-token cap
covers retained highlights, not Exa's internal Plan context or ElevenLabs' full
tool response. Server search time is separate from HTTP round-trip time. The
live app does not currently map news intent to a category; that was an evaluation
configuration, not a feature to claim in this walkthrough.

## 2. Judging script: how to run

Entry point: `scripts/judge.mjs`. Rubric and evidence preparation:
`scripts/evaluation/judge-core.mjs`.

The script reads saved results, sends one question and its evidence to Gemini,
and writes a separate JSON report with `score`, `judge_note`, model, usage and
judge latency. It does **not** rerun Exa, generate missing answers, or update the
Google Sheet. Original latency, cost and result files stay unchanged.

### Configure Gemini

Add these to the ignored `.env.local`:

```dotenv
GEMINI_API_KEY=your-key
GEMINI_JUDGE_MODEL=your-available-gemini-model-id
```

Use a model available to your key; you can also pass `--model MODEL_ID`. Keep the
same model and rubric when comparing configurations. Gemini calls may incur usage
charges; the dry run makes no calls and requires no key.

### Validate the input first

This repository includes a small **synthetic** example, for checking the format:

```sh
npm run judge -- --input docs/judge-example.json \
  --output .data/evaluation/example.json --target answer --dry-run
```

For the saved 40-query retrieval run in this workspace, start with three queries:

```sh
npm run judge -- \
  --input ../outputs/hal-eval-sample/all-location-final.json \
  --output .data/evaluation/retrieval.json \
  --target retrieval --ids q01,q02,q03 --dry-run
```

That saved file is workspace data, not bundled with the GitHub app. On another
machine, supply your exported JSON using `--input`.

### Run the judge

Remove `--dry-run` to make Gemini calls:

```sh
npm run judge -- \
  --input ../outputs/hal-eval-sample/all-location-final.json \
  --output .data/evaluation/retrieval.json \
  --target retrieval --ids q01,q02,q03
```

Omit `--ids` to process all records. Run the same command again after a timeout or
quota error: completed, unchanged records are skipped. Use a new output filename
for another model/rubric comparison. Do not run two processes against one output.

### Retrieval vs answer scoring

| Target | Required input | What the score means |
| --- | --- | --- |
| `retrieval` (default) | Question + source excerpts | Whether the evidence covers the request; matches the kind of score used in Exa FT. |
| `answer` | Question + source excerpts + saved final answer | Whether that answer is useful, complete and supported by the supplied excerpts. |

To judge Hal's actual answers, export them with their source excerpts and use
`--target answer`. The script rejects missing answers; it never silently replaces
them with a generated one. An expected answer and its date can be included as
reference criteria. It does not fetch URLs or independently audit entire pages.

Input is a JSON array or `{ "records": [...] }`. Each row needs `id`, `query`, and
`sources` containing `title`, `url`, `excerpt`. Existing saved Exa
`response.results[].highlights` is also accepted. Optional fields: `mode`,
`user_country`, `user_city`, `expected`, `referenceDate`, `answer`.

**Talk track:** “The judge sees one question, its reference criteria, and only its
own evidence. It returns a provisional 1–5 score with a specific reason. We save
the model and inputs so a reviewer can inspect the decision.”
