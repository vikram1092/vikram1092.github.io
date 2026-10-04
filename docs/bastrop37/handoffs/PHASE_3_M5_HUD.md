# Phase 3 M5 HUD source handoff

## Bounded recovery copy repair — 2026-10-04

Independent review found that protected postrelease recovery travel used the old DRAIN instrument fallback, TRAFFIC CLEARING, despite having no traffic. In `hud.ts`, `view.omegaReleased` now renders SAFE CRUISE in the drive instrument and suppresses the TRAFFIC CLEARING fallback feedback. Gameplay-supplied recovery message remains authoritative. Earlier chapters retain their existing drain wording. This is a source change pending director rebuild and independent recheck; no browser result is claimed here.

2026-10-04. The user authorized completion and publication of the approved campaign. This handoff covers only the assigned M5 page, scoped style and HUD source. Integrated validation remains with the director and independent reviewer.

## Implemented source

- `src/scripts/bastrop37/hud.ts` renders L5 chapter branding/menu copy, existing blade/jump and controller states, section A/B connection states, and the one gameplay-owned `missionMeter` for total upload. The HUD never derives upload, release or replay eligibility. `omegaReleased` alone changes the module stamp and Omega receiver to public channel/identity. Before commit both keep module identity.
- Completed campaign or completed chapter replay hides ordinary Continue. `#chapter-picker` appears only in ready/title or complete states with gameplay-supplied unlocked chapters; only those native chapter buttons are shown. Each button sends `HudActions.replay(chapterId)`. `#replay-badge` reads active replay state. New Game still calls its action only after explicit confirmation; the prompt now says it clears saved campaign progress. Cancel only closes the confirmation.
- `src/pages/bastrop37/index.astro` adds IDs for the module stamp, one replay badge, a five-button chapter picker with stable `data-replay-chapter="L1"` through `"L5"` selectors, and the explicit reset warning. The whole-card receiver, record acknowledgment and chronological log markup remain intact.
- `src/styles/bastrop37.css` adds only `#bastrop-game` scoped replay menu/badge styles, including compact mobile buttons. Earlier chapter meter, road, receiver, touch controls, portfolio and gallery styles remain in place.

## Source verification and remaining evidence

- Read story/Phase 1 L5, Phase 2 revision-v3 HUD states, M5 director/gameplay/content handoffs, frozen contract, and current owned source.
- `git diff --check -- src/pages/bastrop37/index.astro src/styles/bastrop37.css src/scripts/bastrop37/hud.ts` passed. Source inspection finds a single mission progress meter and shows that public receiver/stamp copy is guarded by `view.omegaReleased`.
- No worker build, tests, browser interaction, visual measurements, or publication were run. Integrated 1440×900, 1280×720, 1024×768 and 390×844 states, mobile replay picker, public identity, whole-card control, focus and reduced motion still require director/reviewer verification.

## Integration notes

1. Gameplay should send `omegaReleased` for the active ride/replay scene. An earlier chapter replay from a completed durable campaign must show contained module identity until its own release event, if any.
2. Gameplay owns exact `replay.unlocked`, `campaignComplete`, `missionMeter` total upload, connection `kind:'upload'` and section state. The chapter picker uses only those fields and does not grant a chapter or save progress.
3. Director should verify title and replay completion hide Continue; canceling New Game leaves the durable campaign intact; public channel/stamp appears only after committed release; L1–L4 and whole-card history remain intact. Independent reviewer inspects actual four-size composition.

## Director integration acceptance — 2026-10-04

The assigned source/data is integrated and locally accepted in the complete campaign. Final production build checked25files withzero diagnostics; independent M5 browser/visual review passed after the documented dawn/copy repairs. All81distinct scenarios have passing evidence across the80-pass full run and4/4 focused rerun after a test-driver READY wait; production source was unchanged for that rerun. Fresh L1–L5 completion has50spoken/3records/53history and reloads correctly. Static exact-content/source-copy checks remain valid. Performance, payload, remaining playtest limits and exact publication pickup are consolidated in PHASE_3_CAMPAIGN_REPORT.md. Worker-specific verification limits above remain accurate; the director's integrated evidence is separate. No further worker production is queued.
