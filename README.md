# Hal

A Next.js demo with short Chat answers, hands-free voice, and deeper Plan research.

## Code walkthrough

[Open the walkthrough](docs/code-walkthrough.md): app integration first, Gemini judging second.

## iPhone demo

| Hal Chat | Hal Voice | Hal+ Plan |
| --- | --- | --- |
| <img src="docs/screenshots/hal-chat.png" width="250" alt="Hal Chat on iPhone"> | <img src="docs/screenshots/hal-voice.png" width="250" alt="Hal Voice on iPhone"> | <img src="docs/screenshots/hal-plan.png" width="250" alt="Hal Plus Plan on iPhone"> |

Presentation screenshots. Chat and Voice timings are illustrative demo timings, not benchmark measurements. Screenshots may reflect earlier result counts.

## Current search defaults

| Mode | Exa search type | Results | Highlights |
| --- | --- | --- | --- |
| Chat | `lite` | 5 | `true` |
| Voice | `lite` | 4 | `true` |
| Plan | `deep` | 10 | `true` |

Browser favicon: `app/icon.png`. iPhone home-screen icon: `app/apple-icon.png`. Original app icon: `public/brand/hal-app-icon.png`. Next.js supplies the icon metadata links automatically.

## Local setup

Install dependencies with `npm ci`. Add `EXA_API_KEY` and `ELEVENLABS_API_KEY` to the ignored `.env.local` file, then run `npm run setup:voice`. The setup creates a private ElevenLabs agent and an Exa webhook tool, stores the Exa key as a workspace secret, and saves the agent/tool IDs locally. Existing IDs are reused on reruns. Start with `npm run dev` and open http://localhost:3000.

Never prefix credentials with `NEXT_PUBLIC_`. The browser receives only a short-lived signed conversation URL. Local development skips the demo access code; hosted ElevenLabs sessions require `HAL_ACCESS_CODE`.

## How the app works

- **Chat / Voice:** ElevenLabs calls Exa Lite through its `web_search` tool. Chat uses a text session; Voice adds transcription and speech. The browser receives a signed session URL, not API keys.
- **Plan:** `app/api/hal/route.ts` calls Exa Deep and returns the answer, cited sources and timing.
- **Location:** city/country and available coordinates accompany the query. Explicit destinations take priority.
- **Context:** highlights are automatic. The local retained-highlight cap is 24,000 characters (approximately 6,000 tokens); it does not limit provider-internal context.

The key integration points have `WALKTHROUGH` comments. The live app uses ElevenLabs for Chat/Voice and Exa for Plan; Gemini is only used for evaluation.

## Judging

Follow the [judging commands](docs/code-walkthrough.md#2-judging--input--gemini--score).
Set `GEMINI_API_KEY` and `GEMINI_JUDGE_MODEL` in `.env.local`. Use `--dry-run` to
validate input without API calls. Output is saved separately and completed
judgments are skipped on resume. Retrieval scores and final-answer scores are
separate evaluation targets.

## Deployment and checks

Configure `EXA_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`,
`ELEVENLABS_AGENT_VERSION_ID` (if pinned) and `HAL_ACCESS_CODE` in Vercel.
Server functions use Singapore (`sin1`).

For an existing ElevenLabs tool, `node scripts/update-search-profiles.mjs` applies
profile changes remotely and updates the local version pin. Sync that pin to
Vercel and start new sessions. This changes shared tool configuration.

Run `npm test` and `npm run build`. Validate microphone/audio on the target phone.

## Demo limits

Membership and the Hal+ upgrade are simulated; no payment is taken. Rate limits
are per-process. Displayed Search latency is Exa server time, not end-to-end
response time. Historical evaluations may use earlier settings.

Feedback is browser-local, not verified unique-user voting. It goes to
`.data/feedback.jsonl` locally and structured server logs in production; connect a
log drain for durable storage. Raw prompts and answers are excluded from feedback.
