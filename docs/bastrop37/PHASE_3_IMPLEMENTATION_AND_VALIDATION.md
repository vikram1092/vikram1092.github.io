# Phase 3 — Implementation and validation

Current completion status (2026-10-04): the approved five-level campaign is implemented and locally accepted after independent review and81distinct passing scenarios across the full/focused runs. Authorized commit/push, normal Pages deployment and public verification are the remaining steps, followed by stopping. No further level or implementation phase is queued. Read BUILD_STATUS and handoffs/PHASE_3_CAMPAIGN_REPORT.md for exact results and limitations; historical gates below remain context.

Current authority (2026-10-04): the user explicitly approved all remaining stages and said to finish all levels, push and stop. Phase 3 M4 and M5, full campaign integration/review, commit/push and the normal GitHub Pages deployment are authorized. Complete the approved five-level campaign sequentially; no further milestone/publication permission is needed. Director owns orchestration and single-writer delegation. Earlier M3-only/acceptance/publication gates below are historical and superseded for this request.


Current authority (2026-10-01): the user explicitly said **“Yes begin M3.”** Phase 3 M3 implementation and validation are authorized through PUBLIC ROUTE READY, with Omega contained. M3 is now implemented and verified locally: 48/48 tests and independent review passed; see BUILD_STATUS and the M3 director/review handoffs for actual evidence and limitations. Stopped for user M3 acceptance. M4/M5 remain unauthorized; push/deploy require explicit publication approval after M3 acceptance. Director owns orchestration and single-writer delegation. Earlier audit/authority notes below are historical.

Historical pickup authority (2026-10-01, before M3 authorization): M2 was accepted by the user and published as `209ab59`; `939066d` records that approval. The current request authorizes a director-led pickup audit and M3 scope determination only. **M3–M5 remain unauthorized.** Ask for explicit M3 implementation/validation authorization; then stop at verified M3 for user acceptance. Push/deploy additionally require explicit publication approval after M3 acceptance. See [M3 scope handoff](handoffs/PHASE_3_M3_DIRECTOR.md). All prior authority notes below are historical.

Historical authority (2026-09-28): the user accepted M1 and requested continuing Phase3; root confirmed **M2 only**, stopping at its second review gate. M3–M5 and M2 publication require later authorization. Prior authority notes are historical.
Historical authority (2026-09-27): the user confirmed **“I approved it all”**, approving the full revised Phase 2 package, and authorized **Phase 3 M0/M1 only**. After M1 was verified, the user authorized pushing and publishing this slice. Stop after M1; no M2–M5.

Historical pre-authorization status: future engineering handoff for review. Phase 3, including M0/M1, starts only after Phase 1 and Phase 2 approval and explicit implementation authorization. The current request authorizes Phase 2 art/HUD production only; implementation remains gated. Primary owners: gameplay engineering, UI integration, and QA. Narrative and art approve fidelity to their reviewed material; the director resolves scope changes.

## 1. Context, authority, and non-goals

Read [the story bible](../../BASTROP37_STORY.md), [Phase 1](PHASE_1_NARRATIVE_AND_ENCOUNTERS.md), and [Phase 2](PHASE_2_ART_AND_HUD.md). Latest user decisions override the documents. Do not revive the original sea-wall slice through old task comments or tests.

The game begins after street kid Jo picks up a module for Mayor Vlad. Vlad is helpful in Level 1, betrays Jo in Level 2, and fights Jo's attempt to release Omega at the end of Level 5. Only those three characters speak. Bastrop is inland. The module holds a sealed Omega instance; it needs physical network access for public distribution.

Keep the current third-person sprite-based road rendering. No engine migration, new audio production, expanded character cast, open world, branching plot, on-foot play, or RPG systems. Existing mobile play remains functional while desktop is the main design target.

Numbers below are proposed starting values for playtesting, not promises of final balance. Record changes centrally and explain them in handoff notes.

## 2. Repository baseline and safe implementation boundary

| Existing file | Current responsibility | Planned treatment |
|---|---|---|
| `src/scripts/bastrop37.ts` | Mount, input, motion, traffic, drone phases, collisions, renderer, audio, UI, timed escape | Keep as entry point initially; extract only needed systems incrementally |
| `src/pages/bastrop37/index.astro` | Game page, controls, prototype overlay and telemetry | Replace play presentation with reviewed bike HUD; preserve route |
| `src/styles/bastrop37.css` | Game plus shared gallery styles | Scope game revisions; avoid unrelated gallery/portfolio regressions |
| `public/bastrop37/assets/` | Existing art and manifest | Reuse; version replacements; extend carefully |
| `tests/bastrop37.spec.ts` | Movement, collision, touch, drones, timed escape, audio checks | Retain valid coverage; replace obsolete story/countdown assertions |
| `playwright.config.ts` | Browser test configuration | Reuse project conventions |

Current prototype: constant 6,000 m finish and 90-second timer; fixed perspective road/skyline; random traffic plus authored first drones; keyboard/touch; immediate crashes; score; synthetic audio. These are observations from code, not a fresh hands-on quality assessment.

Available npm commands: `npm run check`, `npm run build`, `npm test`. Follow current repository instructions if they differ when implementation starts. Inspect working-tree changes first and do not overwrite concurrent work.

Do not add Three.js merely because it is already a dependency. Do not add Skia merely because it is allowed. Keep shaders optional until a specific visual requirement justifies their cost.

## 3. Responsibility map and shared interfaces

| Owner | Owns | Must coordinate with |
|---|---|---|
| Narrative / encounter | Beat order, line IDs/text, objectives, story flags, closure | Gameplay for solvable encounters; art for visible evidence |
| Gameplay | Simulation, traffic, mission state, collision, checkpoint snapshots | UI via stable events/view model |
| Art / rendering | Layered assets, manifest, projection integration, effects | Gameplay for footprint and collision alignment |
| HUD integration | Accessible controls, responsive layout, dialogue card/log, menus | Gameplay for state; narrative for copy |
| QA | Scenario tests, complete playthroughs, visual/performance evidence | All owners for reproducible defects |

One owner edits the main game entry point at a time. Content workers can supply level data and asset manifests independently once their schemas are agreed. Avoid several workers each introducing their own mission manager or dialogue state.

Suggested module boundaries, extracted when needed:

- `campaign`: level/beat definitions, completion events, checkpoint routing.
- `dialogue`: lines, speaker identity, cursor, acknowledgment and log.
- `encounters`: deterministic traffic patterns, drone exits, objectives.
- `hud`: one derived view model and input actions.
- `save`: schema validation and safe-boundary persistence.
- `render`: existing world projection and layered art, kept together initially.

Suggested location: `src/scripts/bastrop37/` beside the existing entry point. These names are proposed, not existing files. Do not perform a large refactor before proving the first slice.

## 4. Level data and event contract

Use the stable beat IDs in Phase 1. Keep dialogue outside frame update functions. A minimal conceptual schema:

```ts
type Speaker = 'jo' | 'vlad' | 'omega';
type BeatMode = 'story' | 'action' | 'drain' | 'resolve';
type Line = { id: string; speaker: Speaker; text: string };
type ObjectiveKind =
  | 'reach' | 'escapeLock' | 'link' | 'disableController'
  | 'protectVehicle' | 'release';
type BeatDefinition = {
  id: string;
  mode: BeatMode;
  environmentId: string;
  objective?: { id: string; label: string; kind: ObjectiveKind };
  dialogue?: Line[];
  encounterId?: string;
  completionEvent: string;
  nextBeat?: string;
  checkpoint?: string;
};
```

This is a design contract, not ready-to-paste complete implementation. Refine event names into a typed union during engineering. Validate unique IDs, legal speakers, asset references, reachable next beats, and valid checkpoints before a level starts. A missing required asset or invalid level should show a recoverable load error rather than start a broken mission.

Runtime events carry beat/object IDs so a delayed event from an old encounter cannot complete the new one. Examples: `dialogueComplete`, `routeMarkerPassed`, `recoveryLockBroken`, `relayLinked`, `controllerDisabled`, `vehicleSafe`, `uploadComplete`, `epilogueComplete`.

Events are idempotent: once a beat completes, repeated collision/link/frame callbacks cannot grant rewards again, replay dialogue, unlock two levels, or save conflicting states. Apply transitions at a controlled simulation boundary.

The Phase 1 encounter acceptance and checkpoint tables define the reviewed narrative prerequisites, retry boundaries, and final two-section order. Preserve those when turning these conceptual contracts into code.

Required campaign flags: `betrayalKnown`, `relayA`, `relayB`, `busSafe`, `omegaReleased`, completed level IDs. Only Level 5 upload completion sets `omegaReleased`; Level 3 sets relay readiness only.

## 5. Runtime modes and clocks

Keep top-level states for loading, title, active play, pause, failure, and completion. Within active play, use the four beat modes. Avoid several unrelated booleans that permit story dialogue and combat to run simultaneously.

Maintain separate quantities:

- Visual road scroll: can move during safe cruise.
- Mission route position: advances only in eligible action/travel beats.
- Encounter clocks: advance only during their active action beat.
- Dialogue cursor: advances on explicit input.
- Global pause: freezes all of the above, including animated dialogue progress where applicable.

Do not use the old total `distance` alone to finish a level. Do not let the old timer run invisibly during conversations. Remove the universal timer from the campaign; retain timers only in later authored objectives that explicitly need them. No new deadline is necessary for the first two levels.

Safe story road is a neutral reusable stretch. Do not hold a named building five meters ahead forever. Hold route progression before unique landmarks enter view, continue road texture/parallax loops, then resume authored placement after acknowledgment.

## 6. Traffic drain and dialogue sequencing

Algorithmic requirements:

1. Enter DRAIN: stop procedural and authored new spawns, cancel future attack schedules.
2. Existing civilian vehicles continue and leave the visible corridor; pursuers enter a visible disengagement path. Allow a brief action interval while actors remain nearby.
3. Do not silently disable an enemy's collision while it overlaps the rider. Transition to protected cruise only once the local corridor is clear.
4. If an actor stalls, use a safe visible exit trajectory or gradually widen separation; despawn only outside the camera. Never timeout-delete visible traffic.
5. Once corridor is clear, enter STORY, clamp Jo to safe lane bounds/cruise speed, disable combat activation, and display the first line.
6. Advance text with a dedicated action. Ignore repeats and require a fresh key/button press per line. Opening a dialogue must not consume the same input that triggered the preceding action.
7. On final acknowledgment, update objective, clear held/queued actions, show its cue, and grant an initial 1.5-second threat-free reaction interval before enabling the next attack.

Proposed desktop bindings: WASD/arrows steer/speed; Space slide; Shift turbo; J blades; K jump; Enter advance/continue; P/Escape pause; R checkpoint retry from failure. Preserve existing Ctrl/Cmd blade and Alt jump aliases where they do not interfere with browser shortcuts. Display the actual active mapping; offer remapping after the first slice if needed. No new Overdrive button.

Mobile: keep existing simultaneous steering/action controls; add an obvious advance/continue control during STORY, hide or disable combat actions, and prevent taps from leaking into the next mode. Maintain pointer-cancel and blur behavior.

Manual dialogue advance is the baseline. Essential text never auto-dismisses. Pause log contains acknowledged lines; on checkpoint reload restore narrative knowledge but avoid duplicating log entries.

## 7. Riding, aggression, and collision proposals

Do not retune everything before the story slice. Keep current handling initially, then tune the betrayal encounter.

Proposed Overdrive specification:

- Separate 0–100 Overdrive meter from ordinary turbo energy.
- First valid near pass per vehicle: +10; completed drone destruction: +35; clean landing over a marked obstacle: +15.
- Awards occur once per actor/event ID. Jumping on empty road and holding blades beside an already hit object grant nothing.
- At 100, the next eligible fresh turbo activation consumes Overdrive and performs a stronger burst. It does not require ordinary energy, adds no extra button, and cannot interrupt an active burst.
- Initial burst target: 1.5 seconds, roughly 15% above ordinary turbo target speed. Test collision readability before increasing it.
- Meter does not decay during reading or pause. No bonus from damaging civilians. Reset transient meter on checkpoint retry to that checkpoint's authored value to prevent farming.
- Keep the old turbo behavior when Overdrive is not ready. Show clearly which will fire.

Existing slides replenish energy; preserve that initially. Maintain jump cooldown, blade deployment, and clear enemy telegraphs. Do not make charge farming in a safe story segment part of play.

Collision refinement is a later milestone: retain accurate swept collision; add glancing-contact loss of speed only when contact geometry reliably distinguishes it from a full impact. Do not replace collision with unexplained invulnerability. Document thresholds and show a short scrape effect. Until tested, existing full-crash behavior can remain during foundation work.

Existing drone is the first enemy. A blocker or heavier defender requires a specific encounter need and clear behavior, not just more health. The carrier in Level 2 is a mission actor, not a new complex boss.

## 8. Mission mechanic specifications

### Delivery / reach

Use route marker passage plus prerequisite events. Cannot complete while necessary dialogue remains unread. Keep destination markers aligned to rendered geometry.

### Recovery lock escape

Carrier holds a readable relative road position during setup. After refusal, show lock zone and escape direction. Break lock by leaving its valid zone for an initial 1.5 seconds; offer both a lateral steering exit and turbo opportunity so depleted energy cannot block progress. Drone pressure must not block every escape lane. Leaving the zone resolves the objective whether the drone was cut or evaded.

### Relay connection

A projected node exposes a broad connection corridor. Progress advances while Jo is in valid range and grounded on the route; initial link duration 3 seconds. Corridor length must accommodate at least 5 seconds at ordinary cruise or the carrier/node must track relative depth during the encounter. Do not create a stationary target that passes before a link is physically possible.

Show in/out-of-range state. On departure, hold earned progress for that approach; return via authored service-loop transition if incomplete. Link completion is one-shot. First node has no enemy; second follows a readable interception. No literal map branching is required: route markers, a safe road strip, and a new approach can represent the loop.

### Roadblock controller

Separate controller from barrier. Controller has an unmistakable target cue and sits within tested blade reach on a safe adjacent path. A valid blade hit disables it once; barrier then visibly retracts. Never require Jo to crash into it. Missing it routes through a service-loop approach. Jo cannot advance through the barrier until open, but must always have a safe loop/exit path.

### Anonymous bus protection

Bus stays in a readable depth band and follows a fixed safe path. It cannot collide with Jo during scripted formation changes. Start with three clearly represented condition segments; each successfully telegraphed enemy hit removes one. At zero, show `EVACUATION ROUTE LOST` and retry the rescue checkpoint. No graphic civilian harm needed.

Enemy attacks have avoidable/interceptable windows; prevent repeated hits from a single attack. Jo can disable the attacker or enter the marked interception lane during its telegraph to retarget that pass onto Jo, then evade with established riding controls. Repeat the blade lesson on the safe L4.02 controller if combat was skipped earlier. An out-of-range rider permits at most one already-telegraphed bus strike; no fresh bus strike starts until Jo returns. Phase 1 specifies this authored behavior; it is not existing prototype functionality. Bus advances toward safety while Jo is within the escort range. If Jo leaves range, bus slows and HUD directs a return; it never vanishes or becomes unreachable behind the camera. Define range in shared world units and tune to the existing projection.

`vehicleSafe` fires only after required protection distance and safety marker passage. Then suppress further bus damage. Narrative completion also requires Jo reaching the civic ramp. No fourth speaker or escort-command interface.

### Final release

Require `relayA` and `relayB`, final controller open, and the civic corridor approach. Reuse link mechanics across exactly two authored sections, initially five valid grounded seconds each, with one drone interception between them. Clear that drone by destruction or visible disengagement before opening the final threat-free section. Both section validations are required; looping section A cannot substitute for section B. Tune durations for clarity.

Out-of-range pauses progress; crashes reload upload checkpoint. Hold progress through service-loop retries within the same attempt. Do not silently reset the meter because the player read a line or paused. At 100%, both sections validated, and corridor already clear, commit `omegaReleased` exactly once, immediately save the release checkpoint, and begin L5.04. No threat or collision failure remains after commitment. The upload-start checkpoint also requires the prior controller open and its defender cleared.

Post-release safe ride has no failure condition. Hold route progression during epilogue dialogue, then resume protected marker travel. Completion is the epilogue acknowledgment plus recovery marker. Reload after release resumes the epilogue, not a world where Omega is imprisoned again.

## 9. Persistence and level endings

Use a versioned local save containing campaign version, latest safe checkpoint ID, completed levels, story flags, acknowledged dialogue IDs/log, and control/settings preferences. Save stable milestone state, not arbitrary particles, frame counters, or positions mid-collision.

Checkpoint definitions contain safe actor layout, player position/speed/energy, route start, mission prerequisites, encounter seed, and dialogue cursor. Validate prerequisites against the checkpoint so a corrupted record cannot start Level 5 without relay readiness or place Jo inside a closed barrier.

Save on level completion, post-betrayal action start, completed first relay, rescue start, upload start, release success, and campaign completion. Write one atomic serialized record where practical. Handle unavailable/quota-limited storage: keep session progress and tell the player progress will not persist. Do not crash or claim a save succeeded.

On incompatible/corrupt save, offer a safe restart or last compatible level rather than silently deleting useful progress. Title offers Continue when valid, New Game with explicit reset confirmation, and unlocked chapter replay. Replay should use a separate run snapshot and must not roll back campaign completion.

Level ending order: objective achieved → DRAIN → closure dialogue → persist completion → show continue → load next level → start safe opening checkpoint. If next-level assets fail, keep the completed save and provide Retry Load / Menu. Never erase completion because a download failed.

## 10. Integration milestones — do not build all at once

### M0 — Baseline and contracts

Inspect current worktree, run appropriate baseline checks, record existing failures, agree level/asset/HUD schemas. Mark old story copy as replacement targets. Do not spend this milestone rebuilding rendering.

Exit evidence: file ownership, schema sample for L1.01, list of existing tests to retain/replace, and a playable baseline.

### M1 — Delivery proof, approximately 90–150 seconds

Implement L1.01–05 using existing vehicles/road plus the minimal Phase 2 kit. Add story/action/drain/resolve, dialogue card, objective, traffic clearing, and one saved level ending. Shorten action distances to review pacing; include all essential story facts. No combat, Overdrive, escort, relay, or shader rewrite required.

Exit evidence: desktop and mobile video/captures, a fresh run and restart, manual text advance at slow reading speed, no visible despawns, and save/continue verification. User reviews tone and rhythm here before expansion.

### M2 — Delivery to betrayal

Build Level 2, carrier scan/receipt, refusal checkpoint, drone escape, and Overdrive prototype. Extend HUD ability states and replace the prototype villain transmission. Establish truthful evidence and make Vlad's change clear through text/actions.

Exit evidence: continuous L1–L2 playthrough, repeated combat retries without repeated revelation, escape by attack and by evasion, and clear distinction between ordinary turbo and Overdrive. This is the second review gate.

### M3 — Public connection

Build Level 3 and the reusable link/loop mechanic. Add only its environment kit and relay states. Preserve Omega containment.

Exit evidence: link first try, miss and recover, pause/slow frame, and restart after first relay. All lead to a valid relay-ready state, never public release.

### M4 — Inland rescue

Build Level 4, bus, controller, staged water, and protection rules. Reuse controller in preparation for finale. No water physics or extra cast.

Exit evidence: all rescue failure/retry paths, bus never stranded offscreen, clear inland geography, visible barrier opening, and no reward for civilian hits.

### M5 — Release and campaign integration

Build Level 5 and post-release ride. Finish chapter replay, safe saves, responsive HUD, asset loading, and consistency passes. Tune glancing collision and pacing only with evidence from integrated play.

Exit evidence: complete fresh campaign; reload at every milestone; replay without progress rollback; finale cannot trigger early; recovery persists. Report unfinished polish honestly.

Milestones are independently reviewable. Passing M1 does not authorize silently producing every later asset or deploying the whole game. Ask for unresolved creative changes, not routine implementation details already specified here.

## 11. Verification matrix

| Scenario | Expected result |
|---|---|
| Fresh start | Jo already carries module; Vlad helpful; no pickup scene, Voss, sea-wall timer, or hostile intro |
| Hold advance key | One line per fresh press; no whole conversation skipped |
| Slow reader | Safe cruise persists; no enemy, deadline, escort damage, or route overrun |
| Story-to-action input | No held key fires unintended attack; objective visible before danger |
| Drain with drone nearby | Visible disengagement; no pop-out, collision during text, or infinite wait |
| Pause/blur/resize | All active simulation and dialogue progression freeze; inputs clear on resume |
| Level 1 finish | Approach reached and exchange read before completion; Level 2 not entered automatically |
| Betrayal retry | Evidence/order retained, action restarts safely, no duplicate rewards |
| Level 3 finish | Relay flags set, `omegaReleased` false |
| Miss relay/controller | Safe repeat approach; no unreachable target or permanent softlock |
| Bus damaged / left behind | Explicit condition/range feedback; recover or retry checkpoint |
| Upload dropout | Progress pauses; service loop available; release never premature |
| Reload after upload | Omega remains released; resume safe epilogue |
| Storage unavailable | Session remains playable; persistence limitation communicated |
| Missing new-level asset | Recoverable load failure; completed progress retained |
| Mobile multitouch | Steering + action works; story advance does not trigger combat; no horizontal overflow |
| Reduced motion / low effects | Story, warning shapes, and controls fully readable |
| Gallery and homepage | Navigation and shared styles remain intact |

Use deterministic encounter seeds in authored levels and test fixtures. Keep meaningful movement/collision/jump/drone tests. Replace obsolete 90-second/6-km/sea-wall assertions with beat and completion assertions; do not delete useful coverage merely to make tests pass. Audio tests may remain as compatibility coverage; no new sound feature work.

Run `npm run check`, `npm run build`, and relevant Playwright scenarios for changed systems. Full campaign integration warrants the full relevant suite. Do not rerun broad checks repeatedly without new changes or concerns.

Visual QA must include gameplay, story, failure, and level ending at desktop and mobile sizes. Capture ordinary traffic and cleared road, not only menu screenshots. Verify readable portrait/text, marker alignment, alpha edges, layering, and absence of coast imagery.

Performance target: aim for stable 60 fps on the agreed desktop test machine; report actual hardware/browser, frame times, memory, and loaded asset size. Establish baseline before setting hard budgets. Mobile should remain responsive; reduce optional effects before changing gameplay. Do not claim performance based only on static screenshots or software-rendered CI.

## 12. Required worker handoff

Every completed milestone report must include:

- What is implemented and which beat/asset IDs it covers.
- Files changed and schemas/interfaces altered.
- Test commands, outcomes, and any pre-existing failures.
- Screenshots or short captures at the required states/viewports.
- Save compatibility and known limitations.
- Any departure from the reviewed narrative, art, or tuning defaults and why.
- Exact next milestone and unresolved questions, without presenting proposals as implemented facts.

Do not claim all five levels are finished because infrastructure exists. Do not publish based on an old prototype instruction alone. Preserve unrelated website work. Keep source documents synchronized if approved implementation changes alter story facts or shared contracts.
