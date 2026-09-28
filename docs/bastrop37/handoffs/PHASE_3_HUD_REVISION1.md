# Phase 3 M1 HUD revision 1 handoff

2026-09-27. Authorized user feedback: make the speaking HUD feel like the detailed Bastrop art and make its entire visible card tappable. Scope remains the verified Delivery slice; M2–M5 are not authorized.

## Implemented

- Changed the speaking surface into one native `#advance` button inside measured `#comms`. Its header, portrait/symbol dock, full dialogue text, and Continue fascia all activate the existing `actions.advance()` listener. There are no nested controls or screen-wide click handlers. The button has a Continue accessible name, references both visible speaker and full dialogue text through `aria-describedby`, and accepts native Enter/Space. Gameplay still handles key repeat and all mission state. The visible 3px/2px rim is part of the button's own hit surface.
- Styled the card as a raised bike receiver with an asymmetric worn steel frame, angled outer shape, enlarged speaker dock, deep inset text display, channel/status rail, edge plates, hardware details, and integrated action strip. Vlad retains the one neutral portrait, Omega the one approved symbol, and Jo remains text only. Speaker color and labels identify channels without implying early betrayal.
- Kept required gameplay DOM IDs and scoped all new styles to `#bastrop-game`. The asset gallery and portfolio have no style changes.

## Verification

`npm run check` on the initial candidate: zero errors, warnings, or hints. After the stronger visual pass, `git diff --check` passed on all three assigned source files; source inspection confirmed one `#advance` click listener and the two referenced description IDs. Director reports the final targeted browser regression suite passed **8/8 in 2.1 minutes**: desktop/mobile outer rim, header, portrait, text and footer each advanced exactly once; accessible speaker/text description; Enter/Space repeat, slow reading and pause behavior; mobile steering outside the card; desktop full Delivery/save; and touch full Delivery/save/reload with multitouch. Director reports final render captures at 1440×900, 1280×720, 1024×768, and 390×844 with no page errors or horizontal overflow; dialogue is 18px on wide desktop and 16px on compact layouts. In the longest mobile Vlad L1.03 line, measured rider clearance is 51.4px and card-to-D-pad clearance is 17px. Director inspected final 1440 long Vlad and 390 long Vlad/Jo captures and accepted the stronger receiver treatment pending independent review. Independent review remains pending; director owns final build/integration record. Baseline public captures before this revision are in `phase3/hud-revision1/baseline-1440.png` and `baseline-390.png`; they do not depict revised behavior.

## Next steps

1. Independent reviewer checks the final composition, focus and touch affordance.
2. Director records final build/integration result and decides M1 playtest readiness. No publication or later chapter work is in this handoff.


## Director final acceptance addendum

Fresh independent review accepted this final revision for user playtest with no material finding. It independently verified four live layouts and long lines, equal native-button/card bounds, desktop/mobile card-region taps advancing exactly once, and reduced-motion transition0s. Director's eight final browser regressions and build pass. This supersedes pending-review language above. Root now owns authorized commit/push/publication and public verification; the director/workers stop at this M1 revision. No screen-reader or physical-device run is claimed.


Exact playtest step after root publishes: open <https://vikramramkumar.me/bastrop37/>, start a new Delivery if the previous ending is saved, and tap/click the speaker card's frame, portrait, text or footer to advance one line. Enter/Space also work. Check the Omega/Vlad long exchange while riding, then finish/reload to retain the Delivery ending. Stop at M1.
