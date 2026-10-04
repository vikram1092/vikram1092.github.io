# M3 local validation and pickup

Phase 3 M3 — Public connection is implemented locally. Final regression passed **48/48 in 18.0 minutes** and fresh independent browser/visual review passed. **User M3 acceptance is pending.** Nothing from this milestone has been committed, pushed or deployed; the public game remains the accepted M2 release.

## Local playtest route

Open <http://127.0.0.1:4321/bastrop37/>. Continue a completed M2 save (or complete Delivery and Betrayal), then choose **RIDE TO THE RELAY**. Read the three opening lines. Stay grounded in the broad marked corridor for three valid seconds to link relay A. Leaving range or jumping pauses link time; missed approaches lead through a service loop with partial progress retained.

Relay A saves before the drone interception. Steer away from the signalled attack, or use **J / Control** blades. After the drone is destroyed or visibly disengages, connect relay B in the same way. Once the road and linked node have passed clear, read the four closing lines. **PUBLIC ROUTE READY** is the saved M3 ending. Reload/Continue preserves both local relay flags and Omega containment. **TAKE THE RESERVOIR ROAD** reports the M3 boundary; Level 4 is unavailable.

Failure/retry after relay A preserves A and the M2 evidence history. Optional turbo/jump/blades retain their established bindings; neither Overdrive nor a drone kill is required for the relay path. There is no release event in M3.

## Evidence locations

- `earned-completion-save.json`: completed M3 earned in a browser run starting from the historical earned M2 save.
- `fresh-campaign-completion-save.json`: written only by the full fresh L1–L3 test after it succeeds.
- `targeted-results.json`: corrected asset-recovery and actual crash/blade/session-storage checks.
- `full-results.json`: final 48 expected, zero unexpected/skipped/flaky, 1,080.999 seconds.
- `story-geometry.json`, `story-*.png`: four-size long-line geometry/captures. Final full-run captures required playing state, visible receiver and nonnull geometry after resize/Resume; all four final sizes passed.
- `desktop-*.png`, `mobile-complete.png`: actual input-driven mission states.
- `mechanical-check.json`: seven exact dialogue lines, four source-copy hashes and measured metadata; zero discrepancies.
- `review/`: independent review scripts/results and actual browser/visual evidence. Only the reviewer's final report identifies accepted captures.
- `regression-m1/`, `regression-m2/`: current regression outputs; historical release evidence stays unchanged.
- `measure-performance.mjs`, `performance*.json`: renderer/run-context-specific short frame samples and resource bytes. Concurrent forced-software results do not represent physical-device performance.

## Limits and next step

M2's natural Overdrive cap of 55, fixture-only full-charge proof, and unverified optional M2 jump route remain documented in the original release record. M3 adds only the approved 4,597,421-byte environment/relay kit. Human pacing, physical-device and cross-browser performance remain playtest limits.

Independent review found no material blocker; duplicate 8–9px mobile connection labels remain a nonblocking polish observation.

Final isolated samples on Apple M4 / 16 GB, Chromium 153.0.8010.12, 1440×900: browser-default story and active LINKING each measured 60.00 FPS (mean 16.666ms, p95 16.7ms). Explicit ANGLE SwiftShader measured 16.31 FPS story (mean 61.293ms, p95 83.4ms) and 20.53 FPS from link through A completion (mean 48.702ms, p95 50.1ms). The diagnostic WebGL context reports SwiftShader in both configurations; it does not establish the canvas/compositor acceleration path. No hardware-acceleration or sustained-60 claim is made. Each sample contains only 90 frame intervals and no page errors. Default JS heap snapshot is 35.1 MB used / 39.6 MB allocated, not total browser/GPU memory; L3 raster RGBA estimate is 12,582,912 bytes before GPU/other asset costs. Loaded resource payload is 33,247,215 bytes for the M2-to-L3 page journey, including the new 4,597,421-byte L3 kit. Earlier concurrent forced-software data (10.63/12.30 FPS) is retained as load-context evidence, not an isolated target measurement. These short local desktop samples do not establish physical-phone, cross-browser, sustained-load or human-pacing performance.

M3 is ready for user acceptance at the local preview. Publication needs separate explicit approval after acceptance. Do not implement M4/M5. The director handoff records exact ownership, interfaces, current results and pickup instructions.
