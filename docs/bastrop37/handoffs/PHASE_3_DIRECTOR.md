# Phase 3 M0/M1 director handoff

**Acceptance: M0/M1 verified and ready for user playtest. No material review finding remains open.**

2026-09-27. Full Phase 2 approval was explicitly confirmed by the user: “I approved it all.” Phase 1 was already approved. Only Phase 3 M0/M1 is authorized. After its acceptance the user explicitly authorized pushing and publishing this slice. No M2–M5.

## Completed work and ownership

The initial checkout had only the preserved `.BASTROP37_PLAN.md.swp` untracked. It was not opened or deleted. The existing runtime was the old timed escape with an unused campaign contract scaffold. Baseline `npm run check` had zero diagnostics and the original 17 browser tests passed in 3.9 minutes. Those results describe the preserved baseline, not Delivery acceptance.

Configured project roles performed the substantive work: gameplay Sol/high owns main runtime, delivery state and saves; HUD Sol/medium owns the page, scoped styles and HUD adapter; content Sol/medium owns approved dialogue and six production image copies; reviewer Sol/high independently reviewed source, actual browser play and visual evidence. Director Astra/high owns interfaces, tests, scope/status and integration. One writer per file was assigned before dependent edits; the mechanical role was unnecessary.

Agreed API: `createHud(HudActions).render(HudView)`. HUD binds menu/dialogue controls; gameplay binds keyboard, driving and mute, and owns mission/save state. `DELIVERY_DIALOGUE` contains all 13 exact L1 lines. Approved asset keys are architecture, signalDead, serviceGateOpen, crossingBlocked, vladNeutral and omegaSymbol; six source-identical assets total 9,791,327 bytes. No later chapter art is loaded.

L1.01–05 now provides a complete playable Delivery: full-text manual dialogue; mission route held while harmless road scroll continues; authored civilian gaps; natural actor clearing before safe reading; tutorial feedback and objectives; an open service corridor and real closed crossing contact; safe missed-gate loops; approach completion; crash/pause retry; validated CP-L1-ACTION, CP-L1-SERVICE and CP-L1-COMPLETE saves; acknowledged log; saved completion/Continue. Required-image failures recover through retry. Denied storage is honestly marked session-only. Confirmed New Game clears prior progress. The completion's Continue to Intake control reports the explicit M1 boundary and preserves the ending. Omega is contained and unreleased.

Original sprite riding, steering, slide, energy, turbo, jump, blade, civilian contact, drone behavior and audio compatibility remain. A localhost-only `?fixture=mechanics` runs actual drone/jump/blade regression without campaign progression or saves. The approved skyline/architecture, amber/cyan HUD, portraits, mobile controls and four-size layout are integrated. Portrait dialogue derives rider clearance from the actual card; passed roadside props use a bounded camera fade before their overhead bodies can intersect Jo; traffic continues naturally offscreen.

## Files changed

- Gameplay: `src/scripts/bastrop37.ts`, `src/scripts/bastrop37/delivery.ts`, `src/scripts/bastrop37/save.ts`.
- HUD/interface: `src/pages/bastrop37/index.astro`, `src/styles/bastrop37.css`, `src/scripts/bastrop37/hud.ts`, `src/scripts/bastrop37/contracts.ts`.
- Content: `src/scripts/bastrop37/delivery-content.ts`, `public/bastrop37/assets/delivery/`.
- Verification: `tests/bastrop37.spec.ts`, `tests/delivery-model.spec.ts`, `docs/bastrop37/phase3/` browser evidence and reproducible measurement/capture script. Home tests remain unchanged.
- Authority/results: `BUILD_STATUS.md`, current-authority notes in the operating plan and Phase 2/3 documents, and five Phase 3 worker/director/reviewer handoffs. Historical approvals/earlier review evidence are retained and labelled.

## Verification evidence

- Final `npm run build`: zero errors, warnings or hints from Astro check. Vite retains the existing large-chunk advisory. The build script's “Published isolated review” line copies local static files only; network publication was not part of that build check.
- `npm test -- --reporter=line`: **20/20 passed, 3.9 minutes**. This comprises 13 browser scenarios, 3 mission/save model cases and 4 home regressions.
- Additional touch-only fresh Delivery through saved ending and reload: **1/1 passed, 48.7 seconds**. These are 21 distinct tests covered, not a claim that a single final 21-test suite invocation occurred.
- After the portrait correction, `npx playwright test tests/bastrop37.spec.ts -g mobile --reporter=line`: **2/2 passed, 41.2 seconds**, including the long-card rider-clearance assertion and complete touch-only Delivery/save/reload. The later gantry-only drawing change is reviewed separately; it does not change mission/collision/input behavior.
- Browser scenarios use actual DOM/keyboard/touch input and frame-driven runtime, with read-only observation. They cover long reading, repeated Enter/focused button, pause, every line/beat, five actors removed only after natural offscreen exit, service misses/reload/log idempotence, actual collision/retry, saves/Continue, corrupt/denied storage, asset retry, New Game confirmation/reset, audio/gallery, mobile multitouch and retained mechanics. The completed save used for visual reload captures was earned by a full successful playthrough.
- Final opening/action/long-line/failure/saved-ending captures at **1440×900, 1280×720, 1024×768 and 390×844**: no horizontal overflow or page errors. Director viewed desktop action, mobile long dialogue and saved ending directly. Independent reviewer separately drove gate success/miss/loop/barrier contact and measured the longest mobile card clear of the full bike by about 27px.
- Independent review identified and prompted corrections to stale New Game saves, image-error bypass, skyline/rider scale, overwritten transient cues, portrait card overlap and a gantry near-camera pop. Final independent review captured 16 sequential steps through the gantry near plane: continuous camera fade, no hard pop, no beam/rider intersection. The fade is a deliberate sprite-rendering treatment, not literal 3D occlusion. All material findings are resolved.
- `phase3/measure-live.mjs` records actual headless Chromium frame samples and capture states in `phase3/live-measurements.json`. Across all four sizes, 175 sampled frame intervals per state averaged approximately 60fps for both opening reading and the first three seconds of live traffic, with p95 intervals 16.7–16.8ms. This is short local sampling on Apple M4/16GB, not sustained physical-mobile performance. Asset/resource download remains material; the measured initial game resources total about 23.57MB. No new dependency or asset optimization claim is made.

## Limits and exact next steps

The approved 13 lines contain 93 words. Ordinary action travel is roughly 15 seconds plus traffic drain, steering and manual reading. The planned 90–150 second first-player duration is **not established**; user playtest should judge readability, service cue clarity and pacing before adjusting encounter spacing. No physical mobile-device or cross-browser coverage is claimed. Rendering preserves the sprite/faked-depth approach; no new audio or 3D migration occurred.

The local preview remains at <http://127.0.0.1:4321/bastrop37/> (`node scripts/preview-test.mjs`, serving the built `dist`). Start Delivery; Enter/Continue advances dialogue, arrow/WASD steers, Shift turbos, Space slides, Alt/K jumps, Control/J opens blades. Mobile buttons support simultaneous inputs. Pause offers controls/log and checkpoint retry. Finish the service approach, reload and choose Continue Saved Ride to verify the saved ending. Continue to Intake intentionally stops at the M1 boundary.

**Publication complete:** commit `5709eaa` was pushed to `master`; GitHub Pages workflow [36361131703](https://github.com/vikram1092/vikram1092.github.io/actions/runs/36361131703) succeeded, and <https://vikramramkumar.me/bastrop37/> served the new Delivery page.

**Next action:** present the public Delivery link for user playtest. Fix reported M1 defects within the accepted scope; do not implement M2–M5.
