# Phase 2 HUD specifications

## Approved Delivery treatment — historical first visual gate

Isolated design production, 2026-09-27. This page does not integrate with or modify the live game. Static canvas snapshots establish composition, not gameplay, traffic-drain timing, collision, saves, or performance.

## Review

Serve the repository root with `python3 -m http.server 4178`, then open `http://localhost:4178/docs/bastrop37/phase2/`. Review navigation selects ACTION, STORY, LEVEL COMPLETE, or the equal-camera traffic comparison. The separate lower review section selects any of the 13 approved Level 1 dialogue lines and turbo state samples. URL parameters `?view=story&line=5` show Omega; `line=9` shows the longest Vlad line.

The view buttons and line selector are review tools, outside the game frame. Manual Continue/Enter advances the current authored exchange. Acknowledging L1.01-05 or L1.03-05 shows an action composition; the latter uses TAKE THE SERVICE LANE. Encounter progression itself is not simulated. Acknowledging L1.05-03 shows completion. CONTINUE TO INTAKE explains the end of this preview, without pretending live Level 2 gameplay exists; separate static Level 2 samples are available in the state selector. Pause displays an isolated menu sample.

## Composition

Desktop objective remains upper left; route/chapter and pause stay upper right. Energy, numeric speed, cargo and turbo cluster lower left in a slightly angled bike-instrument panel. Comms sit lower right. The central road gap, bike and traffic silhouettes remain separate from both clusters. Level 1 has no hostile markers, Overdrive requirement, or blade lesson. The inactive jump/blade labels are subordinate; turbo is the only previewed active ability.

At 390×844, dialogue is a full-width bottom band above separated touch targets. Jo's scene position moves higher, leaving the complete bike above the longest dialogue/completion card. Important dialogue uses 16px mobile, 17px at intermediate desktop widths, and 19px wide desktop. Small eyebrow/instrument labels remain subordinate. The mobile completion card never claims a saved checkpoint. Desktop identities are 56×56 CSS pixels; mobile identities are 46×46. The same neutral Vlad portrait is reused; Omega is one symbol; Jo uses text with no image slot.

HUD text uses solid near-white on dark backplates; amber distinguishes civic/objective information and muted cyan identifies local Omega. State labels and icons supplement color. There is no typing animation or automatic advance. Buttons and select controls have visible focus; Enter requires a fresh press; Escape dismisses the preview menu. Reduced-motion removes any CSS transitions/animations (the composition already remains static). Focused button activation uses native controls. Touch steering is shown for separation/target sizing only; it does not drive the mockup.

## Scene reuse

All skyline, road, scarlet rider and civilian traffic references point relatively to the existing `public/` assets. Display-only actor crops follow the companion asset manifest, excluding sheet fragments; source files and hitboxes are unchanged. A clipped Canvas 2D trapezoid, perspective road strips, independent 2D skyline/midground/prop layers, subtle procedural pavement seams/grit and grounded shadows establish depth. The first gate added no renderer migration, 3D, extra character production, audio, or later chapter art. The authorized full extension is documented below.

Traffic-approaching and road-cleared comparison canvases invoke the same camera function and geometry with only the traffic boolean changed. This proves static composition parity, not a working traffic exit system. Gate remains roadside dressing in this composition; authoring the actual service-lane approach geometry belongs to Phase 3.

## Runtime handoff — proposed, not implemented

Use existing `HudView` / `HudActions` in `src/scripts/bastrop37/contracts.ts` for Phase 3. Mapping: objective/routeCue → upper-left copy; speed/energy → instruments; turbo enum → ready/active/charging/unavailable labels; dialogue speaker/text → identity/full immediate text; dialogueIndex/count → small count; mode/state → action/story/completion layouts; saveStatus → truthful result copy only after gameplay confirmation. `advance`, `pause`, `resume`, and `continue` remain intention callbacks; HUD never derives mission progress or writes saves.

The present contract only exposes turbo state. If three independent ability states are required in future runtime integration, request gameplay-owned hooks before implementing them; never invent jump/blade readiness. Binding labels should be supplied by gameplay's actual keyboard/touch configuration. No runtime hooks were modified during this phase.

Save proposal lives outside the mockup: show “Saved” only after persistence succeeds; otherwise “Session only — progress could not be saved.” No storage is accessed here. The exact approved closure is DELIVERY APPROACH REACHED with CONTINUE TO INTAKE.

## Verification and limits

24 Chromium captures cover ACTION, Vlad STORY, Omega STORY, long Vlad STORY, LEVEL COMPLETE, and comparison at 1440×900, 1280×720, 1024×768 and 390×844. `captures/render-checks.json` records overflow, image and objective checks. Visual inspection checked readable full sentences, neutral portrait, Omega identity, actor crop cleanliness, visible rider and road corridor. `captures/contact-sheet.png` is a screenshot montage, not edited source art. Actual simulation, touch driving, save behavior, performance, oversized user font settings, and in-game traffic clearing remain unverified Phase 3 work.

The Delivery gate was approved before expansion. The bounded full package below now awaits final Phase 2 acceptance; Phase 3 implementation still requires explicit authorization.

# Full bounded Phase 2 extension

The approved Delivery treatment remains selectable. The separate STATIC PROPOSALS selector now exposes 37 chapter/state samples via stable `?sample=` URLs. These are illustrative view models, not an implemented campaign. No storage or simulation is invoked. The explicit save-success/save-failure views are mock states; the outside-frame label remains visible in captures. All source art remains content-owned and all live application files remain untouched.

## State and visibility map

| Samples | Visual state | Future gameplay gate |
|---|---|---|
| title | Start, checkpoint Continue sample, return to site | Start after pickup; Continue only for compatible checkpoint |
| drain | Existing cars, subordinate clearing cue, no dialogue | Stop new spawns; existing actors visibly exit; no premature road-clear claim |
| service | Blocked crossing, open service gate, marker beyond | L1.03 acknowledged; gate then approach marker before closure |
| l2-neutral | Neutral carrier and intake | Before scan trigger; no hostile label |
| l2-record-1/2 | Two separate equipment record cards | Cleared corridor; record 1 acknowledged before record 2 |
| l2-confrontation | All seven exact L2.02 lines | Both records acknowledged; admission precedes Jo's refusal |
| l2-lock | Active overlay, visible reused drone and directional evasion cue | Refusal acknowledged; steering escape always possible |
| abilities-* | Turbo/jump/blades ready, active, numeric cooldown, unavailable; optional Overdrive | Gameplay owns real availability/cooldown; story disables combat |
| l3-range/linking/out/linked | One local link meter and shared relay geometry | Link corridor validity; local readiness only, Omega contained |
| l3-complete | PUBLIC ROUTE READY; TAKE THE RESERVOIR ROAD | Both relays ready, closure acknowledged; never public release |
| l4-geography/record/order | Reservoir above lower road, closed shared barrier, bus, uphill civic route; local discharge record; exact Omega/Jo lines | Safe geography preview; record before Omega reports order |
| l4-controller/open | Marked controller, matching closed/open barrier | Controller disabled before opening and bus movement |
| l4-rescue/rescue-out | Three condition segments, in/out of range, visible drone interception direction | One segment per completed attack; out of range stops new attacks after current telegraph |
| l4-complete | EVACUATION ROUTE CLEARED; ENTER THE CIVIC DISTRICT | Bus safety and Jo ramp marker, cleared threats, closure acknowledged |
| failure | EVACUATION ROUTE LOST, checkpoint/level/menu | Zero bus condition; retry restores full condition |
| pause | Objective, controls, recent communications, settings, checkpoint restart/menu | Freeze action and story; clear held inputs on resume |
| save-success/failure | Saved / Session only — progress could not be saved | Explicit simulated result samples here; actual result must come from save callback |
| l5-section-a/between/section-b | Separate section labels, partial total progress, visible intermediate drone | A validates before B; interception cleared before B; both validate independently |
| l5-public | Public node, PUBLIC ACCESS ACTIVE, all three L5.04 lines | Both sections validated, 100% upload, corridor clear, release committed once |
| l5-dawn | Dawn, all three recovery lines; restored signal withheld | Release already committed; manual safe-road reading |
| l5-recovery | Protected travel with limited restored signal | All recovery lines acknowledged; travel toward harmless marker |
| l5-complete | BASTROP / PUBLIC ACCESS RESTORED; replay/title | Recovery dialogue acknowledged and harmless marker passed |

Chapter completion cards expose the exact approved labels. Transitions between review samples illustrate UI responses only: no encounter, timer, collision, or save event is actually executed. Title Continue is explicitly a checkpoint sample. Chapter Replay selects a chapter composition, rather than claiming to start a live campaign.

## Proposed additional data/events for Phase 3

Keep existing HudView/HudActions authoritative for already agreed fields. Request gameplay-owned optional structured fields before integration: `abilities` (per ability enum/cooldown fraction/binding); `overdrive` (charge/optional/availability); `record` (id, source, lines, acknowledgment index); `connection` (scope local/civic, section A/B, validated sections, per-section/overall progress, range); `escort` (condition 0–3, range, intercept direction, safety flag); `releaseCommitted`; `recoveryComplete`; checkpoint/load availability; and explicit save result. UI should receive these values, never infer release from a 100% local relay or mint progress from a button.

Proposed intentions: acknowledgeRecord, advanceDialogue, restartCheckpoint, restartLevel, selectChapterReplay, returnToTitle, updateSettings. These are documentation requests only, not a changed TypeScript contract. Public state requires `releaseCommitted`; replay should use independent run state. Full-phase settings controls are isolated native checkboxes and do not change persistent settings or create audio. Existing movement/attack bindings remain gameplay-owned; no new controls are proposed.

## Reproducible verification

Run a static root server, then `node docs/bastrop37/phase2/captures/capture-check.mjs`. Override base URL through `REVIEW_URL` if needed. The script captures all 37 samples at all four required viewports, records layout/image/browser diagnostics in `full-render-checks.json`, verifies receipt ordering plus seven-line confrontation, checks no premature public label in relay/upload states, and creates two representative contact sheets. Panel scroll diagnostics are reported for inspection; pause disclosure sections intentionally allow scrolling when expanded. These checks validate static UI and text transitions only.
