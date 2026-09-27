# Delivery asset specifications — first visual review

2026-09-27. Phase 2 only. **Pending visual approval.** This package contains standalone art and review-only display metadata, not integrated gameplay. The companion [manifest](asset-manifest.json) does not replace the existing runtime sprite manifest.

## Audit and reuse decisions

Visually inspected `city-skyline-v4.png`, `road-loop-v4.png`, `bike-normal-straight.png`, and the three civilian rear frames before choosing reuse. The skyline is an inland nighttime city with no coastal landmark; its large neon towers are busy and somewhat distant from the neighborhood brief. Retain it as a subdued distant plate behind the new low apartment/shop strip. Reduce saturation/contrast in composition, leave the original unchanged, and cover the lower cloud field with street-scale layers. The skyline is actually 1672×941, below the suggested 1920–2560 width; judge desktop scaling in the mockups before commissioning a replacement.

The road is 1254×1254, with repeatable asphalt, lane dashes and reflections. Retain it for existing perspective strips, with subdued reflections as needed in composition. No unique hazards are baked into the road. Static inspection does not establish seam quality in motion; test mapping and seams in Phase 3.

The 640×640 scarlet Jo frame has a readable rear silhouette. Retain it without face or outfit changes. Nonzero alpha bounds are `(221,192,206,283)`. Existing traffic is recognizable and sufficient for civilian gaps. Raw traffic images contain stray sheet fragments beyond the main vehicle, especially the sedan's lower edge. The old manifest's `rect` is the **sheet extraction provenance**, not a clean crop within the resulting 640×640 image. Current renderer also finds broad alpha bounds, so these fragments are an existing concern. No runtime fix is claimed.

Review-only source crops, visually checked in [asset-review.png](assets/asset-review.png):

| Frame | Source crop x, y, width, height |
|---|---|
| Jo straight | 221, 192, 206, 283 |
| Sedan | 75, 200, 500, 285 |
| Coupe | 70, 190, 500, 275 |
| Hauler | 60, 55, 520, 420 |

Use these crops to draw the existing images in the isolated mockup. They do not modify source art, body masks, blade reach, or existing collision pivots. The companion manifest retains existing full-source center pivots for actors; crop-aware display positioning is a separate preview choice requiring integration review. No replacement vehicle was produced, so no in-motion replacement comparison is claimed.

## Produced minimum kit

| ID | File | Dimensions | Proposed anchor / layer |
|---|---|---|---|
| CHAR-VLAD | assets/vlad-neutral-v1.png | 1254×1254 | Center / final isolated HUD; 56×56 desktop, 46×46 mobile CSS px |
| CHAR-OMEGA | assets/omega-symbol-v1.svg | 128×128 | Center / final isolated HUD; 56×56 desktop, 46×46 mobile CSS px |
| ENV-L1-MIDGROUND | assets/env-l1-midground-v1.svg | 1920×480 | Bottom center / behind roadside actors |
| PROP-SIGNAL | assets/signal-dead-v1.svg | 160×400 | Bottom center `(80,400)` / roadside |
| PROP-SERVICE-GATE | assets/gate-open-v1.svg | 800×360 | Bottom center `(400,360)` / roadside |

`ENV-L1` groups the reused skyline, midground, and reused road in the companion manifest. The midground has a transparent center opening and muted amber/dark windows. Keep it behind road and actor silhouettes. It is one composition layer, not a seamless scrolling tile. HUD worker owns final scene placement and perspective.

The signal has three unlit lenses and a local equipment box; it must not appear repaired in Delivery. Only the dead state is supplied. The gate is already open, with a blank off-white sign face at `(220,61,359,27)` for crisp overlay text. Leave its center x208–590 free for the service corridor and place posts outside the traversable lane. Gate size is an art proposal, not an accepted collision footprint. Blocked-crossing dressing and approach wording can be code-native shapes/text in the isolated scene; do not bake narrative lettering into these files. A restored signal and other state variants are deferred.

Vlad's physical appearance is proposed art, not added canon. The square portrait shows a composed adult in slate civic clothing with a warm neutral expression; no threatening alternate, title embedded in art, or villain cue. Opaque slate backdrop is intentional for the square communication tile; this is not a world sprite requiring transparency. Requested 512×512, built-in generator delivered 1254×1254. Preserved the delivered image unmodified; actual download is 2,048,475 bytes and nominal RGBA decode is 6,290,064 bytes. Phase 3 may consider a smaller derivative after approval.

Omega is one original vector identity: contained corner brackets, omega-shaped circuit, small center point. Static local/contained state is the asset default. Speaking may use a small opacity pulse or scale within the same brackets in the isolated HUD; reduced motion stays static. No outward propagation, citywide activation, or public release treatment occurs in Delivery. All new bodies/layers use source-over, no additive collision glow.

## Provenance and reproducibility

Vlad used the built-in `image_gen` tool under the imagegen skill, one generation. Exact prompt is preserved in [vlad-neutral-v1.prompt.txt](assets/vlad-neutral-v1.prompt.txt). Generator source location is recorded in the companion manifest; the selected PNG is copied into the workspace. No CLI/API fallback, resampling, or additional raster variant was used. Four SVGs are original code-native work based on the approved Delivery brief. Reused PNGs remain at their existing locations, referenced relatively without copying or modification.

The manifest includes all 11 production/reuse entries, dimensions, actual compressed file bytes, nonzero-alpha bounds, normalized source pivots, states, layers, display sizes, provenance, and pending approval. `rgbaDecodeBytes` is width × height × 4; SVG values estimate nominal rasterization, not fixed vector memory. Browser/GPU duplication, mipmaps and other overhead are excluded. Runtime world units and collision acceptance are explicitly uncalibrated.

From repository root, `node docs/bastrop37/phase2/assets/measure-assets.mjs` remeasures files and writes this companion manifest. The script uses the repository's Playwright dependency and headless Chromium to rasterize SVG/PNG for alpha measurement. The initial file-URL read was blocked by canvas origin rules; the final reproducible script uses in-memory data URLs. No source file is mutated by measurement except the owned companion manifest output.

[asset-review.html](assets/asset-review.html) is a standalone contact sheet. Its 1040×800 Chromium capture was visually inspected: Vlad at 64/80 px, Omega at64 px, signal at64×160, gate at400×180, neighborhood at960×240 and cropped actors at up to220 px. SVG XML parses and all manifest paths resolve. The final isolated HUD uses Vlad and Omega at 56×56 CSS px on desktop and 46×46 CSS px on mobile; director-reported independent review found both readable at those sizes. These final HUD sizes differ from the larger contact-sheet samples above. This proves static file rendering only; HUD composition, responsive state captures and text checks are owned by the HUD worker. No live gameplay, traffic drain, road loop, collision, memory profiling, or performance validation occurred.

## Acceptance and next steps

Present this first kit with the HUD worker's Delivery ACTION, STORY, and LEVEL COMPLETE mockups at the four required viewports. Review helpful Vlad, contained Omega, legible gap, inland street depth, road reflections, and readable props. Stop for visual approval. Only after Phase 2 approval and explicit Phase 3 authorization should engineering bind source crops, projection scale, pivots and collision exclusions, test in motion, and optimize loading. Do not produce later chapter kits from this first review.
