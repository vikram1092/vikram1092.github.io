# Phase 3 M2 content handoff — Betrayal

2026-09-28. Scope: content data and approved production asset copies for the authorized Delivery-to-betrayal milestone. No gameplay, HUD, save, contract, tests, publishing, or later chapter files were edited here.

## Implemented

- `src/scripts/bastrop37/betrayal-content.ts` exports `BETRAYAL_DIALOGUE` with the 14 exact approved L2.01, L2.02, and L2.04 speaker lines (3/7/4); L2.03 has no dialogue. Only Jo, Vlad, and Omega speak.
- `BETRAYAL_RECORDS` contains two separately advanceable equipment records, ordered before the L2.02 confrontation: `L2.02-RECORD-01` has `WIPE MODULE`, `DETAIN COURIER`, `AUTH: MAYOR VLAD`; `L2.02-RECORD-02` has `POWER SHUTDOWN`, `AUTH: MAYOR VLAD`. Both have title `EQUIPMENT RECORD` and source `RECOVERY CARRIER`. The records are system text, not a speaker.
- `BETRAYAL_ASSETS` and `BETRAYAL_ASSET_METADATA` bind the v3 freight architecture, neutral carrier, carrier active overlay, and intake scan overlay. The previously integrated Delivery service gate remains the intake gate source; this package does not duplicate it.
- Four approved v3 files were copied byte-for-byte into `public/bastrop37/assets/betrayal/`.

| Production file | Source size | Bytes | SHA-256 |
|---|---:|---:|---|
| `env-l2-v3.png` | 1536×1024 | 2,633,356 | `5825c6053ec48e158345fb046e88b66f1ad740c40d9aed4bcf3535adf5f9fc1a` |
| `carrier-rear-v3.png` | 1254×1254 | 2,412,131 | `5a224216b0db3dae72bc5510c0c03e73b11914a9f523005b2e94705e10767d28` |
| `carrier-active-overlay-v3.svg` | 1254×1254 | 404 | `f07538e40245b34e9e751fa3781ff15a3bcff3850cf2a71d73d7bdd815634936` |
| `intake-scan-overlay-v3.svg` | 1536×1024 | 258 | `d78516332eb8b58b8a85403aaa20ff29b5d4faaf4e95d85b5f632c0596bce74e` |

## Placement and rendering constraints

- `ENV-L2-V3` uses actual visual convergence `(768,552)` in source pixels and a full `[0,0,1536,1024]` display crop. Its central road is transparent. Align that point to the desktop scene `(50%,42%)` or mobile `(50%,32%)` with uniform scale and an appropriate cover crop, as in the approved art notes.
- `CARRIER-REAR-V3` uses ground anchor `(627,1133)` and visible-body crop `[30,90,1195,1050]` on its 1254-square source. This crop is visual; collision and world size remain gameplay-owned.
- `CARRIER-ACTIVE` shares the carrier's full-source anchor, crop, scale, and actor transform. `INTAKE-SCAN` shares the L2 architecture's full-source transform. Neither overlay acquires an independent hitbox. The carrier body remains neutral until the scan reveals the orders; the overlay is an active state, not a substitute body.
- I visually inspected both raster bodies at source scale and inspected both SVG contents. The L2 environment reads as an inland freight/substation corridor; the carrier reads as one detailed municipal body. The effects are restrained cyan geometry. Runtime composition and mobile/rider clearance are still unverified.

## Verification

- Source and production SHA-256 pairs match for all four copied assets. `file` confirms PNG dimensions and SVG formats. A focused assertion compared all 14 exported lines to the exact Phase 1 text, verified the two ordered record IDs/lines, and checked all four asset paths, byte sizes, IDs, dimensions, anchors, and display crops against the v3 companion manifest.
- `npm run check` passed: 15 files, zero errors, zero warnings, zero hints.

## Unresolved and exact next steps

- Gameplay and HUD owners must consume these exports, present both receipts as separate acknowledgments before the seven confrontation lines, and test the neutral carrier to active scan/lock transition in the actual renderer. They must validate road/rider clearance and safe spacing at desktop/mobile sizes; static metadata cannot prove that behavior.
- The runtime must re-use `DELIVERY_ASSETS.serviceGateOpen` if an intake gate is shown. Gameplay determines scan geometry, lock escape, collision, checkpoint, and pursuit behavior from the approved L2 acceptance table. No release flag is set in this milestone.
- After integration, run the M2 scenario and visual acceptance gates. This content package alone is not a verified playable Betrayal chapter.
