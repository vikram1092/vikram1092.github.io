# Phase 3 M4 Lockdown content handoff

2026-10-04. Assigned Level 4 content and art copies are complete. This handoff covers data and source copies only; it does not claim integrated gameplay, rendered projection, or save behavior.

## Implemented

- `src/scripts/bastrop37/lockdown-content.ts` exports `LOCKDOWN_DIALOGUE`: the exact three L4.01 and four L4.04 Phase 1 lines, with only Vlad, Omega and Jo speaking. L4.02/L4.03 remain action beats.
- `LOCKDOWN_RECORDS` contains `L4.01-RECORD-01`, titled `LOWER ROAD DISCHARGE`, source `SPILLWAY`, with lines `LOWER ROAD DISCHARGE` and `AUTH: MAYOR VLAD`. Its approved chronological placement is after `L4.01-01` and before `L4.01-02`; gameplay must acknowledge it there.
- `LOCKDOWN_ASSETS` has eleven keys: `architecture`, `spillwayClosed`, `spillwayOpen`, `waterLow`, `waterHigh`, `barrierClosed`, `barrierOpen`, `controller`, `controllerActive`, `controllerDisabled`, `bus`. Paths point into `public/bastrop37/assets/lockdown/`.
- `LOCKDOWN_ASSET_METADATA` records source sizes, source pixel anchors, manifest display crops, states and layers. `LOCKDOWN_PLACEMENT_GUIDES` carries the final environment's gate bay, side apron and portal coordinates plus the special spillway inner gate crop. The bus uses approved reused v1 art.

## Source and projection data

| Asset family | Source size | Anchor | Manifest crop / placement note |
|---|---:|---:|---|
| ENV-L4 | 1536×1024 | (819,558) convergence | (0,0,1536,1024); final open portal and central road transparency |
| Spillway closed/open | 1536×1024 | (768,998) ground | Full source crop; when compositing on ENV-L4, crop inner gate (402,360,728,540) into existing bay (420,347)–(551,514) |
| Water low/high | 1536×1024 | (768,998) source alignment | Full source overlay; lateral/background staging only; do not treat as a fluid simulation |
| Barrier closed/open | 1536×1024 | (768,852) ground | (0,180,1536,680); same ground feet and static open/closed states |
| Controller body/active/disabled | 1254×1254 | (625,1232) ground | (275,15,680,1225); effects share body canvas/crop/transform |
| Anonymous bus | 1254×1254 | (625,1160) ground | (165,90,920,1070); no speaker or invented identity |

The manifest's environment near apron edge is (1140,652)–(1536,868), and the portal floor is (1230,610)–(1403,648). Gameplay must align the uphill escape corridor with that visible side geography. Whole spillway frames drawn over the environment would double its existing frame. The barrier's generated upper left housing/lamp differs between static states by about 75 source pixels; a whole sprite tween has not been verified.

## Copy verification

All destination files were compared byte for byte with the selected source. The first ten source files are under `docs/bastrop37/phase2/revision-v3/assets/`; the bus source is `docs/bastrop37/phase2/assets/evac-bus-rear-v1.png`. The table lists destination names in `public/bastrop37/assets/lockdown/` and SHA-256 for both identical copies and sources.

| File | Bytes | SHA-256 |
|---|---:|---|
| `env-l4-v3.png` | 2,253,966 | `899494a329d6304eb1e21f89cf4d9793e78800ee88b736cdf381836260830c88` |
| `spillway-closed-v3.png` | 3,080,949 | `c39c8d11e13dfe052ce41ddb911375de6f00d15c87151b4da54ed0343ce24e46` |
| `spillway-open-v3.png` | 2,558,511 | `69e4a2c3933d1cb4ec06b3165874c23a8da62576bb8276e17f985c64bbf28278` |
| `spillway-water-low-v3.svg` | 1,116 | `410b02b3ed9a81149cf8d6ce40b73120e8bb7d21c4f2c5fe9f3a20a2c019a1d9` |
| `spillway-water-high-v3.svg` | 1,116 | `d41a26fc18b85d862e8e856e9e39f4a8b6c35c0e0fde7f5e341fb52df72b1517` |
| `barrier-closed-v3.png` | 1,738,560 | `6eb8360b0e43a1655b47c578f5f9908079309aac4645f943da72fb7e3ec1a046` |
| `barrier-open-v3.png` | 1,351,642 | `1b246669ba4de4c933a562ba0a897935f0173253e3da52f27f24830da72192e9` |
| `controller-v3.png` | 1,382,404 | `8b3d02e36e9d63850c05164035c2fee3471e77cf70ad302332778c6913ee1c21` |
| `controller-active-overlay-v3.svg` | 193 | `5849b9a10c4de9f8fa36fb5ff8257b3171889ae2ee8de4916a8c5eed5b6b7410` |
| `controller-disabled-overlay-v3.svg` | 237 | `9f8025461d9bd675c762420b52c9339478231a00cf4f49ca99debace75452a53` |
| `evac-bus-rear-v1.png` | 1,285,486 | `0b0404cf9f3949c4aa9a6fdcb5646de3bd4e3d5fdae942a03f3d2f3b52d66f44` |

Eleven files total 13,654,180 compressed bytes. I visually inspected the environment, both spillway states, both barrier states, controller and bus raster sources. I inspected the four SVG source canvases/text; each water overlay is 1536×1024 and each controller effect is 1254×1254. The sources show the inland reservoir, distinguish the barrier and controller states, and retain the anonymous bus. No raster generation or editing occurred. No runtime build or tests were run by this content worker.

## Files changed and next steps

- New `src/scripts/bastrop37/lockdown-content.ts`
- Eleven new source-identical files in `public/bastrop37/assets/lockdown/`
- New `docs/bastrop37/handoffs/PHASE_3_M4_CONTENT.md`

Gameplay integrates the record between the first Vlad and second Omega lines, derives barrier/controller/bus state, and protects Omega's containment through M4. HUD presents the record as an equipment record, not a new speaker. Director and reviewer should inspect actual browser projection, collision reach, barrier opening, side portal/bus path, mobile reservoir visibility and save/retry behavior. No runtime/HUD/save/tests files, unrelated work, swap file, commit, push or deployment were touched by this worker.

## Director integration addendum — 2026-10-04

The initial integrated candidate passed 15/15 behavior tests but failed independent visual review for disconnected uphill geometry and transparent spillway backing. Gameplay repaired shared road/actor projection, barrier span, mobile framing and water backing. The repaired build at 10:31:44 passed Astro check (24 files, zero diagnostics), and its full affected matrix passed 15/15 in 480.170 seconds, with no failures, skips or flaky cases. Independent re-review confirms the original material visual findings are resolved, plus mobile failure/retry and simultaneous steer/blades. One low consequence service-loop floor cue can overlap the closed barrier at the miss transition; the safe bypass and return were verified. Final integration acceptance and pickup are recorded in PHASE_3_M4_DIRECTOR.md; the specialist's earlier source-only statements above remain historical.
