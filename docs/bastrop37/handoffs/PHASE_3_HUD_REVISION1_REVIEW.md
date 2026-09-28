# Phase 3 M1 dialogue HUD revision — independent review

2026-09-27. **Verdict: accepted for user playtest. No material finding remains in this bounded dialogue HUD revision.** Scope was the published Delivery slice's communication card and its input behavior. This review did not authorize or assess M2–M5.

## Reviewed result

The final card has a raised speaker dock, recessed text screen, asymmetric metal frame, speaker-specific amber/cyan accents, and one visible advance cue. This is a stronger bike receiver treatment consistent with the approved v2/v3 worn hardware direction. Jo remains text-only; Vlad uses the neutral portrait and Omega the symbol. The card does not obscure the complete rider or mobile steering controls in the inspected states.

The final DOM uses one native `#advance` button around the visible header, portrait, text, action cue, footer, and rim. It contains no nested controls. `#comms` and `#advance` have identical measured bounds at all four inspected sizes; the earlier decorative dead rim is gone. The button's accessible description includes speaker and line text. CSS contains a visible focus treatment and a reduced-motion rule; reduced-motion evaluation returned a zero-second transition. A screen reader was not exercised.

## Independent evidence

- Inspected the actual final game at 1440×900, 1280×720, 1024×768, and 390×844. My final captures and measurements are in [review evidence](../phase3/hud-revision1/review/) (`final-*.png`, `final-geometry.json`). All four had no page errors or horizontal overflow. Dialogue text measured 18px at 1440/1280 and 16px at 1024/390.
- Inspected final actual-size long-line captures for desktop, compact desktop, Omega, and Vlad. Text, portrait/symbol, frame details, and cues stayed readable. At 390×844, the first-line card ran y600–757, touch controls started y774, and the rider ended y506.4. The inspected mobile long-line capture also kept the rider above the card.
- In fresh desktop and mobile browser runs, I activated portrait, line text, header, footer, and the visible lower rim in sequence. After one 32ms frame per action, IDs advanced exactly `L1.01-02`, `-03`, `-04`, `-05`, then beat `L1.02`; the card hid at the action transition. Reduced-motion transition duration was `0s` in both runs. These were independent spot checks of the whole-card target, not a complete campaign test.
- The director separately reported 8/8 targeted browser regressions passing, including native button rim/header/text/portrait/footer activation, keyboard repeat and Space behavior, slow reading, pause, outside mobile steering, full desktop Delivery, and touch-only Delivery/save/reload/multitouch. Those broader results are director evidence, not tests I independently reran.

## Files and limits

I changed only this report and files under `docs/bastrop37/phase3/hud-revision1/review/`. I did not modify production code, story, or assets. Initial-candidate screenshots in that review directory document the superseded flat/dead-rim design; `final-*` files are the accepted candidate. I did not verify a physical device, screen-reader announcement, sustained performance, or later chapters. Those are not acceptance claims here.

**Next step:** present this bounded revised Delivery slice for user playtest. Keep M2–M5 gated by separate user authorization.
