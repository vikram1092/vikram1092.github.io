# M1 dialogue HUD revision 1 — director integration handoff

**Accepted:** director and fresh independent reviewer find no remaining material issue; ready for root publication and user playtest.

2026-09-27. User playtest feedback requested a more distinctive speaking HUD related to the scene assets and activation anywhere on that card. This is a bounded M1 follow-up. Root owns the previously authorized publication flow after acceptance. No M2–M5, gameplay, story or save expansion occurred.

## Completed revision

The dialogue strip is now a bike receiver with a raised speaker dock, recessed text display, layered steel frame, asymmetric side plates and restrained amber/cyan channel identity. Existing neutral Vlad and Omega assets remain; Jo is text-only. One native `#advance` button covers the entire visible card, including its outer metal rim, channel label, portrait, words and continuation rail. Its name is Continue dialogue; its description includes speaker and full text. Enter/Space and the existing repeat guard remain. No screen-wide tap handler or nested interactive controls were added.

The initial candidate improved the frame but remained too close to the former flat strip. Director requested a stronger hardware pass and corrected its decorative outer rim being outside the native hit target. After the first HUD worker stopped, exclusive ownership transferred to a fresh configured HUD worker for the final pass. Source ownership remained limited to `src/pages/bastrop37/index.astro`, `src/styles/bastrop37.css` and `src/scripts/bastrop37/hud.ts`. Director owns `tests/dialogue-hud.spec.ts`, status and final capture integration; the fresh independent reviewer owns its report/evidence. Gameplay/mission/save/content/asset files are unchanged.

## Verification

- Final `npm run build`: zero Astro errors, warnings or hints; existing Vite large-chunk advisory remains. Build only writes local static output.
- `npx playwright test tests/dialogue-hud.spec.ts tests/bastrop37.spec.ts -g 'whole dialogue card|whole-card keyboard|outside the dialogue|fresh full Delivery|touch-only Delivery|fresh story waits|readable touch dialogue' --reporter=line`: **8/8 passed in 2.1 minutes**.
- Tests use actual browser input. Desktop/mobile taps on header, words, portrait, outermost visible rim and footer each acknowledge exactly once. Accessible name and speaker/text description pass. Held Enter/Space, slow reading and pause do not skip lines. Touch steering outside the card does not acknowledge. Existing desktop and touch-only full Delivery/save/reload flows and mobile simultaneous steering/slide pass.
- Final `node docs/bastrop37/phase3/hud-revision1/capture.mjs`: actual four-size long-line and saved-ending captures at 1440×900,1280×720,1024×768 and390×844; no page errors or horizontal overflow. Desktop text 18px, compact/mobile 16px. The longest mobile L1.03-05 line leaves **51.4px** between the rider bottom and card, and **17px** between card and D-pad.
- Director viewed actual desktop long Vlad and mobile long Vlad/Jo captures. Existing assets and full text remain clear; all hardware stays inside measured `#comms` so the existing rider-clearance calculation remains valid.
- `git diff --check` passes. Original published M1 evidence was preserved: screenshots produced by the regression run were archived into `phase3/hud-revision1/runtime-captures/`, then the original tracked capture files were restored from the clean baseline. Baseline public UI screenshots are retained alongside the revision.

## Acceptance and exact next steps

Director and fresh independent reviewer accept the source behavior and revised presentation. Reviewer independently inspected all four live layouts and long-line captures; measured identical card/native-button bounds; tapped portrait, text, header, tail and edge exactly once into L1.02 on desktop/mobile; and checked reduced-motion transition 0s. No material finding remains. BUILD_STATUS and worker handoffs are current. Return to root for the authorized commit/push/publication. No child agent has committed, pushed or deployed. Local preview: <http://127.0.0.1:4321/bastrop37/>. Public URL remains the prior slice until root publishes.

Physical mobile-device and assistive-technology testing are not claimed; Chromium desktop/mobile input and accessibility semantics are verified. Human artistic preference remains the user's playtest judgment. Stop at this M1 revision after handoff.


Exact playtest step after root publishes: open <https://vikramramkumar.me/bastrop37/>, start a new Delivery if the previous ending is saved, and tap/click the speaker card's frame, portrait, text or footer to advance one line. Enter/Space also work. Check the Omega/Vlad long exchange while riding, then finish/reload to retain the Delivery ending. Stop at M1.
