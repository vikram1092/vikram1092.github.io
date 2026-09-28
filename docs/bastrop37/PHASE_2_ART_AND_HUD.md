# Phase 2 — Art and HUD production

Current authority (2026-09-27): the user confirmed **“I approved it all”**, approving the full revised Phase 2 package, and authorized **Phase 3 M0/M1 only**. After M1 was verified, the user authorized pushing and publishing this slice. Stop after M1; no M2–M5.

Status: revised Delivery v2 visual direction accepted by the user (“Yeah much better”); full bounded Phase 2 revision-v3 package is produced and independently reviewed with no unresolved blocker. Stopped for final Phase 2 completion approval; Phase 3 authorization remains outstanding. See BUILD_STATUS.md for the current gate.

## 1. Required context and dependencies

Read [the story bible](../../BASTROP37_STORY.md) and [Phase 1](PHASE_1_NARRATIVE_AND_ENCOUNTERS.md). [Phase 3](PHASE_3_IMPLEMENTATION_AND_VALIDATION.md) defines runtime contracts and integration gates.

The game opens after Jo has picked up a module for Mayor Vlad. Level 1 is a credible delivery, Level 2 the betrayal, and Level 5 the public release of Omega. Only three speakers. Inland Bastrop; reservoirs and rivers, never coastlines. Third-person rear chase, existing sprite-based depth, desktop first, mobile preserved. No new audio.

Phase 1 and the first Delivery visual package are approved; the user explicitly authorized completing Phase 2. Phase 2 produces reviewed assets and isolated HUD mockups, without live gameplay integration. The first visual gate permits the bounded register and state package below; final Phase 2 completion still requires user approval.

Phase 2 produces one approved Delivery treatment first. Later kits wait until that treatment and the dialogue/gameplay rhythm work. All specifications below are intended starting contracts; asset quality needs visual inspection at intended display size in Phase 2 mockups, followed by in-game verification during authorized Phase 3 integration; dimensions alone are insufficient.

## 2. What exists and what to reuse

Repository baseline inspected for this plan:

- `src/scripts/bastrop37.ts`: Canvas 2D renderer with shared road-space projection, screen-sized backing pixels, sprite bounds, opaque-body collision masks, separate effects, and drone fragments.
- `public/bastrop37/assets/environment/city-skyline-v4.png`: skyline plate.
- `public/bastrop37/assets/environment/road-loop-v4.png`: road texture perspective-mapped in strips.
- `public/bastrop37/assets/sprites/`: bike poses, drone phases/fragments, civilian vehicles, effects, and `manifest.json`.
- `src/pages/bastrop37/assets.astro`: existing asset gallery and approved concept references.
- `src/styles/bastrop37.css`: shared by game and asset gallery. Scope new game styles so the gallery is not accidentally redesigned.

Reuse the scarlet bike, recognizable white ring drone, existing traffic, and separate cyan/yellow effects as the initial visual vocabulary. Inspect assets in motion before replacing them. The inventory is not evidence that every frame meets the new quality standard.

Do not regenerate all existing art merely to apply the word retro. Do not overwrite approved originals; use versioned source/output names and update the manifest only when a replacement is selected.

## 3. Visual direction

Target: high-definition image, restrained lo-fi detail, tangible urban grit. Large silhouettes, worn surfaces, deliberate shadow shapes, industrial lettering, subdued backgrounds, and a small number of luminous accents.

Proposed palette responsibilities:

| Element | Treatment | Purpose |
|---|---|---|
| Jo's bike | Preserve scarlet identity; dark rider silhouette | Recognizable focal point |
| Omega | Muted cyan/teal plus a unique symbol | System assistance and successful links |
| Municipal equipment / Vlad | Off-white, slate, restrained amber | Credible civic authority before betrayal |
| Immediate danger | Warm red plus shape/motion cue | Threats, not simply anything associated with Vlad |
| Turbo / Overdrive | Existing yellow-gold, controlled intensity | Aggressive momentum |
| Background | Low-saturation concrete, asphalt, layered haze | Keep road gaps readable |

Do not use red menace, a distorted face, or a VILLAIN label to disclose Vlad in Level 1. The same portrait serves all levels. After betrayal, threat state comes from the situation and words.

Lo-fi texture belongs on surfaces. HUD text, collision edges, navigation, and threat markers remain crisp. Avoid default full-screen blur, strong chromatic separation, heavy scanlines, or camera jitter. Optional effects need reduced-motion/low-effects fallbacks.

## 4. Minimal character package

| Asset ID | Deliverable | Runtime use | Explicit exclusions |
|---|---|---|---|
| `CHAR-JO` | Existing rider/bike pass; only necessary silhouette consistency edits | Rear-chase riding | Face portrait, expression sheet, off-bike model, cutscene rig |
| `CHAR-VLAD` | One neutral mayor portrait, square crop; suggested 512×512 source | Comms panel, optional civic display | Evil alternate, lip sync, full-body character |
| `CHAR-OMEGA` | One vector or transparent symbol with idle/speaking/linked behavior implemented through transforms | Comms panel and link feedback | Human avatar, multiple generated expressions |
| `PROP-MODULE` | Optional compact module detail on bike or HUD cargo symbol | Establish that Jo carries it | Separate pickup scene, inventory item UI, mandatory large sprite replacement |

Jo speaks as text labeled JO; the comms panel can omit the portrait slot for that turn. Omega animation must not suggest public distribution before Level 5. A small pulsing local indicator is sufficient.

Vlad art brief: adult municipal leader, composed and approachable enough to be trusted, restrained civic clothing, simple background, readable small face. Exact physical appearance is an art proposal; no celebrity likeness or elaborate biography is required.

## 5. Asset register by level

IDs are stable references, not prescribed filenames. Each environment kit consists of a distant layer, one or two midground strips, a road surface variant where useful, and a small group of roadside props. Do not paint the entire playable road and hazards into one background image.

| ID | Scope and states | First use | Production order |
|---|---|---|---|
| `ENV-L1` | Apartment/shop silhouettes, service corridor, amber/dark windows, asphalt variation | L1.01–05 | First |
| `PROP-SIGNAL` | Dead and restored traffic signal; no baked text | L1.02, L5.05 reuse | First |
| `PROP-SERVICE-GATE` | Open gate, approach marker, blocked crossing dressing | L1.04 | First |
| `ENV-L2` | Freight containers, substation forms, intake corridor, overhead service structures | L2.01–04 | After first slice |
| `PROP-INTAKE` | Scan arch/marker and neutral-to-active scan state | L2.02 | With betrayal |
| `VEH-RECOVERY` | Municipal carrier rear view; scan emitter inactive/active; optional gentle lane angles if movement requires them | L2.01–03 | With betrayal |
| `ENV-L3` | Market edges, rooftop antenna silhouettes, exchange frontage | L3.01–04 | After betrayal |
| `PROP-RELAY` | Dormant, connecting, linked states sharing geometry | L3.02–03 | With connection mechanic |
| `ENV-L4` | Reservoir shore, freshwater retaining structures, spillway, drainage/service road | L4.01–04 | With rescue |
| `PROP-SPILLWAY` | Closed/open gate and staged water overlays | L4.01–03 | With rescue |
| `PROP-ROADBLOCK` | Barrier closed/open; separate controller active/disabled | L4.02, L5.02 reuse | With rescue |
| `VEH-EVAC` | Anonymous civilian bus rear view, readable vehicle identity | L4.01–03 | With rescue |
| `ENV-L5` | Civic buildings, network service corridor, controlled night-to-dawn treatment | L5.01–05 | Finale |
| `PROP-CIVIC-NODE` | Dormant, linked, publicly active states | L5.01–04 | Finale |

Continuity requirements: Level 3 linked lights show only the two relay nodes, never citywide repair. Level 4 must make the reservoir, threatened lower road, shared barrier, uphill bus escape, and civic ramp legible together. Level 5 public activation follows the final release event; a brief dawn transition precedes limited recovery lights.

Shared props: lamps, lane signs, utility boxes, barriers, road edge markers, support pillars, simple public screens. Render readable wording as game text placed over clean surfaces; do not rely on generated lettering.

No new vehicle is needed for Level 1. No new named pilot for the carrier or bus. Start with the existing drone; introduce new enemy artwork only if an accepted encounter role cannot read clearly through existing behavior and markings.

## 6. Asset technical contract

For each new sprite or layer, provide:

- Stable ID and filename, source dimensions, alpha bounds, anchor/pivot, intended world size, and layer category.
- States and animation frames with consistent perspective, scale, pivot, and body proportions.
- Blend mode (`source-over` for bodies; additive only for appropriate effects).
- Whether it can collide, and whether its collision is a gameplay footprint or opaque-body mask. Background art never collides.
- Source provenance/edit prompt where generated, plus the approved output version.
- Intended display size and memory/load estimate from actual files, not only compressed download size.

Use the existing sprite manifest shape when it suffices; agree extensions with engineering before generating frames. New documentation fields can live in a companion manifest if needed to avoid breaking the gallery/parser.

Existing 640×640 padded vehicle frames are a compatibility reference, not a reason to create larger files. Keep transparent margins manageable and alpha edges clean. Do not bake glow into collision bodies. A vehicle's new art must not unexpectedly change its hitbox or blade reach.

Environment guidance: use a wide skyline source sufficient for a 1440-pixel desktop presentation; start near 1920–2560 pixels wide rather than blindly producing 4K. Judge actual projection/cropping. Near props require more detail than distant city silhouettes. Source dimensions are adjustable after the first in-game comparison.

Road surfaces should loop without visible seams. Respect the current scanline perspective mapping and lane alignment. Avoid baked obstacles, crossings, or unique markings that repeat nonsensically every few seconds. Place unique landmarks as separate projected assets.

## 7. Depth and effects without a renderer rewrite

Prioritize these steps:

1. Foreground props passing at credible speed, layered parallax, and depth-based scale.
2. Localized lighting overlays, distance haze, and distinct chapter palettes.
3. Separate rain, water, dust, and impact effects with capped particle counts.
4. Only then evaluate a shader for an unmet visual need.

Skia, WebGL, or another backend is permitted to be evaluated, not required. A shader proposal must name the visible problem, show the existing-renderer fallback, measure frame cost, and preserve a readable low-effects mode. Do not migrate the whole game for stylistic experimentation.

No water physics simulation, free 3D camera, volumetric city, or fully modeled interiors in this production scope.

## 8. HUD composition and responsive behavior

The viewpoint stays behind the bike. HUD graphics suggest bike instrumentation; they do not turn the screen into a helmet or cockpit.

Desktop starting layout:

| Region | Content | Rules |
|---|---|---|
| Upper left | One objective and short route cue | Stable position; never a stack of objectives |
| Upper right | Compact chapter/route context, pause/settings | No debug values or permanent score clutter |
| Lower left | Speed, energy, Overdrive, three ability states | Group related readings; avoid covering nearby collision gaps |
| Lower right | One communication card | Speaker, portrait/symbol when relevant, text, advance hint |
| World space | Destination marker, threat brackets, link corridor | Anchored through same projection as gameplay |
| Temporary context slot | Connection/escort/deadline state | At most one primary mission meter |

Treat percentages as a starting placement guide, not a fixed screenshot: keep the central road and nearby rider corridor unobstructed. Validate at 1440×900, 1280×720, 1024×768, and portrait 390×844. At smaller sizes, use a full-width lower dialogue band above touch controls, reduce ornamental details, and preserve readable text.

Suggested minimum body dialogue text: 16 CSS pixels on desktop, 15 on mobile; prefer increasing rather than shrinking to fit. A line can wrap or use more card height. For oversized text settings, reduce game-overlay decoration rather than clipping dialogue.

Use dark translucent backplates and adequate contrast against bright scenery. Color is supplementary: link state needs words/symbols, threats need shape/direction, and cooldown needs a visible fill or number.

## 9. HUD states and exact behavior

- **Opening/title:** understated Bastrop37 mark and start/continue. Game begins after pickup; no boot sequence required. Website masthead, build notes, and instructional footer leave the active play view. Keep a quiet return-to-site action in the menu.
- **Action:** objective, essential instruments, and threats. No dialogue requiring manual advance over combat.
- **Drain:** fading subordinate instruments are fine; avoid announcing ROAD CLEAR before it actually is.
- **Story:** one comms card, quiet instruments, safe cruise indication if needed. Show full sentence immediately. Advance prompt uses actual desktop binding or tap control.
- **Equipment records:** L2.02 shows separate advanceable cards for `WIPE MODULE / DETAIN COURIER / AUTH: MAYOR VLAD` and `POWER SHUTDOWN / AUTH: MAYOR VLAD`. L4.01 reuses the treatment for `LOWER ROAD DISCHARGE / AUTH: MAYOR VLAD`. Give each its own reading time; these are records, not a fourth speaker or an evidence inventory.
- **Ability states:** ready, active, cooldown, unavailable during story. Distinguish each by symbol/fill and label when focused or first introduced.
- **Connection:** `IN RANGE`, `LINKING`, `OUT OF RANGE`, `LINKED`; progress never implies Omega is released before finale.
- **Rescue:** compact bus condition/progress only when it matters. It is a vehicle, not a talking fourth character.
- **Failure:** short cause, restart checkpoint, restart level, menu. Do not blame the player with vague red noise.
- **Pause:** current objective, controls, recent communications, settings, checkpoint restart. Pause freezes story as well as action.
- **Level complete:** use exact closure text and continue labels from Phase 1. Save confirmation is subtle; acknowledge save failure honestly if storage is unavailable.
- **Finale:** public access state only after release event. Chapter replay and title after recovery ride.

No mandatory full-screen animations or cutscenes between every state. Use restrained transitions and honor reduced motion.

## 10. First review package

Produce only this first package before later chapters:

1. One Delivery road scene using reusable current assets and a small `ENV-L1` kit.
2. One neutral Vlad portrait and Omega symbol, shown at actual HUD size.
3. HUD mockups for ACTION, STORY, and LEVEL COMPLETE at desktop and mobile sizes.
4. Isolated mockup comparison of traffic approaching versus road cleared for text, using the same camera framing. Actual traffic/drain behavior and in-game captures wait for Phase 3.
5. One asset manifest sample confirming anchors, dimensions, layering, and file conventions.

Review questions: Can the player see Jo, the next gap, and the objective immediately? Is Vlad plausibly helpful? Does Omega read as a distinct speaker without a face? Does the city feel inland? Is grit present without fuzzy text? Does the scene feel deeper without adding 3D infrastructure?

Only after acceptance should art expand into the betrayal carrier and later chapter kits. Do not treat a written plan as approval of unseen generated art.

## 11. Ownership and handoff acceptance

Art supplies files, manifest metadata, source/provenance, and preview captures. HUD design supplies responsive layouts and the behavior/state map. Gameplay engineering binds runtime data, not hardcoded screenshots. Narrative verifies speaker text, reveal order, and mission terminology.

New styles should be scoped to the Bastrop game root; the portfolio and asset gallery remain intact. Keep the gallery useful as an asset review surface, but do not expose development internals in gameplay.

Reject files with inconsistent perspective, embedded stray text, opaque backgrounds on sprites, misaligned vehicle pivots, effects baked into hitboxes, coastline imagery, extra speaking characters, or a visual villain reveal before Level 2.

Deliver the minimum kit that supports the next accepted engineering milestone. Phase 3 owns actual integration, performance measurement, and gameplay acceptance.
