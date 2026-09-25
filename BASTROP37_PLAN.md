# Bastrop37 game slice

Build and ship the playable Bastrop37 game slice: a futuristic motorcycle escape through city traffic, attacking drones, and a sea wall before the countdown expires.

## Status

- [x] 1. Prepare assets — approved bike, drone, traffic, and effect sprites are in `public/bastrop37/assets/`. Trails, sparks, and other effects remain separate from vehicle sprites.
- [x] 2. Replace the camera and road — rear chase perspective, receding city road, distance-scaled hazards, readable lanes and landing zones, and aligned collision space.
- [x] 3. Make the bike feel incredible — responsive steering, energy slides, turbo, deployable blades, spring jumps, feedback, and keyboard/touch controls.
- [x] 4. Build one excellent drone encounter
- [x] 5. Make a complete short escape
- [x] 6. Add the atmosphere — skippable villain transmission, reactive synthesized score, engine/blade/ability/impact cues, autoplay-safe startup, and persistent mute controls.
- [ ] 7. Polish and publish

## Repository and workflow

- Work directly on `master`, which is the repository's main branch.
- Keep changes scoped to Bastrop37 and preserve the rest of the personal website.
- Reuse the existing stack and commit/push completed work; deployment is automated.
- Preserve the approved visual direction and keep gameplay effects separate from vehicle sprites.

## Remaining work

### 7. Polish and publish

Test a complete run and retry on desktop and touch layouts. Verify controls, collisions, attack timing, jump clearance, countdown, scoring, finish conditions, performance, responsive layout, asset loading, and console errors. Commit and push the finished slice, verify the deployed game if accessible, and report the commit, playable URL, and remaining limitations accurately.

## Definition of done

A player can open Bastrop37, immediately understand the controls, complete a satisfying escape using the bike's abilities, and retry without reloading. The finished game uses the approved visual direction and is committed and pushed.
