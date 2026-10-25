# Evaluation results

**Author: ZingZai · FT evaluation: 24 October 2026 · 40 questions (28 quick, 12 Plan)**

## Summary for the meeting

- **Quality:** Exa FT retrieved evidence averaged **4.53 out of 5**. **34 of 40 questions scored 4 or 5**. Plan still has five questions below 4, so focus the production-LLM review there.
- **Context:** quick-search payloads average **3,039 tokens**, down **86%** from original Exa. Highlights reduce the amount of text Hal needs to process.
- **Cost:** approximately **$332k/month**, **14.4% below incumbent Vendor B** (about $56k/month). Vendor C remains cheaper at about $308k.
- **Speed:** recorded FT quick-search p95 is **392 ms**. This is Exa server time; baseline measurements include the client-to-provider call. Do not describe the difference as a verified end-to-end speedup.

FT means **Exa API configuration**, not model-weight fine-tuning. Baseline quality scores assess Hal answers; FT scores assess retrieved evidence. The business opportunity is better context and lower modeled cost; final-answer quality, citation support and peak-load reliability still need validation in Hal.

## Files and source versions

- [FT comparison report](Search%20provider%20comparison%20FT%20-%20Oct%202026.pdf): presentation report, including API examples and evaluation-script instructions.
- [Original local workbook](results_exa_fine_tune.xlsx): retained unchanged as requested. **This is an earlier snapshot and does not match the final report** (for example, q01 is score 3 here versus 5 in the report snapshot).
- The tables and charts below use the **saved 40-row snapshot that generated the FT report**, not the older workbook. No searches or judging were rerun for this README.
- Current app defaults are Chat 5, Voice 4, Plan 10 results with `highlights: true`. Historical run settings varied; these are historical results, not a fresh benchmark of the current defaults.

## Comparison at a glance

| Metric | Vendor B | Vendor C | Exa original | Exa FT |
| --- | --- | --- | --- | --- |
| Average recorded score (out of 5) | 3.75 | 3.33 | 2.95 | 4.53 |
| Quick questions: average score | 3.75 | 3.39 | 3.00 | 4.82 |
| Plan: average score | 3.75 | 3.17 | 2.83 | 3.83 |
| Questions scoring 4 or 5 (out of 40) | 29 | 13 | 16 | 34 |
| Quick search p50 (ms) | 650 | 687 | 1,267 | 355 |
| Quick search p95 (ms) | 1,084 | 959 | 2,431 | 392 |
| Voice search p50 (ms) | 682 | 660 | 1,337 | 345 |
| Plan search p50 (seconds) | 37.8 | 6.1 | 1.9 | 12.1 |
| Raw context tokens per quick search | 2,355 | 1,921 | 22,263 | 3,039 |
| Modeled monthly cost (USD) | $388k | $308k | $584k | $332k |

p50 = median; p95 = inclusive 95th percentile across the recorded questions. One saved result per question; no cold-cache guarantee. Tokens are estimated as characters / 4.

## Quality

![Recorded quality scores](charts/quality.png)

### Exa FT by intent

| Intent | Questions | Average score / 5 | Scored 4 or 5 |
| --- | --- | --- | --- |
| Local | 7 | 4.86 | 7 |
| News | 5 | 5.00 | 5 |
| Travel | 6 | 5.00 | 6 |
| Shopping | 4 | 5.00 | 4 |
| General | 6 | 4.33 | 5 |
| Plan | 12 | 3.83 | 7 |

## Speed

![Search p95 by Chat, Voice and Plan](charts/speed.png)

Search timing excludes answer generation and speech playback. These results cannot establish Hal’s end-to-end targets.

## Cost

![Monthly search and model input cost](charts/monthly-cost.png)

| Monthly cost (USD) | Vendor B | Vendor C | Exa original | Exa FT |
| --- | --- | --- | --- | --- |
| Search | $270,000 | $212,000 | $284,200 | $167,200 |
| Model input (quick only) | $117,611 | $96,360 | $299,956 | $164,645 |
| Total | $387,611 | $308,360 | $584,156 | $331,845 |

Assumptions: 40M quick searches/month, split 75% Chat and 25% Voice; 600k Plan requests/month separately. Model input is $1.25 per million tokens. Search cost uses recorded mean cost by mode; input cost uses recorded retained tokens. Excludes Plan model input, model output, voice generation, retries, geocoding and enterprise discounts.

## Context size

![Raw context tokens per quick search](charts/context.png)

## All 40 Exa FT results

Scores evaluate retrieved evidence. Search time is Exa server searchTime in milliseconds; cost is the recorded search cost per request.

| Query | Intent | Mode | Score / 5 | Search ms | Tokens used | Search USD |
| --- | --- | --- | --- | --- | --- | --- |
| q01 | Local | Chat | 5 | 373.6 | 4,558 | $0.0040 |
| q02 | Local | Chat | 5 | 380.9 | 4,503 | $0.0040 |
| q03 | Local | Voice | 5 | 380.1 | 1,553 | $0.0040 |
| q04 | Local | Chat | 5 | 392.6 | 4,501 | $0.0040 |
| q05 | Local | Chat | 5 | 385.0 | 4,504 | $0.0040 |
| q06 | Local | Voice | 5 | 371.9 | 1,513 | $0.0040 |
| q07 | Local | Chat | 4 | 361.5 | 4,503 | $0.0040 |
| q08 | News | Chat | 5 | 294.9 | 3,072 | $0.0040 |
| q09 | News | Chat | 5 | 324.9 | 3,170 | $0.0040 |
| q10 | News | Voice | 5 | 333.3 | 1,429 | $0.0040 |
| q11 | News | Voice | 5 | 356.8 | 1,563 | $0.0040 |
| q12 | News | Chat | 5 | 335.4 | 3,742 | $0.0040 |
| q13 | Travel | Chat | 5 | 318.7 | 2,285 | $0.0040 |
| q14 | Travel | Chat | 5 | 352.6 | 3,644 | $0.0040 |
| q15 | Travel | Voice | 5 | 322.9 | 1,501 | $0.0040 |
| q16 | Travel | Chat | 5 | 326.1 | 3,507 | $0.0040 |
| q17 | Travel | Chat | 5 | 390.1 | 2,817 | $0.0040 |
| q18 | Travel | Voice | 5 | 340.1 | 1,501 | $0.0040 |
| q19 | Shopping | Chat | 5 | 398.8 | 4,510 | $0.0040 |
| q20 | Shopping | Chat | 5 | 357.0 | 3,171 | $0.0040 |
| q21 | Shopping | Chat | 5 | 378.0 | 4,566 | $0.0040 |
| q22 | Shopping | Voice | 5 | 340.6 | 1,500 | $0.0040 |
| q23 | General | Chat | 5 | 346.2 | 4,554 | $0.0040 |
| q24 | General | Chat | 5 | 390.8 | 3,844 | $0.0040 |
| q25 | General | Chat | 5 | 328.6 | 4,502 | $0.0040 |
| q26 | General | Voice | 5 | 324.5 | 1,501 | $0.0040 |
| q27 | General | Voice | 5 | 350.1 | 1,566 | $0.0040 |
| q28 | General | Voice | 1 | 362.8 | 1,501 | $0.0040 |
| q29 | Plan | Plan | 3 | 21,663.2 | 3,002 | $0.0120 |
| q30 | Plan | Plan | 3 | 13,768.8 | 3,004 | $0.0120 |
| q31 | Plan | Plan | 2 | 15,232.3 | 3,003 | $0.0120 |
| q32 | Plan | Plan | 5 | 15,138.7 | 3,003 | $0.0120 |
| q33 | Plan | Plan | 5 | 8,287.2 | 3,003 | $0.0120 |
| q34 | Plan | Plan | 5 | 10,505.6 | 3,002 | $0.0120 |
| q35 | Plan | Plan | 3 | 14,086.4 | 3,001 | $0.0120 |
| q36 | Plan | Plan | 4 | 14,686.1 | 3,004 | $0.0120 |
| q37 | Plan | Plan | 5 | 8,485.9 | 2,834 | $0.0120 |
| q38 | Plan | Plan | 4 | 8,034.1 | 2,627 | $0.0120 |
| q39 | Plan | Plan | 3 | 4,096.8 | 3,002 | $0.0120 |
| q40 | Plan | Plan | 4 | 7,588.2 | 2,833 | $0.0120 |
