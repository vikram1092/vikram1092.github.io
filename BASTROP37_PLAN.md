# Bastrop37 game slice

Build and ship the playable Bastrop37 game slice: a futuristic motorcycle escape through city traffic, attacking drones, and a sea wall before the countdown expires.

## Status

- [x] 1. Prepare assets — approved bike, drone, traffic, and effect sprites are in `public/bastrop37/assets/`. Trails, sparks, and other effects remain separate from vehicle sprites.
- [x] 2. Replace the camera and road — rear chase perspective, receding city road, distance-scaled hazards, readable lanes and landing zones, and aligned collision space.
- [x] 3. Make the bike feel incredible — responsive steering, energy slides, turbo, deployable blades, spring jumps, feedback, and keyboard/touch controls.
- [x] 4. Build one excellent drone encounter
- [ ] 5. Make a complete short escape
- [ ] 6. Add the atmosphere
- [ ] 7. Polish and publish

## Repository and workflow

- Work directly on `master`, which is the repository's main branch.
- Keep changes scoped to Bastrop37 and preserve the rest of the personal website.
- Reuse the existing stack and commit/push completed work; deployment is automated.
- Preserve the approved visual direction and keep gameplay effects separate from vehicle sprites.

## Remaining work

### 4. Build one excellent drone encounter

Implement a readable `approach → flank → signal attack → lunge` sequence. Support three reliable responses: slice the drone, boost away, or jump over its attack. Telegraph attacks clearly, avoid unavoidable hits, and split destroyed drones into tumbling fragments with separate sparks and debris effects.

### 5. Make a complete short escape

Create a roughly 90-second run with an opening, escalating pressure, and a sea-wall finish. Introduce traffic first, then drones, then combinations. Include a visible countdown, scoring, success/failure states, and instant retry.

### 6. Add the atmosphere

Layer in the city backdrop, futuristic traffic, a brief skippable villain opening, synth music, engine audio, blade crackle, and impact effects. Respect browser audio restrictions and provide mute controls while maintaining gameplay readability.

### 7. Polish and publish

Test a complete run and retry on desktop and touch layouts. Verify controls, collisions, attack timing, jump clearance, countdown, scoring, finish conditions, performance, responsive layout, asset loading, and console errors. Commit and push the finished slice, verify the deployed game if accessible, and report the commit, playable URL, and remaining limitations accurately.

## Definition of done

A player can open Bastrop37, immediately understand the controls, complete a satisfying escape using the bike's abilities, and retry without reloading. The finished game uses the approved visual direction and is committed and pushed.
