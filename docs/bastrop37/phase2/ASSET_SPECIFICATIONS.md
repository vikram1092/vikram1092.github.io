# Phase 2 asset specifications

2026-09-27. The first Delivery visual package was **approved by the user on 2026-09-27**. The expanded chapter kits and state variants below are **pending final Phase 2 review**. This package contains standalone art and isolated review metadata, not integrated gameplay. The companion [manifest](asset-manifest.json) never replaces the runtime sprite manifest.

## Scope and complete register

There are 39 measured image entries: the 11 approved Delivery production/reuse entries plus 28 new candidates (27 code-native SVGs and one transparent bus PNG). Each canonical asset ID resolves through `groups` or an entry. All filenames below are inside `assets/`; brace notation enumerates actual separate files.

| Canonical ID | Files and states | Source dimensions / anchor |
|---|---|---|
| ENV-L1 | Existing skyline/road plus env-l1-midground-v1.svg | 1920×480 midground / bottom center |
| ENV-L2 | env-l2-midground-v1.svg; reused skyline/road | 1920×480 / bottom center |
| ENV-L3 | env-l3-midground-v1.svg; reused skyline/road | 1920×480 / bottom center |
| ENV-L4 | env-l4-reservoir-v1.svg, env-l4-route-v1.svg; reused road/optional subdued skyline | 1920×480 each / bottom center |
| ENV-L5 | env-l5-midground-v1.svg, env-l5-dawn-v1.svg; reused skyline/road | 1920×480 each / bottom center |
| PROP-SIGNAL | signal-{dead,restored}-v1.svg | 160×400 / (80,400) |
| PROP-SERVICE-GATE | gate-open-v1.svg; approach-marker-v1.svg; crossing-blocked-v1.svg | 800×360; 240×360; 800×240 / bottom center |
| PROP-INTAKE | intake-{inactive,active}-v1.svg | 800×360 / bottom center |
| VEH-RECOVERY | Existing traffic-hauler.png body plus recovery-{inactive,active}-v1.svg overlay | 520×420 overlay aligned to hauler display crop |
| PROP-RELAY | relay-{dormant,connecting,linked}-v1.svg | 240×400 / bottom center |
| PROP-SPILLWAY | spillway-{closed,open}-v1.svg; spillway-water-{low,high}-v1.svg | 640×400 / bottom center |
| PROP-ROADBLOCK | barrier-{closed,open}-v1.svg; controller-{active,disabled}-v1.svg | 800×240 barrier; 160×240 controller / bottom center |
| VEH-EVAC | evac-bus-rear-v1.png; one anonymous rear bus | 1254×1254 source; 920×1070 display crop / bottom center |
| PROP-CIVIC-NODE | civic-node-{dormant,linked,public-active}-v1.svg | 240×400 / bottom center |
| CHAR-JO | Existing bike-normal-straight.png | Existing full-source center pivot preserved |
| CHAR-VLAD | vlad-neutral-v1.png; one approved neutral portrait | 1254×1254 / center |
| CHAR-OMEGA | omega-symbol-v1.svg; one approved identity | 128×128 / center |

Approved Delivery originals, portrait/symbol identity, existing raster assets, runtime code and runtime manifest are unchanged. Optional module presence remains a HUD cargo state, with no new sprite or pickup scene. No additional characters, audio, 3D, enemy art or later mechanical invention is included. Existing drone art remains the engineering reuse target; no replacement is needed.

## Chapter composition and state meaning

L2 adds freight containers, substation posts and an overhead gantry. Intake begins neutral; the active state adds restrained scan lines, not a hostile accusation before evidence. Draw the recovery overlay on the cropped existing hauler at exactly matching width/height, without independent scaling, rotation or drift. The off-white central municipal equipment panel distinguishes it from civilian haulers; inactive amber and active teal emitter states share geometry. These are overlays, not complete carrier sprites. Evidence wording belongs to separate HUD cards.

L3 adds market awnings and rooftop exchange antennas. Relay states share the same cabinet, antenna and pivot. Dormant is a dash, connecting two local dots, linked a local check. Only the two relay nodes change state: no illumination wave, restored street or public distribution. Omega remains contained.

L4 separates a freshwater reservoir and concrete retaining bank from the rising shared route/civic ramp. The water surface is bounded by inland hills and structures, not an ocean horizon. For the scene, place spillway high beside the bank, discharge below it toward the lower road, bus below the same closed barrier that blocks Jo, and the rising route toward the civic ramp. The route layer is contextual geography; it does not paint the main playable road or determine world coordinates. HUD owns the composed causal view. Closed/open spillway geometry is fixed; low/high water sheets align to the same frame, sit laterally/background only, and never imply fluid simulation. The barrier retracts toward its left post; open state leaves the same central passage clear. Controller is a separate attack target with active square versus disabled cross. Bus identity is anonymous civilian transit, with a large rear window, blank destination panel and tail lamps. It has no speaker, pilot portrait or invented destination.

L5 adds civic colonnades and network service frontage. Civic nodes reuse the relay's visual grammar with wider civic side panels. Linked remains local. Public-active adds a distinct three-branch indication only after the final upload and clear-road release event. Dawn overlay follows that release, before recovery travel; it is a restrained atmosphere wash, not a city repair state. Only selected restored signals/returning lights should appear in the epilogue. Broken pumps still need work. The same Omega symbol persists.

The approach sign has a rightward direction arrow and space for code-rendered route wording; the blocked crossing stays separate from its service bypass. New signal-restored is supplied for L5.05, not Delivery. Gate blank sign face is `(220,61,359,27)`; its center x208–590 must remain traversable. No raster contains narrative text.

## Existing-art audit and display crops

Visually inspected existing skyline, road, scarlet rider and all three rear civilian traffic frames before reuse. Skyline is 1672×941, smaller than suggested production width and neon-heavy; subdue it behind chapter layers. Road is 1254×1254 with repeating asphalt/lane dashes. Neither original was changed. Static review does not prove skyline scaling or road seams in motion.

Raw traffic includes stray sheet fragments, especially beneath sedan. Old sprite-manifest `rect` is sheet extraction provenance, not a clean crop inside each resulting image. Current runtime finds broad alpha bounds; no runtime correction is claimed. These display-only source crops were visually checked without modifying originals:

| Frame | x, y, width, height |
|---|---|
| Jo straight | 221, 192, 206, 283 |
| Sedan | 75, 200, 500, 285 |
| Coupe | 70, 190, 500, 275 |
| Hauler / recovery body | 60, 55, 520, 420 |
| New bus | 165, 90, 920, 1070 |

Existing actor source pivots remain `(0.5,0.5)`. New bus source anchor is bottom center; its **display crop bottom center** is `(625,1160)` in source pixels and should be the mockup ground contact. Source-pivot and crop-ground conventions must be reconciled by engineering, not silently used as interchangeable hitbox origins. Recovery overlay full canvas matches the hauler crop, so align its bottom center with the cropped body, not the original padded PNG.

## Display sizes, layers and collision intent

Final isolated HUD portrait and Omega tiles are 56×56 CSS px desktop, 46×46 mobile, independently reviewed as readable. Original asset contact sheet keeps its larger Vlad64/80 and Omega64 samples. New state sheets inspect environment layers at1050×262, arch at320×144, barriers at320×96, relay/civic/controller figures in120×200 slots, spillways at288×180, recovery at220×178, and bus bodies at90px and180px wide. Figure slots preserve aspect ratio.

Background/parallax → midground geography/buildings → road surface → roadside props and actor bodies → separate water/scan overlays → HUD. All assets use source-over. No baked additive aura defines a collision edge. Environments and water/scan overlays never collide. Closed barrier/crossing needs an authored blocking footprint, not an alpha-derived wall; open posts stay outside the safe corridor. Controller needs an authored target footprint. Bus follows the authored noncolliding parallel escort path; its condition is separate from body collision. Existing actor body-mask behavior is preserved pending authorized integration.

World-size intent is relational: buildings are scenery beyond the roadside; gate/arch/barrier span one authored corridor with a readable bypass/clearance; cabinet/controller is roadside scale; recovery retains the current hauler proportions; bus is wider than Jo and stays in its separate parallel route. Manifest sizing uses provisional lane-relative units: Jo0.3 lane body width; civilian0.7; hauler/carrier0.75; bus0.8 on a separate ≥1-lane escort corridor; gate/intake clear opening≥1.2 lanes; barrier blocking span1.2 lanes with≥1 lane open; controller0.12 lane wide; relay/civic cabinet0.2 lane wide; lateral spillway2 lanes. These are visual starting values, not an approved world-unit schema, projection scale or calibrated hitbox. Existing hauler76×66 renderer units are a compatibility reference only. Source pivots, masks, blade reach, fade/disengage paths and near-camera clearance require Phase 3 measurement. State families have identical source dimensions/pivots, with only state geometry/indicators changing. Optional animations are transforms on these fixed layers with static reduced-motion fallbacks; no new animation sheets are required.

## Provenance, actual measurements and reproducibility

Vlad used built-in imagegen once; exact prompt is [vlad-neutral-v1.prompt.txt](assets/vlad-neutral-v1.prompt.txt). Bus used the same already-read imagegen skill and built-in tool once with transparent background; prompt is [evac-bus-rear-v1.prompt.txt](assets/evac-bus-rear-v1.prompt.txt). Generated files were copied into the workspace and preserved unmodified. No CLI/API fallback or resizing was used. Vlad delivered1254 square despite512 request. Bus delivered1254 square despite640 suggestion; alpha range is0–255. Bus alpha>20 bounds are `(173,98)`–`(1082,1153)`; nearly invisible nonzero-alpha pixels outside that body explain the larger measured alpha bounds. The preview crop excludes those margins; no body pixels were removed from the source.

Bus download is1,285,486 bytes; nominal RGBA decode6,290,064 bytes. The28 new image entries total1,315,238 download bytes and42,072,464 nominal RGBA bytes at source dimensions. All39 entries total9,885,215 download bytes and72,659,536 nominal RGBA bytes. SVG raster figures are estimates at their nominal sizes, not fixed vector memory, and are not a required simultaneous load. GPU/browser copies, mipmaps and overhead are excluded. Engineering should load chapter assets as needed and consider smaller approved raster derivatives; no performance result is implied.

Companion manifest records actual dimensions/bytes/nonzero-alpha bounds, source pivots, display crops/sizes, layers, provenance, collision intent, approval state and canonical groups. Original11 entries are `approved 2026-09-27`; all28 new entries are `pending final phase review`. Reused filenames remain relative references to untouched public assets. Approval covers the first visual treatment, not collision or runtime correctness.

From repo root, `python3 docs/bastrop37/phase2/assets/build-chapter-vectors.py` reproduces only the new27 SVG candidates/register; it never overwrites approved Delivery artwork. `node docs/bastrop37/phase2/assets/measure-assets.mjs` measures all39 images with Chromium and writes the owned companion manifest. It uses data URLs for canvas alpha measurements. Neither script touches runtime files. [chapter-asset-review.html](assets/chapter-asset-review.html) is an isolated contact sheet with a local/public fallback for the reused hauler; the publication script was not changed by content; the coordinating agent owns its expanded chapter-review rewrite support.

## Verification and remaining acceptance

Visually inspected all five [chapter sheets](assets/chapter-asset-review.html): [L1 variants](assets/chapter-review-l1.png), [L2](assets/chapter-review-l2.png), [L3](assets/chapter-review-l3.png), [L4](assets/chapter-review-l4.png), [L5](assets/chapter-review-l5.png). Confirmed bus identity at90/180px, overlay/body alignment at220px, local-only relay indicators, distinct controller states, clear barrier retraction, unlit/restored signal distinction, and consistent state silhouettes. Original [asset-review.png](assets/asset-review.png) remains unchanged.

Manifest measurement succeeds; all39 references/byte counts resolve; all31 SVG files parse; all14 canonical Phase 1 environment/prop/vehicle IDs resolve; every group member exists; approval counts are11 approved/28 pending. HUD worker/director own scene composition and responsive captures. Static review does not establish traffic clearing, relay range, barrier passage, escort combat, final release timing, storage, actual road loops or performance. Next: independent full Phase 2 visual review and user approval; Phase 3 implementation remains separately gated.
