# Phase 3 M4 mechanical handoff

2026-10-04. Bounded verification of Level 4 dialogue, equipment-record order, selected source copies, and declared source geometry is complete.

## Completed and verified

- Compared all seven `LOCKDOWN_DIALOGUE` entries with approved Phase 1 L4.01 and L4.04. IDs, text, and speakers match exactly; only Vlad, Omega, and Jo speak. L4.02/L4.03 have no dialogue entries.
- Checked `L4.01-RECORD-01`: title `LOWER ROAD DISCHARGE`, source `SPILLWAY`, lines `LOWER ROAD DISCHARGE` and `AUTH: MAYOR VLAD`. The runtime makes the record available after `L4.01-01`; advancing acknowledges it before `L4.01-02`, matching the Phase 1 sequence.
- Compared all 11 files in `public/bastrop37/assets/lockdown/` with the assigned selected Phase 2 sources. All source/destination SHA-256 values and byte lengths match. All runtime URLs resolve, and the directory contains exactly the expected eleven files.
- Checked raster dimensions and SVG canvases against source records, runtime sizes, anchors, display crops, and layers. The final environment, spillway, barrier, controller and reused anonymous bus metadata match. Water/controller overlay canvas and shared-transform metadata match their bodies.
- Compared the spillway gate crop, environment bay, apron edge, portal floor, and bus placement guides with the revision-v3 manifest and runtime guide constants. All coordinates match. No abandoned/alternate L4 variant appears in the public lockdown directory.
- No discrepancies found. The machine-readable evidence has all eleven sizes, hashes, source paths, dimensions and metadata in [mechanical-check.json](../phase3/m4/mechanical-check.json).

## Limits and next steps

This is file/data verification only. It does not verify actual projection, motion alignment, collision, mission behavior, saves, or visual approval. No build, browser session, or test was run. The director/reviewer should use integrated browser evidence to check the spillway crop in the bay, route/apron alignment, portal floor, bus position, barrier transition, and mobile framing.

## Files changed

- `docs/bastrop37/phase3/m4/mechanical-check.json` (new)
- `docs/bastrop37/handoffs/PHASE_3_M4_MECHANICAL.md` (new)

## Director integration addendum — 2026-10-04

The initial integrated candidate passed 15/15 behavior tests but failed independent visual review for disconnected uphill geometry and transparent spillway backing. Gameplay repaired shared road/actor projection, barrier span, mobile framing and water backing. The repaired build at 10:31:44 passed Astro check (24 files, zero diagnostics), and its full affected matrix passed 15/15 in 480.170 seconds, with no failures, skips or flaky cases. Independent re-review confirms the original material visual findings are resolved, plus mobile failure/retry and simultaneous steer/blades. One low consequence service-loop floor cue can overlap the closed barrier at the miss transition; the safe bypass and return were verified. Final integration acceptance and pickup are recorded in PHASE_3_M4_DIRECTOR.md; the specialist's earlier source-only statements above remain historical.
