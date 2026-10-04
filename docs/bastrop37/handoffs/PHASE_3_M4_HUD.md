# Phase 3 M4 HUD source handoff

2026-10-04. The user authorized the remaining approved levels; this file records only the assigned M4 HUD source work. Integrated browser behavior is pending gameplay wiring and director review.

## Completed source work

- `src/scripts/bastrop37/hud.ts`: L4 chapter number and menu fallbacks, existing blade/jump ability presentation in L4 action, controller ACTIVE / BARRIER OPENING / BARRIER OPEN states, three gameplay-derived bus-condition segments, IN RANGE / RETURN TO BUS / STEER LEFT or RIGHT · DRAW FIRE cues, and the zero-condition EVACUATION ROUTE LOST crash title. The controller, escort and mission-meter values remain read-only. The renderer does not calculate damage, progress, interception, safety, or chapter transitions.
- `src/pages/bastrop37/index.astro`: compact controller and escort status nodes inside the existing mission context, with accessible bus condition and polite status labels. The existing native whole-card receiver, equipment-record text, pause history, controls, and separate gallery remain structurally unchanged.
- `src/styles/bastrop37.css`: scoped status color, three condition ticks, and compact mobile type. Only `#bastrop-game` selectors were added.

## Source verification and limits

- Read the story bible, L4 Phase 1 beats, approved Phase 2 revision-v3 HUD state map, M4 director/content handoffs, frozen `HudView` contract, and current HUD/page/style source.
- `git diff --check -- src/pages/bastrop37/index.astro src/styles/bastrop37.css src/scripts/bastrop37/hud.ts` passed with no whitespace errors. Source inspection confirms one existing mission progress rail, and L4 display values are read from optional `controller`, `escort`, and `missionMeter` fields. The equipment record still uses the native card and ordered history.
- No build, game tests, browser captures, visual measurements, keyboard/touch run, or independent review was performed by this worker. Prior M1–M3 evidence does not establish M4 rendering.

## Dependency and next steps

1. Gameplay should supply `missionMeter` when a numeric controller or escort progress rail is intended. The HUD still displays controller and bus condition context when that field is absent. This interface note was sent to the director.
2. Director integrates M4 and checks actual 1440×900, 1280×720, 1024×768 and 390×844 action, out-of-range, telegraph, crash, record and completion states. Measure rider/road and mobile control clearance, whole-card taps, focus, contrast and reduced motion.
3. Fresh reviewer checks final visuals and interactions. Director records build/test results and resolves findings before M4 acceptance. M5 HUD is outside this handoff.

## Director integration addendum — 2026-10-04

The initial integrated candidate passed 15/15 behavior tests but failed independent visual review for disconnected uphill geometry and transparent spillway backing. Gameplay repaired shared road/actor projection, barrier span, mobile framing and water backing. The repaired build at 10:31:44 passed Astro check (24 files, zero diagnostics), and its full affected matrix passed 15/15 in 480.170 seconds, with no failures, skips or flaky cases. Independent re-review confirms the original material visual findings are resolved, plus mobile failure/retry and simultaneous steer/blades. One low consequence service-loop floor cue can overlap the closed barrier at the miss transition; the safe bypass and return were verified. Final integration acceptance and pickup are recorded in PHASE_3_M4_DIRECTOR.md; the specialist's earlier source-only statements above remain historical.
