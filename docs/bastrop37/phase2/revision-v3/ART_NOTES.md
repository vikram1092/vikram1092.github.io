# Revision 3 art package

Phase 2 only. Delivery revision 2 was accepted by the user on 2026-09-27. This extension uses that approved material direction; new chapter bodies and effects remain pending full visual review. No runtime integration or mechanics are claimed.

Twelve selected raster files cover four distinct environments, recovery carrier, relay, civic node, controller, two spillway states and two barrier states. Thirteen small SVG effects provide scan, local status, water, marker and dawn states on those detailed bodies. These are effects, not replacements for raster machinery. The companion manifest resolves all fourteen canonical groups and thirty explicit states. Original road, skyline, rider, traffic, Vlad, Omega, approved v2 architecture/signal/gate, and the fitting v1 raster bus remain references to untouched files.

Material direction is worn blue-charcoal steel and concrete, dirty ivory civic paint, inked/painted mechanical detail and restrained amber utilities. Cyan is local technical state. L2 has freight/substation mass; L3 awnings and antennas; L4 bounded freshwater and retaining structures; L5 civic colonnades. Only the final release permits public-active civic indicators and dawn; relay lights remain local readiness.

## Camera, crops and state alignment

Environment sources are 1536×1024. Actual visual convergence: L2 (768,552), L3 (768,442), L4 (819,558), L5 (768,451). Align these points to desktop scene (50%,42%) or mobile (50%,32%), preserve aspect ratio, crop/reposition rather than stretch. All four selected sources have true central road alpha; their 80%-height center pixel is zero. The L4 central road remains separate from the contextual side apron.

Manifest source-pixel anchors and display crops were sent to HUD. Raster dimensions are actual, not requested sizes: carrier and controller are 1254 square; relay/civic are 1024×1536; all other new bodies are 1536×1024. Effects share the full source canvas, crop and transform of their body. Do not independently center an effect on the visible alpha crop. Ground anchors and authored collision geometry are separate concepts.

L4's final `env-l4-v3.png` includes the real unobstructed portal and side apron, with bounded water extended behind the spillway for mobile visibility. Near apron edge is approximately (1140,652)–(1536,868), portal floor (1230,610)–(1403,648). Connect the projected escape lane to that geometry. Use spillway inner-leaf crop (402,360,728,540) fitted to the existing environment bay (420,347)–(551,514); drawing both complete frames creates double framing. Water sheets are lateral/background staging only. Repeated crops and flat geometry must not substitute for the inland context.

Spillway open genuinely raises the leaf with fixed side piers. Barrier open genuinely retracts its blade into the left post; concrete feet share the same baseline, but the generated upper left housing/lamp differs by about75 source pixels. These are reviewable static states; a whole-sprite tween/crossfade is not a verified retraction animation. Phase 3 must reconcile moving parts if animated. Open space and authored safe corridor must be independently validated.

## Provenance and evidence

Used the imagegen skill at `/Users/vikram/.codex/skills/.system/imagegen/SKILL.md` and built-in image_gen only: sixteen calls for twelve selected rasters plus targeted perspective/portal/alpha corrections. Exact prompts are adjacent `.prompt.txt` files; `assets/provenance.json` records final generated source paths. Files were copied without image processing. Initial perspective and L4 candidates are preserved, explicitly excluded from the manifest. The final L4 apron edit initially regressed alpha; measurement caught this, and a tool-based extraction correction restored zero-alpha road/sky. No CLI fallback or Python image editing.

Each output was visually inspected. `assets/asset-state-contact-sheet.png` shows all thirty states at reduced display sizes; local symbols remain distinct, the anonymous bus fits, mechanical openings read clearly, and environment silhouettes differ. This sheet is diagnostic, not a gameplay view. HUD owns composed desktop/mobile captures and final grounding review.

`assets/verification.json`: fourteen groups, thirty states, forty-three state file references, no missing paths. Twelve new raster downloads total27,433,027 bytes; nominal RGBA decode75,494,688 bytes, excluding browser/GPU copies and mipmaps. This is not a performance claim or a simultaneous-load requirement. Actual dimensions, bytes, alpha ranges, bounds, pivots, crop, layer and provenance are in `asset-manifest.json`; reused sources and effect dimensions are also measured.

Reproduce from repository root: run `node docs/bastrop37/phase2/revision-v3/assets/measure-assets.mjs`, then `python3 docs/bastrop37/phase2/revision-v3/assets/build-register.py`, then `node docs/bastrop37/phase2/revision-v3/assets/verify-register.mjs`. `review-assets.mjs` refreshes only the diagnostic contact sheet.

Remaining acceptance: independent theme-first review of final composed chapter states, especially L4 portal/escape-route alignment and mobile reservoir visibility, then user approval. No runtime collision, traffic clearing, connection, escort, release timing, save, motion or performance validation has occurred. Phase 3 remains separately gated.
