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

- Both modes share the selected location. Use the location button for consented device location or the country flags for quick switching; Vercel IP location supplies an initial fallback.
- Click Chat/Plan, press left/right arrows outside an input, or swipe across the content area.
- Complete three Plan requests: the counter moves 3 → 2 → 1 → 0. The fourth opens the upgrade sheet. Errors and cancellations do not consume runs. Existing results remain visible.
- The upgrade button simulates Hal+; it takes no payment.
- Open Profile → Settings → Demo controls for country selection, the live-search access code, and Reset demo.
- The UI defaults to Singapore and English and requests browser location on load. Country sets the default answer language: SG English, PH Tagalog, MY Malay, ID Indonesian, TH Thai; other countries use English. If permission is unavailable, the current default remains. Demo controls allow manual country selection.
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

## Local location controls

On page load Hal requests location directly through the browser permission flow. The location chip retries it. Browsers remember grants/denials, so a native prompt may not appear again. Singapore is the fallback. With consent, the browser sends current coordinates directly to BigDataCloud's free client-side reverse geocoder. BigDataCloud uses location/network signals to improve its geolocation data. Hal retains only the resulting city/country in component state; it neither persists precise coordinates nor sends them to Exa. Denial, timeout and geocoder failures preserve the previous selection. Country flags override both modes and clear a previous city. An in-flight GPS lookup cannot overwrite a newer country selection.

Country toggles update greeting, prompts and voice recognition language. Live Exa receives the selected country/city and answer language. Sample answers are still fixtures, not live localized search results. No location override is persisted across reloads.

For local Exa testing, save `EXA_API_KEY` in the gitignored `.env.local`, restart `npm run dev` if required, then reload the app. Live mode enables automatically when the server reports a key. No API key is accepted or exposed in browser UI. Test with a non-sensitive query before using personal requests.
