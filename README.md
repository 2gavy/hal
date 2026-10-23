# Hal

A working Halcyon interview demo built with Next.js, React, and Exa. Chat is a short-answer experience; Plan is a deeper research experience with three free demo runs and a simulated Hal+ upgrade.

## Run locally

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. No key is needed for sample mode. Add `EXA_API_KEY` to `.env.local` and restart for live Exa responses. Never use a `NEXT_PUBLIC_` variable for credentials.

## Vercel

The repository is ready for the existing Vercel Git integration. Use Next.js framework detection and the repository root. `vercel.json` selects Singapore (`sin1`) for server functions. Add `EXA_API_KEY` in Vercel's environment settings and redeploy. Optionally set `HAL_ACCESS_CODE` and enter the same code in the app's demo settings. Without a key the site remains a working sample demo.

## Walkthrough

- Both modes use the same visitor location from Vercel IP geolocation headers. Location/language labels are read-only.
- Click Chat/Plan, press left/right arrows outside an input, or swipe across the content area.
- Complete three Plan requests: the counter moves 3 → 2 → 1 → 0. The fourth opens the upgrade sheet. Errors and cancellations do not consume runs. Existing results remain visible.
- The upgrade button simulates Hal+; it takes no payment.
- Click Daisy's avatar for sample/live controls and Reset demo.
- Vercel provides approximate city/country (not GPS). Country sets the default answer language: SG English, PH Tagalog, MY Malay, ID Indonesian, TH Thai; other countries use English. Without geo headers, the UI shows Location unavailable and local requests ask for a city where needed. No location permission or third-party IP lookup is needed.
- New conversation clears the current mode's on-device transcript; switching modes preserves it. Transcripts and the demo allowance persist in localStorage.
- Voice uses browser speech recognition where supported; it requires browser microphone permission.

## Exa integration

`app/api/hal/route.ts` keeps the key server-side. Both modes call `/search` with Dynamic Highlights and `outputSchema`. Chat uses `auto`, Plan uses `deep`. Exa supplies the synthesized answer and field-level grounding; the UI links the citations returned by grounding. No second model key is required. User location is included as context while explicit destination names take precedence.

References: [Dynamic Highlights](https://exa.ai/docs/search/highlights), [Deep Search and synthesis](https://exa.ai/docs/search/deep-search).

Search details display measured API + synthesis time, returned API cost when available, and highlight tokens estimated as characters / 4. These are not benchmark scores, true tokenizer counts, or proof of Halcyon's end-to-end latency targets. Sample content is labelled and never substituted for a failed live request.

## Validation

```sh
npm test
npm run build
```

Tests cover the allowance boundary, URL sanitization, and intent/location routing. Live Exa calls require credentials and have not been validated without a key. The benchmark pack is not copied into this public app repo, and no improved evaluation scores are claimed.

## Demo boundaries

This is a presentation prototype, not production billing or entitlement enforcement. Allowance and upgrade are client-side and resettable. The API has a best-effort per-instance rate limiter (10 requests/minute/IP), request validation, a 55-second timeout, and an optional access code. For public paid-API use, configure Vercel rate limiting and provider spend limits; distributed enforcement and account-based entitlements are still needed. There is no shared conversation memory sent to Exa: each live request is currently standalone. SG and PH have tailored demo copy; live answer language follows the detected country.
