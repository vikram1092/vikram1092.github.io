# Phase 3 M5 Release content handoff

2026-10-04. Bounded content preparation for approved Level 5 is complete. This is source data and selected art copies, not implemented mission behavior or rendered validation. M5 runtime integration follows the M4 review gate.

## Implemented

- `src/scripts/bastrop37/release-content.ts` exports `RELEASE_DIALOGUE` with all nine exact Phase 1 lines: three each in `L5.01`, `L5.04` and `L5.05`. Only Jo, Vlad and Omega speak. `L5.02` and `L5.03` have no spoken lines.
- `RELEASE_ASSETS` and `RELEASE_ASSET_METADATA` use the existing chapter content pattern. Keys: `architecture`, `civicNode`, `civicLinked`, `civicPublic`, `dawn`, `signalDead`, `signalRestored`, `markerBody`, `recoveryMarker`, `controller`, `controllerActive`, `controllerDisabled`, `barrierClosed`, `barrierOpen`. Existing Delivery signal/gate and Lockdown controller/barrier files are referenced at their current public URLs; no duplicate bytes were copied.
- `RELEASE_PLACEMENT_GUIDES` records the civic road convergence and node ground anchor and states the art gating: public indicator and dawn require committed release; restored signals belong to protected recovery; the recovery marker follows acknowledged L5.05.
- Seven selected revision-v3 files were copied unchanged into `public/bastrop37/assets/release/`: civic night environment, civic node, local linked indicator, public indicator, dawn effect, restored signal effect, and approach marker effect.

## Geometry and state intent

| Family | Source size / anchor | Crop | State rule |
|---|---|---|---|
| Civic environment | 1536×1024; vanishing (768,451) | (0,0,1536,1024) | Night until post-release dawn; central road alpha is transparent for the projected road |
| Civic node and both effects | 1024×1536; ground (512,1515) | (10,20,1005,1505) | Dormant body; local linked effect is readiness only; public effect appears only after `omegaReleased` commits |
| Dawn effect | 1536×1024; same (768,451) as ENV-L5 | Full source | After release only; overlay shares environment transform |
| Dead signal and restored effect | 1024×1536; ground (538,1515) | (304,7,428,1510) | Reused dead body; restored effect is limited to safe recovery ride after L5.05 acknowledgment |
| Marker body and arrow effect | 1536×1024; ground (768,999) | (20,8,1504,994) | Reused open service gate body and selected marker effect; the recovery passage is a gameplay latch, not inferred from art |
| Controller and state effects | 1254×1254; ground (625,1232) | (275,15,680,1225) | Reused M4 body/active/disabled files for L5.02; disabled state alone does not certify defender clearance |
| Closed/open barrier | 1536×1024; ground (768,852) | (0,180,1536,680) | Reused M4 art; open display follows controller result and measured corridor clearance |

The civic environment visually converges around (768,451) in its full 1536×1024 source. The road opening remains transparent; the actual projected road must converge there at the desktop/mobile camera settings rather than stretching the environment. The node is a tall front-facing source with its base near y1515; place its feet on the road edge/sidewalk plane. The local effect is a check plus one lit circle near the node's upper controls; the public effect branches into three lit circles. Both effect canvases and crops match the node. The signal effect is a single circle at (463,591) on the reused source, within the signal crop. The recovery arrow lies within the reused gate crop. These are source-alignment observations; browser projection and motion remain to be inspected.

## Exact copied files and verification

All seven destinations match the corresponding `docs/bastrop37/phase2/revision-v3/assets/` source byte for byte and match the manifest byte counts/canvases. The hashes below are SHA-256 of both identical source and destination. The public asset directory contains exactly these seven files, totaling 5,426,434 compressed bytes.

| File | Bytes | SHA-256 |
|---|---:|---|
| `env-l5-v3.png` | 2,451,815 | `86fbcb31dfa6ba4d4015590984d3c033d66f90c221bc02e49055fb6baf175abb` |
| `civic-node-v3.png` | 2,972,920 | `7beef2f9cf2712f33ef1fa670ecfade4e141767d564206791a27d25fea030608` |
| `civic-linked-overlay-v3.svg` | 330 | `14a4c9fc54c2df8631bf5d09f48872f628534338a04a92858bc569e01989fb0c` |
| `civic-public-overlay-v3.svg` | 556 | `419ce0a777b89ab95c2a496f9fbdcaae1d60131b7349907f10f504ac22cb05ad` |
| `dawn-atmosphere-v3.svg` | 372 | `6b1bc32eb2f72ef4675e3f58f0a21c9407c855679ae06ea611a0d297b8a292a1` |
| `signal-restored-overlay-v3.svg` | 200 | `fb82bd365c91f9158665194561dc00c638063f24002d549aec67dfbc92f4979b` |
| `approach-marker-overlay-v3.svg` | 241 | `eca9e7d940a551d6163c901d0e7b54251b352c0a911abdde84e6c66846bba739` |

I visually inspected ENV-L5, the civic node and the reused signal body, and read the five SVG source canvases and paths. They provide distinct local/public node states and a restrained dawn tint. All seven reused public URLs resolve as files. No new art was generated. No runtime build or tests were run by this content worker.

## Files changed and integration pickup

- New `src/scripts/bastrop37/release-content.ts`
- Seven new source-identical files in `public/bastrop37/assets/release/`
- New `docs/bastrop37/handoffs/PHASE_3_M5_CONTENT.md`

Gameplay imports the data after M4 review, requires L4 completion with relay and bus flags intact, uses two distinct five-second upload sections, commits `omegaReleased` once at validated completion, then presents L5.04 and safe L5.05/recovery marker travel. HUD and renderer show only local node indication before release, then public/dawn after commitment, then limited restored signals during protected recovery. Director/reviewer must validate actual browser projection, source-aligned effects, state timing, checkpoint/reload and chapter replay. No runtime, HUD, save, tests, other agent files, git, push or deployment were touched here.

## Director integration acceptance — 2026-10-04

The assigned source/data is integrated and locally accepted in the complete campaign. Final production build checked25files withzero diagnostics; independent M5 browser/visual review passed after the documented dawn/copy repairs. All81distinct scenarios have passing evidence across the80-pass full run and4/4 focused rerun after a test-driver READY wait; production source was unchanged for that rerun. Fresh L1–L5 completion has50spoken/3records/53history and reloads correctly. Static exact-content/source-copy checks remain valid. Performance, payload, remaining playtest limits and exact publication pickup are consolidated in PHASE_3_CAMPAIGN_REPORT.md. Worker-specific verification limits above remain accurate; the director's integrated evidence is separate. No further worker production is queued.
