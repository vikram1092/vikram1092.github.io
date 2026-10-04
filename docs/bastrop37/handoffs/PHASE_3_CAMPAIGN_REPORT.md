# Bastrop37 — completed campaign report

2026-10-04. **All five approved levels are implemented and locally accepted after independent review. Publication is authorized and pending the final commit/push and public verification.** No further level or phase is queued.

## Delivered

| Level | Verified boundary |
|---|---|
| 1 — Delivery | Accepted introduction, traffic clearing, service route and saved delivery approach preserved. |
| 2 — Betrayal | Scan, two equipment receipts, refusal, drone escape and saved recovery-lock escape preserved. |
| 3 — Public Access | Two separate relay connections, interruption/loops/retries and local readiness; Omega remains contained. |
| 4 — Lockdown | Separate spillway receipt, required controller blade pass, visible barrier opening, three-segment bus escort, separate bus safety and Jo ramp, contained ending. |
| 5 — Release | Sequential controller/defender, two distinct five-second uploads with one interception, immediate one-shot released save, closure, approved warm dawn, protected recovery marker and completed campaign. |

A fresh continuous L1–L5 browser journey earned `CP-CAMPAIGN-COMPLETE`, all five completion flags, **50 spoken lines, three equipment receipts and 53 chronological entries**, then reloaded completion. Chapter replay uses separate run state and preserves the completed campaign. All five unlocked replay openings and a complete L5 replay were exercised. New Game requires explicit confirmation; cancellation preserves the save. Old version-1 saves, whole-card dialogue, chronological history, mobile controls, retry, asset failure and truthful session-only storage behavior remain supported.

## Verification

- `npm run build` on the final production source: Astro checked **25 files, zero errors/warnings/hints**, then built successfully. The existing Vite chunk-size advisory remains. [Build evidence](../phase3/m5/build-results.txt).
- Full `npx playwright test`: **80 passed / 1 failed**, no skipped/flaky cases, in **2505.887 seconds**. The final replay case clicked New Game before the title's READY render, causing its confirmation to close during that pending transition. No production state/save defect was found.
- After adding explicit READY synchronization to that driver, **4/4 focused existing replay/reset cases passed** in **142.182 seconds**. Production source/build did not change. This supplies passing evidence for **all 81 distinct scenarios** across the full and focused runs; it is not one clean 81/81 invocation. [Coverage](../phase3/m5/scenario-coverage.json), [full result](../phase3/m5/results-full.json), [focused result](../phase3/m5/results-final-focused.json).
- Independent M4 and M5 browser/visual review: **PASS**. M4's initial shared-road/spillway defects were repaired and re-reviewed; M5's obscured dawn and incorrect traffic-clearing label were repaired and re-reviewed at **1440×900, 1280×720, 1024×768 and 390×844**. Real input earned the required controller, both final drone kills, upload, release and completion. Desktop/mobile crash/reset, touch/multitouch, release reloads and replay isolation were reviewed. A final desktop/mobile, clocked/realtime cancellation probe found no reproducible material UI defect and preserved the exact durable save.
- Bounded data audit: **50/50 dialogue lines, 3/3 records, 39 declared references across 32 unique URLs, seven source-identical new M5 asset files; zero discrepancies**. These are static checks, separate from gameplay/visual review.

## Performance and payload

Apple M4, 16 GiB RAM, Chromium 153.0.8010.12, 1440×900. Each row is a separate **90-frame sample**, collected with no concurrent tests/review browsers.

| Scene | Browser default | Forced ANGLE SwiftShader |
|---|---|---|
| L4 active escort warning | 58.1 fps / 17.22 ms | 14.0 fps / 71.29 ms |
| L5 safe opening | 60.0 fps / 16.67 ms | 19.7 fps / 50.74 ms |
| L5 active upload A | 60.0 fps / 16.67 ms | 20.6 fps / 48.52 ms |

Default p95 frame times were 16.7–16.8 ms; forced-software p95 was 50.1–83.4 ms. Coarse default JS heap readings were 10.0–35.1 MB used. These exclude decoded image, GPU and total browser memory. A diagnostic WebGL context reports SwiftShader even in default mode; that does **not** establish the actual Canvas2D/compositor acceleration path. Results demonstrate short local samples, not sustained 60 fps, physical-phone or cross-browser performance. [Default](../phase3/m5/performance-default.json), [software](../phase3/m5/performance-software.json).

The real-clock network audit loaded all five chapter openings via ordinary replay controls from the separately earned completed save: **77 unique responses, 52,385,474 decoded response-body bytes (about 49.96 MiB)**; resource timing measured 52,377,341 encoded bytes and 52,400,141 transfer bytes on local preview. No page/resource errors; durable save unchanged. These are compressed image/file payloads before image decoding, not RAM. Production compression/cache may differ. The fake-clock fresh journey returned no resource timing entries and is not used as size evidence. [Payload audit](../phase3/m5/loaded-assets.json).

## Limits retained

- Physical-device performance, sustained load, other browser engines and human reading/driving pacing still need playtesting.
- M2 naturally reaches at most 55 Overdrive charge; full-charge activation was verified only in its localhost fixture. The optional jump trace remains an unverified M2 solution.
- A low consequence M4 service-loop floor label can briefly overlap the closed barrier during a miss transition; the safe bypass works.
- Storage blocking truthfully limits persistence to the current session. No claim of durable saving when storage fails.
- No extra level, cast, audio work or 3D migration was introduced. The unrelated `.BASTROP37_PLAN.md.swp` remains untouched.

## Release and pickup

M3 is local commit `7d46d88`; M4 is `f5a8a2c`. M5 final commit, normal master push, Pages workflow and public byte-comparison/smoke verification are next and already authorized. Preserve historical release records and initial failed-review evidence. After successful public verification, record exact revision/workflow/URL, commit the publication record, verify the final remote/deployment and stop. No additional implementation milestone remains.
