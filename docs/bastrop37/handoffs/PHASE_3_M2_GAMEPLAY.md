# Phase 3 M2 gameplay handoff

Historical M2 approval snapshot: authorization statements below describe the M2 approval/status request. Subsequent authority is recorded in [BUILD_STATUS](../BUILD_STATUS.md); its later M3 authorization supersedes the pending-M3 gate recorded here. This update does not change that newer authority or concurrent M3 work.

2026-09-28 implementation record, updated 2026-10-01 after user approval. Scope: Delivery-to-Betrayal M2 only.

2026-10-01 approval update: the user said **“Looks good thus far, I approve. update statuses so another agent can pick it up.”** M2 passed its second review gate and is approved and published. The implementation commit is `209ab59923848af955094579194279cd9ec8662b`; the public version is <https://vikramramkumar.me/bastrop37/?v=209ab59>. The approval-only follow-up changes documentation, with no new gameplay tests, build, or deployment claimed. M3–M5 remain unauthorized.

## Implemented in owned files

- `src/scripts/bastrop37.ts`: explicit Level 1 completion Continue loads Level 2 art before entering a safe L2.01 opening. A failed required asset preserves `CP-L1-COMPLETE` and offers retry/menu. Shared sprite road, riding controls, opaque/swept collision, sound and mobile controls remain. Level 2 adds neutral carrier, broad scan and repeat approach, visible tether/active body, one existing drone, lateral lock escape, pursuit exit, visible actor disengagement, and gameplay-derived HUD fields. Localhost-only `?fixture=m2` starts L2 escape with ordinary energy zero and Overdrive 100 for input proof; it does not write a campaign save.
- `src/scripts/bastrop37/betrayal.ts`: deterministic L2.01–04 mission progression. Opening three lines save `CP-L2-SCAN`. The scan drains traffic, then the two equipment records require separate acknowledgment before all seven confrontation lines. Jo's final refusal sets `betrayalKnown` and saves `CP-L2-ESCAPE`. Steering outside the marked lock for 1.5 seconds, followed by the pursuit exit, drains the drone/carrier offscreen before the four closure lines and `CP-L2-COMPLETE`.
- `src/scripts/bastrop37/overdrive.ts`: separate 0–100 attempt-local meter; one award per actor/event ID (+10 near pass, +35 drone kill, +15 marked clean landing API). A fresh Shift at 100 consumes the meter for a 1.5-second, ~15% stronger burst without ordinary energy. No M2 marked obstacle was invented, so that reward is not currently earned in campaign. Retry restores authored zero meter.
- `src/scripts/bastrop37/save.ts`: published version-1 Level 1 key/checkpoint validation remains compatible. Three L2 checkpoint records strictly validate canonical dialogue, both records, chronological history, prerequisites, completed levels and flags. Only `betrayalKnown` changes in M2; later flags stay false. Failed storage writes leave session progress and truthful status.

Content-owned `betrayal-content.ts` and director-owned `contracts.ts`/HUD files are concurrent dependencies, not gameplay edits.

## Verification evidence

- `npm run check`: zero errors, warnings and hints. `git diff --check` on owned tracked source passes.
- Actual Chromium on local Astro dev port: valid completed L1 save continued into L2.01. L2.01 acknowledgment produced `CP-L2-SCAN`; a broad scan reached record 1, then record 2, then the seven lines. The refusal produced `CP-L2-ESCAPE` with exactly two records, `betrayalKnown=true`, and every later flag false. No page errors.
- Steering-only escape with ordinary turbo unused broke the lock, crossed exit and reached L2.04. The drone and carrier advanced visibly past z1200 before leaving the scene. Holding J on the right escape route sliced the one drone before the exit in a separate actual browser run.
- An undefended drone lunge at x490 caused a real collision at z≈22.6. Retry restored the safe `CP-L2-ESCAPE` actor layout/x320, retained `betrayalKnown`, and showed no receipt/confrontation replay; durable checkpoint remained the escape snapshot.
- Four L2.04 acknowledgments produced `CP-L2-COMPLETE` with completed levels `['L1','L2']`, 27 speaker lines, two records and 29 chronological transmissions. Reload restored completed L2 without reopening the encounter.
- Local `?fixture=m2` with energy≈0 and Overdrive 100: fresh Shift consumed the meter, activated ~1.5-second burst, and left ordinary energy unchanged. A one-time simulated L2 art fetch failure left `CP-L1-COMPLETE` durable; Retry Load entered L2.01 successfully.
- Viewed actual desktop 1440×900 and mobile 390×844 L2 opening captures in `/tmp/`; rider, neutral carrier, route and whole-card dialogue remained readable with card clearance. These are local inspection only; director owns retained screenshots and layout evidence.
- Native whole-card final acknowledgments now transfer focus to the canvas only when STORY enters ACTION. Browser checks confirmed ArrowRight steered immediately after the L1 opening and L2 refusal with no canvas click. P pauses and Escape resumes even while the whole-card button holds focus.

The director's source audit requested a natural final exit at the far camera edge. Disengaging drones and carrier now fade continuously over their last 400 world units ahead (or to z−65 behind for a rearward drone) before removal. A retreating drone still checks body contact if it begins beside Jo; retreat never crosses Jo's depth plane from behind. The subsequent director matrix and independent review verified the final integration; the final acceptance record below supersedes this worker-stage verification.

## Acceptance and exact next steps

The director completed the M2 browser matrix and independent desktop/mobile results pass. The user approved the published slice. Preserve canonical version-1 saves, CP-L2-SCAN/ESCAPE/COMPLETE, ordered records/history, natural actor departure and fixture save isolation. Await separate M3 authorization before implementing the public relay chapter, then agree interfaces and exclusive file ownership. No runtime changes are requested by this approval update.

Overdrive playtest limitation: a fresh M2 encounter can award at most55points (20 from its two unique civilian near-passes and35 from its one drone). It therefore cannot naturally reach100. Full-charge activation is verified only in the localhost fixture. No farming, extra traffic encounter or required Overdrive gate was added. Root explicitly accepted this as a prototype/playtest limitation.

## Final integration acceptance

Director completed the full matrix and targeted corrections: all 36 cases have passing results across the recorded runs. Final audit adds explicit local-fixture save isolation, a carrier-clear gate at its zero-alpha distance, and visible M2 departure after three defended attacks. Retained independent desktop/mobile results pass; reviewer disconnection and evidence-based director acceptance are recorded transparently in PHASE_3_M2_REVIEW.md. M2 is user-approved and published. The next milestone is M3 — Public connection, gated on further authorization. The full 34-case run passed 33; the corrected test-only Retry/Pause timing case plus isolated fixture passed 2/2; the added three-defended-attacks departure case passed 1/1, accounting for all 36 passing cases across runs. The optional exploratory L2 jump attempt crashed and is not a verified escape alternative; required steering/blade routes passed. Physical-phone performance and subjective pacing remain unmeasured. See [director handoff](PHASE_3_M2_DIRECTOR.md) and [review record](PHASE_3_M2_REVIEW.md).
