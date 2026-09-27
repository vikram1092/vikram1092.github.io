# Phase 3 art and HUD integration handoff

2026-09-27. **Historical v1 integration inventory; visual baseline rejected and under revision. Not authorization to begin Phase 3.**

The user rejected the expanded art/HUD treatment after the technical review. Do not implement its visual treatment as accepted direction. Phase 2 is reopened for one revised Delivery slice under `phase2/revision-v2/`; this handoff must be refreshed after visual approval. The earlier inventory below is preserved as reference. Phase 1 and the first Delivery visual treatment are approved. The bounded full Phase 2 package now supplies all 14 canonical asset groups through 39 measured entries, plus 37 isolated HUD/state samples; independent final review passes with no unresolved blocker, and user completion approval remains the gate. Runtime mechanics, saves, performance and collision have not been implemented or verified by these isolated previews.

## Sources and ownership

Use the [story bible](../../../BASTROP37_STORY.md), [Phase 1 beat/checkpoint contract](../PHASE_1_NARRATIVE_AND_ENCOUNTERS.md), [Phase 2 specifications](../PHASE_2_ART_AND_HUD.md), and [Phase 3 engineering gates](../PHASE_3_IMPLEMENTATION_AND_VALIDATION.md). Actual asset metadata lives in [the companion manifest](../phase2/asset-manifest.json); [asset specifications](../phase2/ASSET_SPECIFICATIONS.md) and [HUD specifications](../phase2/HUD_SPECIFICATIONS.md) explain composition and limits. Final review evidence is linked from [BUILD_STATUS](../BUILD_STATUS.md).

Gameplay owns mission progression, traffic exits, collision, actor positions, checkpoint state, save results, and current control bindings. HUD renders a derived view and emits input intentions. Art owns asset source/version, layer/pivot and visual state selection; collision geometry remains a gameplay acceptance decision. Do not let a selected review sample set story flags in a production campaign.

The isolated `phase2/preview.js` is a visual review composition, not a second gameplay engine to import wholesale. The public build copies `docs/bastrop37/phase2/` into the site and rewrites repository `public/` references through `scripts/publish-bastrop37-review.mjs`. Preserve this review mechanism; it does not replace the live game route.

## Delivered package and acceptance status

The asset register has 11 first-gate approved entries and 28 new candidates (27 code-native SVG layers/states and one generated transparent bus raster). These complete the bounded register; no required later chapter kit is silently deferred. The same neutral Vlad portrait and Omega identity serve all chapters. Original image files and live runtime manifest are preserved. New candidates remain pending final user visual approval; their existence is not an approved collision or performance contract.

The review page exposes all chapter/state samples through the outside-frame selector. Fifty canonical dialogue lines are available in exact order/text; key review sequences preserve the two separate carrier records before seven confrontation lines and manual finale/recovery exchanges. Representative sheets are `phase2/captures/full-contact-chapters.png` and `full-contact-states.png`; individual captures and reproducible checks accompany them. Original Delivery views/contact sheet remain available.

## Integration order and chapter contracts

| Chapter / accepted event | Visual binding and state constraints | Phase 3 proof required |
|---|---|---|
| Delivery L1.01–05 | Existing scarlet Jo/traffic and dark neighborhood; one neutral Vlad portrait; Omega contained symbol. Dead signal, blocked crossing, open service route, then approach marker. Cargo establishes module already aboard. | Service gate and approach marker crossed before drain/closure. Omega appears only at L1.03. L1.03 acknowledgment changes objective to TAKE THE SERVICE LANE. No capture lane or betrayal cue in L1. |
| Betrayal L2.01–04 | Freight/intake treatment; neutral carrier then active scan/lock state. Separate WIPE MODULE / DETAIN COURIER / AUTH: MAYOR VLAD and POWER SHUTDOWN / AUTH: MAYOR VLAD records each wait for acknowledgment. Same Vlad portrait. | Broad scan zone, safe carrier spacing through reading, lateral lock escape with empty energy, drone visible exit. Do not infer hostility from neutral municipal art before evidence. |
| Public Access L3.01–04 | Market/relay treatment; dormant, connecting, linked node geometry is shared. Two local indicators only. HUD distinguishes in-range/linking/out-of-range/linked. | Missed links loop safely; checkpoint preserves relay A; both readiness flags still leave Omega contained. No public activation, repaired street, or release effect. |
| Lockdown L4.01–04 | Reservoir and spillway above lower road; closed shared barrier and separate active controller; open barrier/disabled controller; anonymous bus climbs uphill to civic ramp. Staged water overlays remain scenery. | Blade reach without body collision; safe loop; three-condition-segment bus; bounded interception, reachable escort range, bus safety plus civic-ramp marker. No invisible timer or moving water collision invented by art. |
| Release L5.01–05 | Civic node dormant/linked/public-active; exactly two final connection sections. Only after final commit show public state, then controlled dawn and limited restored signals. | Both distinct sections validate, second corridor clear before release, immediate release save, no post-release failure. Epilogue acknowledgment then protected marker travel; no instant citywide repair. |

These are bindings for the approved narrative, not evidence that the preview simulates its encounters. Assets cannot independently prove world scale, timing, collision reach, or a navigable route.

## Asset transfer contract

- Keep the companion manifest separate from the existing runtime sprite manifest until its parser/renderer fields are agreed. Preserve stable IDs and state groups. Review-only filenames are versioned; selected production copies can retain versions without overwriting originals.
- Read each file's measured source dimensions, alpha bounds, crop, pivot space, layer, blend and memory estimate. Do not assume all generated rasters have the requested dimensions. `rgbaDecodeBytes` excludes GPU/browser overhead.
- The approved rider and raw traffic retain their original files. The review uses source crops that remove sheet fragments. Before adopting those crops, map the full-source pivot into crop coordinates and verify opaque-body masks, visual body bounds and blade reach against actual runtime projection. Do not silently change hitboxes to match a screenshot.
- Municipal carrier overlays align to the existing hauler's explicit cropped body. Treat body and overlay as one projected actor transform; do not give the overlay an independent collision mask.
- Bus and unique props need projection/world-size calibration in the existing renderer. Transparent source margins and bottom-center anchoring support that work; they do not establish a tested footprint.
- Road/skyline reuse preserves the current raster vocabulary. Road strip mapping, seams in motion, layer parallax and horizon crops require in-game inspection. No 3D renderer migration or shader dependency is required.
- Keep UI wording and navigation labels crisp runtime text; blank sign surfaces intentionally contain no generated lettering. Bodies use source-over; effects cannot expand collision silhouettes.

## HUD interface decisions

The existing `src/scripts/bastrop37/contracts.ts` is a prior scaffold, not an accepted complete campaign interface. During authorized M0, reconcile it with the reviewed behavior map before coding. Bind one primary objective, one dialogue/record card or one contextual mission meter, and actual input bindings. Only Jo/Vlad/Omega are speakers; equipment records have their own system-card type.

Required state data includes: top-level loading/title/play/pause/failure/completion; play mode action/drain/story/resolve; current chapter/beat; objective and route cue; speed/energy; ability ready/active/cooldown/unavailable; optional separate Overdrive; speaker or record identity; full text and acknowledged progress; local link state; bus condition/range; save pending/success/session-only failure; final release committed. Mission conditions stay in gameplay, not in HUD selectors or display labels.

Advance is one fresh key/button press. Clear held/queued controls at transitions; a story tap cannot trigger the next attack. Hide/disable combat controls during story. Pause freezes both simulation and reading. Every save label must follow actual storage results, never an optimistic static timer. Continue/retry emits an intention and remains recoverable when load fails.

Use the reviewed responsive patterns at 1440×900, 1280×720, 1024×768 and 390×844. Preserve rider/corridor clearance, full readable sentences, mobile advance above touch controls, reduced motion and non-color state cues. The approved character tiles are 56px desktop/46px mobile; large-text and device/browser coverage remain engineering QA obligations.

## Exact next phase and acceptance sequence

1. Stop for the user's final Phase 2 completion approval. Approval of the earlier Delivery treatment does not imply acceptance of unseen later kit outputs.
2. Only after explicit Phase 3 authorization, begin M0: inspect actual checkout, establish a playable baseline, agree manifest/HUD schema, record existing test failures, and preserve unrelated work.
3. Implement M1 Delivery only: L1.01–05 safe cruise, natural drain, exact dialogue, objective changes, traversable route/marker, truthful saved ending and explicit continue. Use the accepted small kit; later chapter assets being available does not authorize implementing M2–M5.
4. Verify desktop/mobile play, slow reading, fresh-press input, visible traffic exits, route hold, checkpoint/reload/save failure and missing-next-level recovery. Measure performance on stated hardware; static captures prove no frame-rate target.
5. Present M1 tone/rhythm for review before expanding the campaign. Retain later asset/state constraints and implement later milestones only within their authorization.
