# Hal — better search for everyday answers and Plan

## iPhone demo

| Hal Chat | Hal Voice | Hal+ Plan |
| --- | --- | --- |
| <img src="docs/screenshots/hal-chat.png" width="250" alt="Hal Chat on iPhone"> | <img src="docs/screenshots/hal-voice.png" width="250" alt="Hal Voice on iPhone"> | <img src="docs/screenshots/hal-plan.png" width="250" alt="Hal Plus Plan on iPhone"> |

Presentation screenshots. Chat and Voice timings are illustrative demo timings, not benchmark measurements. Screenshots may reflect earlier result counts.

## What is Hal?

Hal is a mobile AI assistant for everyday questions across Southeast Asia. **Hal Chat and Voice** help users find local places, compare options and get quick answers. **Hal+ Plan** tackles bigger requests such as travel planning and housing grants.

In the case study, Hal serves **3 million monthly users**, with **140,000 Hal+ subscribers**. It handles **40 million quick searches and 600,000 plans a month**. Halcyon is fictional; this repository demonstrates the proposed integration for the exercise.

### Why this matters to the business

Hal already uses Vendor B. Plan drives paid subscriptions, but 26% of plans receive a thumbs-down and 18% of users leave before completion. Cost per answer has risen about 40% this year. The opportunity is to deliver useful, trustworthy plans faster while improving Hal+ margins ahead of the **1 December travel campaign**.

This demo shows how Exa can fit into the existing experience: local context, relevant highlights and a search configuration for each mode.

## Evaluation results

**24 October 2026 · ZingZai · 40 questions**

| Exa FT finding | Result | Why it matters |
| --- | --- | --- |
| Retrieved-evidence quality | **4.53 out of 5; 34 of 40 scored 4 or 5** | More relevant context for Hal’s answers |
| Quick-search p95 | **392 ms** of Exa server time | Measures the search stage, before answer generation |
| Quick-search raw context | **3,039 tokens on average** | 86% less payload than original Exa |
| Modeled monthly cost | **$332k; 14.4% below Vendor B** | About $56k/month potential savings at the stated volume |

Baseline quality judges final answers; FT judges retrieval. Baseline speed is client-timed; FT speed is server-timed. These are encouraging findings, not proof of better final answers or an end-to-end speedup. Vendor C remains the lowest-cost option in this model.

**[Open the results tables, charts and all 40 FT rows](evaluation-results/README.md)** · [Download the PDF](evaluation-results/Search%20provider%20comparison%20FT%20-%20Oct%202026.pdf) · [Download the workbook](evaluation-results/results_exa_fine_tune.xlsx)

The workbook is an earlier local snapshot, preserved unchanged. The README tables and charts use the later report snapshot; see the [source-version note](evaluation-results/README.md#files-and-source-versions).

![Monthly search and model input cost](evaluation-results/charts/monthly-cost.png)

## How to present it

| Step | What to show | What to say |
| --- | --- | --- |
| 1. Start with Hal’s priorities | The business summary above | “Plan drives Hal+ growth. We need better answers, less waiting and sustainable cost.” |
| 2. Show the experience | Chat → Voice → Plan on an iPhone | “The same app supports quick questions and deeper planning, using the user’s location.” |
| 3. Make Plan the main demo | A Philippines persona asking about Japan, then the sources | “Plan needs to answer the whole request and respect the destination. Sources let us inspect the evidence.” |
| 4. Review the evidence | Quality, speed and cost charts | “Configuration improved retrieved evidence and reduced modeled cost. Here is what we measured and what still needs checking in Hal.” |
| 5. Explain the integration, if asked | [Code walkthrough](docs/code-walkthrough.md) | “UI first, Exa Lite and Deep calls next, then the separate Gemini judging script.” |
| 6. Agree the next step | Wei’s production-LLM validation and citation review | “To be ready for 1 December, when do we need to make the provider decision?” |

**Presentation suggestions:** spend most of the demo on Plan, invite one question from the team, and keep the iPhone screenshots as a fallback. Show results before code. Use the quality scores to explain retrieval improvements, and agree an A/B test with Wei to measure the effect on real users.

## The integration in one view

| Mode | User need | Exa API | Results | Highlights |
| --- | --- | --- | --- | --- |
| Chat | Quick everyday answers | `lite` | 5 | `true` |
| Voice | Hands-free answers | `lite` | 4 | `true` |
| Plan | Multi-part research | `deep` | 10 | `true` |

Location context accompanies the query; news uses the supported news category. Retained highlights are capped at approximately **6,000 tokens**. Chat and Voice use ElevenLabs; Plan calls Exa Deep directly. Gemini is used only for evaluation.

## Local setup

Install dependencies with `npm ci`. Add `EXA_API_KEY` and `ELEVENLABS_API_KEY` to the ignored `.env.local` file, then run `npm run setup:voice`. The setup creates a private ElevenLabs agent and an Exa webhook tool, stores the Exa key as a workspace secret, and saves the agent/tool IDs locally. Existing IDs are reused on reruns. Start with `npm run dev` and open http://localhost:3000.

Never prefix credentials with `NEXT_PUBLIC_`. The browser receives only a short-lived signed conversation URL. Chat and Voice require `HAL_ACCESS_CODE` before creating an ElevenLabs session, including locally. Plan calls Exa without an access code; origin checks and rate limits still apply.

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

Raw evaluation results are not included. Supply your own exported results JSON:

```sh
npm run judge -- \
  --input /path/to/search-results.json \
  --output .data/evaluation/retrieval.json \
  --dry-run
```

Replace the input path with your file. It accepts an array or `{ "records": [...] }`,
with `id`, `query` and `response.results[].highlights` (or `sources[].excerpt`).
Remove `--dry-run` to run Gemini judging.

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
