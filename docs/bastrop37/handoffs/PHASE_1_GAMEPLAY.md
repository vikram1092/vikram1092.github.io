# Phase 1 gameplay feasibility handoff

Date: 2026-09-27. Owner: encounter/gameplay review. Status: **proposed specifications, read-only source assessment; no gameplay implemented or playtested**.

Assignment: review all five levels and recommend solvable actions, safe reading, retries, checkpoints, and completion. Only this handoff is edited. The director integrates accepted wording into Phase 1. Phase 2 production and Phase 3 implementation require their own authorization; existing M0/M1 status notes are not Phase 1 approval.

## Read and inspected

- `BASTROP37_STORY.md`; `PHASE_1_NARRATIVE_AND_ENCOUNTERS.md`; Phase 2 asset/render/HUD contracts; Phase 3 state, encounter, save, and validation contracts.
- Read-only: `src/scripts/bastrop37.ts`, `src/scripts/bastrop37/contracts.ts`, `tests/bastrop37.spec.ts`, and `docs/bastrop37/BUILD_STATUS.md`.
- Preserve the existing IDs: L1.01–L1.05, L2.01–L2.04, L3.01–L3.04, L4.01–L4.04, L5.01–L5.05. No new beat or dialogue IDs proposed here. Only Jo, Vlad, Omega speak. Equipment labels are system text.

## Feasibility conclusion

The five levels are feasible within the existing projected-road/sprite model. They do not need a branching map, new player controls, physics water, new audio, or a 3D engine. They do need new authored mission state and safe actor behavior; current source does not implement the campaign.

Highest-priority clarifications for Phase 1 integration:

1. **L4.02:** repeat a safe blade/controller lesson even if L2.03 was completed solely through evasion. Otherwise the first mandatory attack is untaught.
2. **L5.02:** corridor entry requires both the controller open and defender cleared through destruction or evasion. Opening the barrier alone must not load an unsafe upload checkpoint.
3. **L5.03:** arrange the last connection section as already clear of threats before release commits. This resolves the conflict between immediate persistent release and a collision still possible during subsequent drain.
4. **L5.05:** acknowledge dialogue on a held neutral road, then resume harmless travel to the recovery marker. A marker cannot be required to pass while all mission-route progress remains held.
5. **L2.03:** leaving the lock zone is the requirement; turbo is a taught option, not a required resource gate. Keep a lateral steering exit available.
6. **L3.02–03 / L5.03:** provide physical connection time, not merely a small stationary object with a progress meter. Use marked road-length corridors and repeat approaches.

## Shared proposed encounter rules

### Progress and recovery

Each event names its active beat, object, and checkpoint attempt. Accept it once and reject stale callbacks. Marker passage counts only across the marked valid lane/corridor, with prerequisites satisfied. Overrunning a missed target always leads to a signposted service-loop approach; never require reversing or collision with a closed gate.

Each action starts from a deterministic safe layout, predictable actor sequence, grounded bike, no held inputs, and sufficient ordinary energy. Crash restarts its latest safe checkpoint. Retry restores authored transient resources and encounter seed rather than allowing reward farming. Acknowledged revelations remain acknowledged. No mandatory action requires Overdrive, jump, a drone kill, or a score threshold, except the explicitly taught controller blade hit in L4.02 and its reuse in L5.02.

“Loop” means an authored neutral strip and repeat approach on the same linear road renderer. It does not require a visible junction or a free navigation system. The failed target must leave view before the new approach appears. Preserve partial link progress within an attempt, but restore the checkpoint's authored progress after a crash.

### Traffic drain and safe reading

At each DRAIN, stop all spawns and future attack schedules. Existing cars continue off camera; hostile actors take visible nonattacking exit trajectories that keep collision valid until separated. Canceling an imminent attack must show a disengagement motion. Never copy the prototype's instant traffic clearing or drone depth teleport for narrative drain.

Start STORY only when no active actor can enter Jo's bounded reading corridor. The carrier may remain as distant, safely separated scene context in L2.02, not as an overlapping collision object. If traffic stalls, visibly separate it; no timeout deletion while visible. Hold the mission route before the next unique landmark appears. Road texture/parallax continues, Jo cruises with bounded steering, and combat, deadlines, escort harm, spawns, and link changes stop. Pause freezes both visual simulation and dialogue.

One fresh advance action acknowledges one full line or receipt; key repeat, held touches, and the previous combat input cannot advance text. After the last acknowledgment, show the changed objective, clear inputs, and grant the Phase 3 proposed 1.5-second threat-free reaction interval. The equipment receipt in L2.02 gets its own deliberate reading step; it adds no speaker and does not replace a dialogue line.

RESOLVE follows success → visible drain → closure acknowledgment → completion save → explicit continue. No next-level encounter starts behind the completion overlay. Save failure permits session progress with truthful feedback. Failed next-level loading retains completed progress and offers retry/menu.

## Beat-by-beat proposed acceptance

Rows below refine the existing draft; they are not implemented behavior. `CP-...` labels are proposed checkpoint names within existing beats, not new beat IDs. Every story-only row permits indefinite reading without failure; reload resumes its saved safe boundary and retains acknowledged narrative knowledge.

### Level 1 — Delivery

| Beat | Prerequisite and success | Miss/failure/recovery |
|---|---|---|
| L1.01 | Fresh start already carrying module. Complete all five lines and present steering on clear road. No required stunt or elapsed-time threshold. Save `CP-L1-ACTION` after acknowledgment. | Reading never fails. A steering demonstration is an opportunity, not a key-specific gate that blocks mobile. Reload opening safely if not yet acknowledged. |
| L1.02 | L1.01 complete. Pass the two authored gap sections and dead-signal marker; turbo prompt follows first gap. Ordinary steering/cruise can complete all sections. | Collision retries `CP-L1-ACTION`. A missed optional turbo demonstration is not failure. Gaps retain a visibly reachable opening; no adjacent lane-change traffic closes every path. Drain before L1.03. |
| L1.03 | L1.02 complete and traffic clear. Acknowledge all five lines; update objective to TAKE THE SERVICE LANE. Save `CP-L1-SERVICE` before action. | Wait indefinitely; no service gate or obstruction passes unseen during reading. Retry of following action does not repeat Omega's introduction. |
| L1.04 | L1.03 acknowledged. Cross service-gate plane inside its marked open corridor. Gate and route show Omega's advice was useful. | A missed entrance leads to a safe repeat service approach; a closed crossing has an escape path before it. Crash retries `CP-L1-SERVICE`. Optional jump obstacle retains a wide steering bypass and is omitted from the smallest first slice. |
| L1.05 | Gate passage and delivery-approach marker latched before drain; road clear; all three closure lines acknowledged. Save Level 1 complete and show CONTINUE TO INTAKE. | No accidental entry into L2 while reading. Hold a neutral stretch after the approach marker; do not freeze the sign in front of Jo. Failed save keeps session completion, failed L2 load keeps L1 completed. |

The L1.04 exit should contain a short safe approach-marker segment before L1.05 reading starts. This makes the approach requirement explicit without moving a unique marker through a held story road.

### Level 2 — Betrayal

| Beat | Prerequisite and success | Miss/failure/recovery |
|---|---|---|
| L2.01 | L1 completed and explicit continue. Safe opening; acknowledge three lines before the neutral carrier approach. Save `CP-L2-SCAN`. | Reading safe. Carrier is not labeled hostile before the scan. Missed approach repeats at safe relative spacing. |
| L2.02 | Enter broad scan zone; latch receipt event once. Drain traffic, hold carrier safely separated, then show receipt and seven lines. Final refusal sets `betrayalKnown`; save `CP-L2-ESCAPE` with no active lunge. | No unavoidable damage, module loss, or scan deadline. Leaving scan zone before trigger gives another approach. After trigger the revelation cannot be evaded or triggered twice. A crash before completed reading returns to safe scan/revelation boundary, never a hostile mid-sentence scene. |
| L2.03 | Refusal acknowledged. Show lock boundary and steering exit. Remain outside the valid lock zone for an initial continuous 1.5 seconds, then pass the pursuit-corridor exit marker. One drone offers cut or evasion. | Reentering the lock zone resets only the short break timer. Missing a cut does not block escape. Exhausted turbo still permits a lateral exit; ordinary energy recovers as currently. Crash retries `CP-L2-ESCAPE` without repeating betrayal. After escape, all pursuers visibly disengage. |
| L2.04 | Lock broken, pursuit marker passed, traffic clear. Acknowledge four lines; save Level 2 complete and show RIDE TO THE RELAY. | No residual carrier tether or drone damage while reading. Retry/load failure retains `betrayalKnown`. |

Keep Overdrive optional. A single cut does not necessarily fill the proposed meter, so do not promise a ready burst after one cut. Explain a reward only after immediate danger, using brief feedback or a safe opportunity; it cannot become an essential tutorial paragraph over combat. No L2 completion gate depends on charge farming.

### Level 3 — Public Access

| Beat | Prerequisite and success | Miss/failure/recovery |
|---|---|---|
| L3.01 | L2 completed, `betrayalKnown`. Three lines explain two proximity links and the later civic requirement; save `CP-L3-A`. | Hold first relay beyond view until acknowledged; no node expires during reading. |
| L3.02 | Acknowledge L3.01; first corridor has no attacker. Accumulate initial 3 seconds grounded inside valid corridor; set `relayA` once and visibly light the node. Save `CP-L3-B` with A linked and B empty. | Leaving corridor pauses earned approach progress. End-of-corridor before completion leads to service loop; no reset within attempt. Crash before A links retries `CP-L3-A`. No attack or Overdrive prerequisite. |
| L3.03 | `relayA` true. One drone precedes second safe corridor. Destroy it or evade until it visibly exits; repeat same 3-second connection. Set `relayB` once, then drain. | Link lane cannot be occupied by an unavoidable lunge. Missed/interrupted approach loops with progress retained; crash retries `CP-L3-B`, preserving A. Enemy death is not a relay prerequisite. |
| L3.04 | Both relays linked, road clear, `omegaReleased=false`. Four lines acknowledged; save Level 3 complete; TAKE THE RESERVOIR ROAD. | No upload/release state inferred from lit local relays. Reload preserves both readiness flags and containment. |

Geometry acceptance: a corridor supports at least 5 seconds of grounded ordinary cruise for a 3-second link. At the prototype's 260 world units/second, a stationary longitudinal corridor needs roughly 1,300 world units, distinct from HUD distance units (`distance += speed*dt/3.6`). Author a visible road-length corridor/approach that streams through view; the entire length need not fit onscreen. Turbo may shorten one pass, but cannot make the loop unrecoverable. Final dimensions require Phase 3 playtesting; the calculation is feasibility evidence, not tuned balance.

### Level 4 — Lockdown

| Beat | Prerequisite and success | Miss/failure/recovery |
|---|---|---|
| L4.01 | L3 completed; relays ready; Omega contained. Show safe bus/spillway geography and acknowledge three lines. Save `CP-L4-CONTROLLER`. | No flood countdown or bus damage during reading. Staged rising-water art does not create an unannounced deadline. |
| L4.02 | Show actual blade binding and marked controller on a safe adjacent pass. Required blade hit disables controller once; barrier visibly retracts fully before bus enters. Save `CP-L4-ESCORT`, bus full condition at safe start. | Repeat blade lesson even if L2 cut was skipped. Controller is within measured blade reach without body contact. Missed hit leads to open service-loop exit before closed barrier; crash retries `CP-L4-CONTROLLER`. No bus harm until escort begins. |
| L4.03 | Roadblock open; fresh escort checkpoint. Jo stays in marked escort band while one drone threatens the bus. Bus safety marker and Jo civic-ramp marker are both required. Latch bus safety and suppress future bus damage immediately when bus reaches safety. | Leaving range slows/stops bus progression and prompts return; bus remains reachable. Three clearly displayed condition segments; one segment per completed uncountered telegraphed attack, never per frame. Zero means EVACUATION ROUTE LOST, retry `CP-L4-ESCORT` with full bus condition. Jo crash also retries there. Reaching ramp before bus cannot complete beat. |
| L4.04 | Bus safe and Jo at ramp; threats visibly cleared. Four lines acknowledged; save Level 4 complete and show ENTER THE CIVIC DISTRICT. | If bus reaches safety first, suppress attacks and allow Jo a safe ramp approach. Neither marker can become unreachable; missed ramp approach repeats. |

Recommended bounded draw-off rule for L4.03: before each bus-targeted attack, mark one accessible interception lane with a brief steering cue. Entering it during the telegraph makes the drone lock onto Jo for that pass; normal steering/turbo evasion or blades then resolves the established attack. No escort command or new button. If Jo misses that cue and does not cut the drone, a single completed strike removes one bus segment. A fresh attack needs a new telegraph and recovery window. The first cue must leave time to read and steer before a strike. This is a future mission-specific target-selection rule, not current drone behavior.

For an out-of-range rider, the drone may finish one already telegraphed bus attack, then no new bus-targeted attack begins until Jo returns to escort range. This avoids offscreen unavoidable failure while retaining consequence for a missed attack. Keep the bus in a noncolliding parallel path during formation shifts; collision suppression is an authored spatial separation rule, not a vehicle phasing through Jo. Numeric escort band, telegraph duration, and travel length remain future tuning values.

### Level 5 — Release

| Beat | Prerequisite and success | Miss/failure/recovery |
|---|---|---|
| L5.01 | L4 completed, `relayA && relayB && busSafe`, Omega contained. Three lines acknowledged; save `CP-L5-CONTROLLER`. Show connection cues before danger. | Invalid prerequisite save returns to a compatible safe checkpoint/load recovery. Never silently grant missing flags. |
| L5.02 | Disable controller; barrier fully open; defender destroyed or visibly evaded out of corridor. Only then save `CP-L5-UPLOAD`, grounded with energy and empty upload. | Missed controller loops; a missed drone cut permits evasion. Crash retries `CP-L5-CONTROLLER`. Open barrier alone cannot advance while defender still attacks. |
| L5.03 | Recommended concrete scope: two consecutive marked link sections, each requiring 5 valid grounded seconds, for 10 seconds total. Section B unlocks after A validates; only one intercepting drone between sections. Final B approach begins after it exits/is destroyed and collision corridor is clear. Both section validations plus 100% upload set `omegaReleased` once and immediately save `CP-L5-RELEASED`. | Dropout pauses per-section progress. Missed section loops to that incomplete section, retaining earlier validated progress in the same attempt. No double-counting one section as two. Crash before release retries `CP-L5-UPLOAD`, upload reset to authored start. No threat may remain to cause a post-commit collision. |
| L5.04 | Durable/session release committed and road clear. Show three-line closure and PUBLIC ACCESS ACTIVE. | Reload from `CP-L5-RELEASED` resumes safe closure/epilogue with Omega released, even if loading occurs before any line was acknowledged. Storage failure truthfully limits persistence but does not roll back session release. |
| L5.05 | L5.04 acknowledged. Safe story stretch for three lines; then harmless travel to recovery marker with restored signals/lights. Both acknowledged exchange and marker passage save campaign completion once. Offer replay/title. | No timer, traffic collision, attack, or bus failure after release. Slow reading holds route; slow riding remains safe. Reload keeps release and resumes unfinished recovery. Replay uses separate run state and cannot relock Omega in the completed campaign. |

Two sections is a scope recommendation resolving Phase 3's “two or three” option. It reuses proximity linking, ordinary riding, the existing drone, and controller blade input. It adds no final-boss ability or asset. Each section should have margin beyond its required 5 seconds at ordinary cruise, using the same geometry acceptance method as L3.

## Reusable source versus future work

| Read-only source evidence | Reuse or limitation |
|---|---|
| `bastrop37.ts:36–44`, `:603` road projection/strip renderer | Reuse shared x/z projection for route bands, props, carrier, bus. Background art remains noncolliding. No renderer migration justified. |
| `:145`, `:162–169`, `:202–218` input clearing, pause/blur, keyboard/touch | Reuse input clearing and mobile pointer cancellation. Dialogue advance/mode restrictions are future integration. Current default blade/jump aliases differ from proposed J/K additions; display actual bindings. |
| `:268–284`, `:493–504` opaque-body overlap and swept approach/steering | Reuse meaningful collision basis; new controller footprints and bus formations still require validation. Do not infer tested geometry from a painted marker. |
| `:344–400` drone approach/flank/signal/lunge/recover | Reuse telegraph and attack/evasion vocabulary. Existing recover can reattack and eventually assigns `z=-100`; it is not an acceptable guaranteed visible narrative exit. |
| `:411–435` turbo, energy recovery, jump, blades, slide | Existing controls suffice. Mandatory lock escape needs a steering fallback. Overdrive is future optional work, not current turbo behavior. |
| `:447–454` authored pursuit clears some traffic immediately | Do not use this as DRAIN implementation: it removes actors inside the visible approach and introduces two drones, unlike the proposed single-drone lesson. |
| `:446–467` procedural random traffic; `:58–59`, `:406`, `:520` 90 seconds/6,000 m | Replace campaign advancement with beat events and deterministic encounters only in authorized Phase 3. Random prototype traffic cannot prove authored solvability. |
| `:64`, `:141` localStorage mute only; `:146–156` full reset | No campaign checkpoint/save observed in mounted source. Current R retry resets the run. |
| `src/scripts/bastrop37/contracts.ts` | Contains typed HUD/dialogue/beat-mode proposal; mounted script does not import it. It is not proof of working STORY/DRAIN/RESOLVE or saves. Preserve concurrent file. |
| `tests/bastrop37.spec.ts` | Existing movement, collision, touch, jump, blades, drone, pause/audio cases are useful future regression coverage. Timer/sea-wall assertions describe old behavior. No campaign acceptance test execution claimed here. |

## Verification performed and remaining acceptance

Performed: read source and planning documents; checked all 22 existing beat IDs and progression prerequisites; traced success, miss, crash, slow-reading and reload boundaries on paper; compared proposed connection duration to existing world-speed units. Only the owned handoff was written. No runtime tests, builds, screenshots, asset edits, or gameplay claims are part of this Phase 1 review.

Future Phase 3 acceptance must include: L2 escape without cutting or turbo; L4 first blade lesson after L2 evasion-only play; missed controller without crashing into barrier; link miss/dropout and paused/reloaded progress; bus out-of-range and all three damage segments; final section repeated without duplicate upload; reload immediately after 100%; slow reading through every ending; visible drain with stalled traffic and drone recovery; mobile simultaneous controls and fresh dialogue taps. Existing collision/pause tests alone cannot establish these behaviors.

## Unresolved decisions for director

1. Adopt the proposed repeat blade lesson at L4.02 and lateral lock escape at L2.03; both close teachability/resource softlocks without adding controls.
2. Select the bounded L4.03 draw-off target rule above, or specify an equally concrete alternative. “Draw off” is otherwise not a testable action in current code. Recommended rule uses steering and current drone attacks.
3. Adopt two 5-second final sections and a threat-free last connection approach, resolving section count and post-release safety. Alternative three sections adds encounter length without a new narrative purpose.
4. Adopt the L5.05 separate acknowledgment then safe-marker travel ordering and the proposed checkpoint boundaries. Numeric widths, escort range, encounter lengths and telegraph timing are Phase 3 tuning, not Phase 1 blockers.

Exact next step: director integrates accepted rules into `PHASE_1_NARRATIVE_AND_ENCOUNTERS.md`, records any rejected alternatives, and requests Phase 1 review. Do not begin Phase 2 production or M0/M1 runtime work from this handoff.
