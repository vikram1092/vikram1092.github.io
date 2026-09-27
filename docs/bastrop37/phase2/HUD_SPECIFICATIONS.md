# Delivery HUD proposal — Phase 2

Isolated design production, 2026-09-27. This page does not integrate with or modify the live game. Static canvas snapshots establish composition, not gameplay, traffic-drain timing, collision, saves, or performance.

## Review

Serve the repository root with `python3 -m http.server 4178`, then open `http://localhost:4178/docs/bastrop37/phase2/`. Review navigation selects ACTION, STORY, LEVEL COMPLETE, or the equal-camera traffic comparison. The separate lower review section selects any of the 13 approved Level 1 dialogue lines and turbo state samples. URL parameters `?view=story&line=5` show Omega; `line=9` shows the longest Vlad line.

The view buttons and line selector are review tools, outside the game frame. Manual Continue/Enter advances the current authored exchange. Acknowledging L1.01-05 or L1.03-05 shows an action composition; the latter uses TAKE THE SERVICE LANE. Encounter progression itself is not simulated. Acknowledging L1.05-03 shows completion. CONTINUE TO INTAKE explains the end of this preview, without pretending Level 2 exists. Pause displays an isolated menu sample.

## Composition

Desktop objective remains upper left; route/chapter and pause stay upper right. Energy, numeric speed, cargo and turbo cluster lower left in a slightly angled bike-instrument panel. Comms sit lower right. The central road gap, bike and traffic silhouettes remain separate from both clusters. Level 1 has no hostile markers, Overdrive requirement, or blade lesson. The inactive jump/blade labels are subordinate; turbo is the only previewed active ability.

At 390×844, dialogue is a full-width bottom band above separated touch targets. Jo's scene position moves higher, leaving the complete bike above the longest dialogue/completion card. Important dialogue uses 16px mobile, 17px at intermediate desktop widths, and 19px wide desktop. Small eyebrow/instrument labels remain subordinate. The mobile completion card never claims a saved checkpoint. Desktop identities are 56×56 CSS pixels; mobile identities are 46×46. The same neutral Vlad portrait is reused; Omega is one symbol; Jo uses text with no image slot.

HUD text uses solid near-white on dark backplates; amber distinguishes civic/objective information and muted cyan identifies local Omega. State labels and icons supplement color. There is no typing animation or automatic advance. Buttons and select controls have visible focus; Enter requires a fresh press; Escape dismisses the preview menu. Reduced-motion removes any CSS transitions/animations (the composition already remains static). Focused button activation uses native controls. Touch steering is shown for separation/target sizing only; it does not drive the mockup.

## Scene reuse

All skyline, road, scarlet rider and civilian traffic references point relatively to the existing `public/` assets. Display-only actor crops follow the companion asset manifest, excluding sheet fragments; source files and hitboxes are unchanged. A clipped Canvas 2D trapezoid, perspective road strips, independent 2D skyline/midground/prop layers, subtle procedural pavement seams/grit and grounded shadows establish depth. No renderer migration, 3D, extra character production, audio, or later chapter art.

Traffic-approaching and road-cleared comparison canvases invoke the same camera function and geometry with only the traffic boolean changed. This proves static composition parity, not a working traffic exit system. Gate remains roadside dressing in this composition; authoring the actual service-lane approach geometry belongs to Phase 3.

## Runtime handoff — proposed, not implemented

Use existing `HudView` / `HudActions` in `src/scripts/bastrop37/contracts.ts` for Phase 3. Mapping: objective/routeCue → upper-left copy; speed/energy → instruments; turbo enum → ready/active/charging/unavailable labels; dialogue speaker/text → identity/full immediate text; dialogueIndex/count → small count; mode/state → action/story/completion layouts; saveStatus → truthful result copy only after gameplay confirmation. `advance`, `pause`, `resume`, and `continue` remain intention callbacks; HUD never derives mission progress or writes saves.

The present contract only exposes turbo state. If three independent ability states are required in future runtime integration, request gameplay-owned hooks before implementing them; never invent jump/blade readiness. Binding labels should be supplied by gameplay's actual keyboard/touch configuration. No runtime hooks were modified during this phase.

Save proposal lives outside the mockup: show “Saved” only after persistence succeeds; otherwise “Session only — progress could not be saved.” No storage is accessed here. The exact approved closure is DELIVERY APPROACH REACHED with CONTINUE TO INTAKE.

## Verification and limits

24 Chromium captures cover ACTION, Vlad STORY, Omega STORY, long Vlad STORY, LEVEL COMPLETE, and comparison at 1440×900, 1280×720, 1024×768 and 390×844. `captures/render-checks.json` records overflow, image and objective checks. Visual inspection checked readable full sentences, neutral portrait, Omega identity, actor crop cleanliness, visible rider and road corridor. `captures/contact-sheet.png` is a screenshot montage, not edited source art. Actual simulation, touch driving, save behavior, performance, oversized user font settings, and in-game traffic clearing remain unverified Phase 3 work.

Phase 2 acceptance must precede later assets or Phase 3 implementation. Next: review the isolated treatment, resolve visual feedback, then await explicit phase authorization.
