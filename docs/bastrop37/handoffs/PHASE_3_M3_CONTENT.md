# Phase 3 M3 content handoff

## Final director integration addendum — 2026-10-01

Exact seven-line and four-asset checks passed with zero discrepancies; final 48/48 runtime suite and independent browser review verified integration. Actual local relay/overlay projection and desktop/mobile framing were inspected. Both earned M3 completion saves retain the two M2 evidence records and keep Omega contained. No new art or content scope was added.

M3 is verified locally and awaits user acceptance. Full results, performance limits, independent verdict and exact pickup are in [director handoff](PHASE_3_M3_DIRECTOR.md) and [review](PHASE_3_M3_REVIEW.md). The original worker-stage notes below retain provenance; pending integration items there are now fulfilled by this addendum. No commit/push/deploy occurred. Stop here; publication needs explicit approval after acceptance, and M4/M5 remain unauthorized.

## Original worker handoff

2026-10-01. Assigned data and selected art copies for Level 3 — Public Access are complete. This is content preparation; gameplay, HUD, saving and visual projection are integration work owned elsewhere.

## Implemented

- `src/scripts/bastrop37/public-access-content.ts` exports `PUBLIC_ACCESS_DIALOGUE` with the seven exact Phase 1 lines: `L3.01-01`–`03` and `L3.04-01`–`04`. The typed speakers are Omega, Jo and Vlad only. L3.02 and L3.03 remain action beats with no dialogue.
- The same module exports `PUBLIC_ACCESS_ASSETS` and `PUBLIC_ACCESS_ASSET_METADATA` using the existing Betrayal content module format. Keys are `architecture`, `relay`, `relayConnecting`, `relayLinked`. The environment uses source size 1536×1024, convergence anchor (768,442), full crop and midground layer. The relay body uses source size 1024×1536, ground anchor (512,1525), crop (185,0,655,1536) and roadside layer. Both effects use that identical full source size, anchor and crop with state-overlay layer. The local connecting/linked states do not express Omega's public release.
- Four files copied unmodified from `docs/bastrop37/phase2/revision-v3/assets/` into `public/bastrop37/assets/public-access/`: `env-l3-v3.png`, `relay-node-v3.png`, `relay-connecting-overlay-v3.svg`, `relay-linked-overlay-v3.svg`.

## Verification evidence

- Visually inspected the L3 environment and relay raster sources. The environment shows the approved market/antenna corridor with central open road. The relay is a roadside cabinet with a dark dormant indicator. No new art was generated.
- `file` reports PNG RGBA dimensions 1536×1024 and 1024×1536. SVG source canvases are both 1024×1536. `wc -c` reports 2,519,734 + 2,077,039 + 318 + 330 bytes = 4,597,421 bytes. These agree with the revision-v3 manifest.
- Source and public copy SHA-256 pairs match: environment `fa92b58791e5899207957e5a756ecbe68353e232a83b02dc8f0cd546ec459556`; relay `0b4f42da8dfe27bbb1a0a335bb844fc619cea25681fa0626c20672049ae86e99`; connecting `20e0ce01e644df8fa18ce920acb20a551f263866724c80876dff9ce30b33a981`; linked `0f7c63c9cce05374f5cb8c924236962b878c3b13d1bb162ba618b94a8601621a`.
- Relay body manifest alpha bounds (188,4)–(835,1531) fit the crop (185,0)–(839,1535); the ground anchor lies within that crop. Both SVG effects share the relay's source canvas and transform. This confirms source alignment metadata, not rendered motion alignment.
- Dialogue text and IDs were transcribed directly from `PHASE_1_NARRATIVE_AND_ENCOUNTERS.md` L3.01/L3.04. `DialogueLine` in `contracts.ts` permits the three specified speakers. No tests or runtime build were run by this content worker.

## Files changed

- `src/scripts/bastrop37/public-access-content.ts` (new)
- `public/bastrop37/assets/public-access/env-l3-v3.png` (copy)
- `public/bastrop37/assets/public-access/relay-node-v3.png` (copy)
- `public/bastrop37/assets/public-access/relay-connecting-overlay-v3.svg` (copy)
- `public/bastrop37/assets/public-access/relay-linked-overlay-v3.svg` (copy)
- `docs/bastrop37/handoffs/PHASE_3_M3_CONTENT.md` (new)

## Remaining integration

1. Gameplay imports the dialogue and asset map, loads only the L3 kit, and derives connecting/linked states from validated relay progress.
2. Project the environment and relay in motion with the recorded anchors/crops; inspect road edge, effect alignment and mobile framing in an actual browser.
3. Validate the integrated manifest URLs and accepted L3 checkpoints, preserving `omegaReleased=false` at completion. Director/reviewer own integrated tests and acceptance evidence.

The existing `.BASTROP37_PLAN.md.swp` and concurrent files were not opened or changed. No commit, push, deployment or later phase work occurred.
