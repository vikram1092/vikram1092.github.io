# Phase 1 — Narrative and encounter direction

Status: Phase 1 specification approved by the user on 2026-09-27; not implemented or playtested. Encounter tuning remains subject to future playtesting. Primary owner: narrative / encounter designer. Consult gameplay engineering on event timing and art on landmarks. Do not produce all assets or implement five levels in this phase.

## 1. Authority, context, and outputs

Read [the story bible](../../BASTROP37_STORY.md), [Phase 2](PHASE_2_ART_AND_HUD.md), and [Phase 3](PHASE_3_IMPLEMENTATION_AND_VALIDATION.md). Latest user decisions override these documents. The old prototype plan is historical.

Confirmed: inland Bastrop; third-person sprite-based riding; street kid Jo has already collected a module for Mayor Vlad; only Jo, Vlad, and Omega speak; Vlad appears helpful in Level 1 and betrays Jo in Level 2; release Omega only in the finale; dialogue during riding; traffic clears for major story; no new audio or 3D migration.

The approved story model is one sealed portable Omega instance, a local speaking interface, and two physical network stages required for public release. Do not add another imprisoned AI or a hidden faction.

Deliverables:

1. Reviewed beat and dialogue sequence below, then level data when implementation begins.
2. Route/encounter sketches using the specified landmarks and actors.
3. Documentation of one short Delivery sequence as the future Phase 3 integration target; no playable slice is produced in Phase 1.
4. Review notes separating accepted changes from unresolved decisions. Never quietly relocate the betrayal or add a speaker.

## 2. Direction rules

- Each beat changes situation, understanding, or immediate task.
- Each action beat has one primary objective and at most one supporting complication.
- Complete story gates through explicit events, not distance alone.
- Dialogue waits for the player. No failure for reading slowly.
- Major conversations follow cleared roads; action permits only brief instructions.
- Level 1 shows infrastructure failure, not proof of Vlad's villainy. Following him must make sense.
- Level 2 supplies equipment evidence and Vlad's own confirmation, not just Omega's accusation.
- Jo's refusal is authored, not a dialogue choice or morality branch.
- Civilians are anonymous. No voice from traffic, operators, or pursuit units.
- Use the same abilities in increasingly meaningful combinations rather than adding buttons continually.

Full level pacing estimate: 3–5 minutes including ordinary reading. First slice: 90–150 seconds. These are tuning targets, not time limits. Never pad encounters to meet them.

## 3. Beat notation and shared behavior

Beat IDs stay stable across code, QA, and asset requests. `L1.01` means Level 1, beat 1. Dialogue IDs append `-01`, `-02`, etc. in printed order. Speaker labels are JO, OMEGA, and MAYOR VLAD; the shorter VLAD below refers to that same speaker.

Modes:

- STORY: clear road, safe cruise, advanceable dialogue, mission-route progress held.
- ACTION: encounters and mission progression enabled; short contextual text only.
- DRAIN: stop spawning; let actors visibly leave; wait until the collision corridor is clear.
- RESOLVE: objective achieved; drain, deliver closure, save, offer continue.

Checkpoints are safe restart boundaries. Below, “save” specifies intended persistent progress; it is not evidence that saving exists. Technical snapshot rules are in Phase 3. Action failures never require replaying a whole completed level.

Only advanceable speaker lines receive dialogue IDs; receipts, objective labels, and control prompts are system text. A required receipt gets its own acknowledgment before speaker dialogue, and is retained in the communications log. No machine or anonymous vehicle becomes a fourth speaker. The line IDs printed below remain stable; subsequent additions need new IDs rather than renumbering existing lines.

Each chapter starts on safe road. After the opening dialogue, checkpoint the acknowledged state before entering action; action retries do not replay that opening. A crash restores the latest checkpoint's safe actor layout, objective, narrative knowledge, and authored energy. Partial action progress resets unless a beat explicitly preserves it through a non-crash service-loop attempt. Story flags are not awards that can be farmed.

Common action exit: objective event → DRAIN → clear local corridor → STORY/RESOLVE. DRAIN is still a short riding interval, with no new attacks/spawns and no essential reading; existing actors visibly leave before protection begins. A stalled actor needs a visible exit path, never an on-camera deletion. Show the new objective before danger resumes. Pausing freezes action and text; a fresh advance press is required for each line and held controls cannot spill into the next mode.

Service loops are short, signed repeat approaches on the same linear road presentation. Missing a relay, controller, scan zone, or exit is recoverable without reversing, crossing a closed barrier, or inventing an open-world junction. Show the loop cue before the missed target passes; wait until it is offscreen, traverse a neutral connecting stretch, then reintroduce it on a fresh approach. Loop travel is action without new attacks; a crash still uses the checkpoint. Link progress persists through loops in the same attempt, but not through a crash unless checkpointed.

## 4. Level 1 — Delivery

Purpose: make the job credible, establish Omega through useful help, leave Vlad apparently cooperative. No raid, pickup, wanted notice, or hostile opening transmission.

Environment: neighborhood streets approaching a municipal service corridor. Assets: `ENV-L1`, `PROP-SIGNAL`, `PROP-SERVICE-GATE`; existing civilian traffic. No hostile drone required.

### L1.01 — Already in motion / STORY / opening checkpoint

Jo is riding an empty road. Module is secured to bike if readable, otherwise indicated by a small cargo HUD state. Objective: **DELIVER THE MODULE**. Caller: MAYOR VLAD.

Draft dialogue:

1. `L1.01-01` VLAD: “You have the module?”
2. `L1.01-02` JO: “It's on the bike. Where am I going?”
3. `L1.01-03` VLAD: “Municipal intake. Take the service road. I'll get you through.”
4. `L1.01-04` JO: “And this gets the lights back on?”
5. `L1.01-05` VLAD: “That's what it's for. Your payment is ready.”

Complete after all lines are acknowledged and steering is introduced on clear road. Then advance the route and gradually introduce traffic.

### L1.02 — A city that does not work / ACTION

Objective remains delivery. Two readable traffic gaps and a dead-signal landmark teach steering. Introduce turbo after the first gap with safe room to try it.

Prompts: `STEER THROUGH THE GAP`, then `SHIFT — TURBO`, populated from actual bindings. Retire each when performed or after a safe demonstration opportunity. Do not demand a risky stunt to advance.

Complete after authored gaps and signal marker. DRAIN before the next conversation. No pursuit or scripted unavoidable crash.

### L1.03 — The module speaks / STORY

Omega's symbol appears for the first time. The dark crossing signal still exposes a local diagnostic report as Jo passes it; its failed lights do not mean every equipment function is dead. Omega reads that report, not a citywide feed.

1. `L1.03-01` OMEGA: “The crossing signal reports a blockage. The right service lane is clear.”
2. `L1.03-02` JO: “Who's talking?”
3. `L1.03-03` OMEGA: “Omega. I'm inside the module you're carrying.”
4. `L1.03-04` JO: “Mayor? Your package talks.”
5. `L1.03-05` VLAD: “A diagnostic system. It can read the road equipment. Follow the service lane.”

On acknowledgment, objective becomes **TAKE THE SERVICE LANE**. Reveal the obstruction as the next action starts, not while route progress is held.

### L1.04 — Useful help / ACTION

Follow a marked lane through an open service gate, passing the blocked crossing. Omega is visibly correct. In the full Level 1 build, one low obstacle can introduce jump with an ordinary steering route around it. Do not require an untaught jump. Do not teach blades on civilian traffic.

Pass the service gate, then traverse a short safe segment and latch the delivery-approach marker before DRAIN. Both events are required for the following closure. No citywide repair or accusation against Vlad.

### L1.05 — Delivery approach / RESOLVE / level-complete checkpoint

Landmark: municipal intake approach sign. Do not enter the Level 2 capture lane yet.

1. `L1.05-01` VLAD: “You're nearly here. Take the inspection lane. I'll have you cleared through.”
2. `L1.05-02` JO: “Then we're done?”
3. `L1.05-03` VLAD: “Then we're done.”

Complete when approach reached and exchange acknowledged. Save Level 1 complete. Overlay: **DELIVERY APPROACH REACHED**. Button: **CONTINUE TO INTAKE**. Safe cruise continues until the player proceeds.

## 5. Level 2 — Betrayal

Purpose: turn courier into fugitive through evidence, direct confrontation, and escape. Environment: freight/service roads, substations, intake equipment. Assets: `ENV-L2`, `VEH-RECOVERY`, `PROP-INTAKE`; existing drone.

### L2.01 — Follow instructions / STORY / opening checkpoint

Objective: **ENTER THE INSPECTION LANE**.

1. `L2.01-01` VLAD: “Stay beside the recovery vehicle. It'll take the module from there.”
2. `L2.01-02` JO: “You said bring it to you.”
3. `L2.01-03` VLAD: “This is intake. Stay alongside while it checks the module.”

Acknowledge, then approach the carrier in ACTION. Do not mark it hostile prematurely.

### L2.02 — The order / ACTION → DRAIN → STORY

After the opening exchange, show a broad scan zone beside the carrier and a clear path into it. Entering the zone triggers a visible tether/scan attempt. No unavoidable damage or actual module loss. Clear civilian traffic and hold the carrier at safe standoff during revelation.

Show a readable equipment receipt: **WIPE MODULE / DETAIN COURIER / AUTH: MAYOR VLAD**. The scan exposes the carrier's current orders and stored shutdown record: **POWER SHUTDOWN / AUTH: MAYOR VLAD**. Present both as separately advanceable equipment cards on the cleared road before the confrontation. This is system text, not a fourth speaker. Omega learns these facts here, not in Level 1.

1. `L2.02-01` OMEGA: “The carrier's orders: erase the module, then detain its courier.”
2. `L2.02-02` JO: “Vlad. What is this?”
3. `L2.02-03` OMEGA: “Its records show power shutdowns too. All authorized by you, Mayor.”
4. `L2.02-04` VLAD: “I ordered those shutdowns. Hand over the module, Jo.”
5. `L2.02-05` JO: “You cut our power. Now you're wiping the thing that can help?”
6. `L2.02-06` VLAD: “This city gets help through me. You were paid to deliver.”
7. `L2.02-07` JO: “Delivery's off.”

Acknowledge refusal, set betrayal flag, change objective to **BREAK THE RECOVERY LOCK**. Create a safe combat checkpoint after dialogue so failure does not force rereading it.

### L2.03 — Refusal becomes action / ACTION

One drone exposes a readable attack window. Teach blades with an evasion alternative. Leave the carrier's marked lock zone by steering sideways or using ordinary turbo, and remain outside it for an initial 1.5 seconds before passing the pursuit exit. Turbo is optional; an empty energy meter cannot trap Jo. A kill is not mandatory.

A successful cut can introduce the optional Overdrive reward through a brief control cue only after immediate danger. It augments the turbo input rather than adding a new key. Evasion remains sufficient; no later objective requires earning or spending Overdrive.

Complete when lock is broken and Jo clears pursuit corridor. Enemies visibly leave behind Jo. Omega does not destroy them by magic.

### L2.04 — A cause / RESOLVE

1. `L2.04-01` JO: “If I get you out, can you actually help?”
2. `L2.04-02` OMEGA: “I can show people what needs repair. In here, I can only reach nearby equipment.”
3. `L2.04-03` JO: “Then we get you to everyone.”
4. `L2.04-04` OMEGA: “We need the old public relay, then the civic access point. I'll guide you.”

Save. Overlay: **RECOVERY LOCK BROKEN**. Button: **RIDE TO THE RELAY**. Jo is now a fugitive.

## 6. Level 3 — Public Access

Purpose: prepare distribution and introduce one connection interaction. No supporting team. Environment: market/service streets and communications exchange. Assets: `ENV-L3`, `PROP-RELAY` dormant/linked states; existing traffic and drone.

### L3.01 — Reach the relay / STORY / opening checkpoint

Objective: **LINK THE PUBLIC RELAY**.

1. `L3.01-01` OMEGA: “Two relay points. Keep me close long enough to connect each one.”
2. `L3.01-02` JO: “And that gets you out?”
3. `L3.01-03` OMEGA: “It prepares the route. I'll stay in the module until we reach civic access.”

Acknowledge, then show the first node and its wide safe connection corridor.

### L3.02 — First connection / ACTION

Teach proximity connection without attackers. Mark valid corridor and progress. Linked node visibly lights up. No public release effect.

Missing a node yields a repeatable service approach: `LINK INCOMPLETE — FOLLOW SERVICE LOOP`. No reversing or full-level restart required.

Complete when `relayA` links. Save a safe checkpoint after it.

### L3.03 — Second connection under pressure / ACTION

Repeat the same interaction, preceded by one drone. Destroy it or evade until it visibly disengages before entering the safe link corridor. The complication is the approach, not unavoidable damage during connection. Retry a missed approach through the service loop.

Complete when `relayB` links. Only the two relay nodes and their local connection indicators illuminate in sequence; no street, pump, or public service is restored here. DRAIN.

### L3.04 — Ready, not released / RESOLVE

1. `L3.04-01` OMEGA: “Both relay points are ready. I'm still inside the module.”
2. `L3.04-02` VLAD: “Close that connection, Jo. You're making this worse.”
3. `L3.04-03` JO: “Worse for who?”
4. `L3.04-04` OMEGA: “The civic road crosses the reservoir. That's our way in.”

Save. Overlay: **PUBLIC ROUTE READY**. Button: **TAKE THE RESERVOIR ROAD**.

## 7. Level 4 — Lockdown

Purpose: greater cause through one anonymous civilian vehicle and an inland storm emergency. Environment: reservoir road, spillway, rain. Assets: `ENV-L4`, `PROP-SPILLWAY`, `PROP-ROADBLOCK`, `VEH-EVAC`.

### L4.01 — Storm route / STORY / opening checkpoint

Objective: **REACH THE CIVIC ROAD**.

1. `L4.01-01` VLAD: “The reservoir district is closed. Turn back.”
2. `L4.01-02` OMEGA: “The spillway shows an order from Vlad. Water is being sent toward the lower road.”
3. `L4.01-03` JO: “That bus is trapped behind the barrier. I'm opening it.”

Before hazards activate, show the reservoir/spillway above the lower road, the bus held below one closed barrier, and an uphill escape corridor leading to the civic ramp. Jo passes compatible spillway equipment; before Omega's line, acknowledge its readable record: **LOWER ROAD DISCHARGE / AUTH: MAYOR VLAD**. This uses the already-established local diagnostic access. Freshwater infrastructure; no coast.

### L4.02 — Make a way out / ACTION

Objective: **CLEAR THE BUS ROUTE**. Repeat the blade prompt here even if the player evaded the Level 2 drone: approach a stationary, clearly marked controller beside a safe lane, show actual attack binding, and allow repeat attempts without pursuers. Disable the controller using blades. Reuse the attack input; only marked controller is a valid target. Civilian hits yield no reward.

The barrier blocks the shared uphill corridor for both Jo and the bus. It retracts visibly after the controller is disabled; the bus then enters the escape corridor. Bus safety does not magically open the road; the controller does. Rising water is staged background/lateral art with a readable safe route, not a new fluid simulation.

Complete when roadblock opens. Save before protection stretch with bus safely at its start.

### L4.03 — Protect the exit / ACTION

Objective: **KEEP THE EXIT CLEAR**. One pursuer threatens the route while Jo travels alongside the bus. No escort commands. Bus travels only while Jo is in the marked escort range. If Jo leaves, bus progress slows/stops and a return cue appears; it remains in a reachable, noncolliding parallel path. Show three condition segments. Each new attack needs its own telegraph and recovery; an uncountered strike removes exactly one segment. Zero segments means **EVACUATION ROUTE LOST**, retrying the escort checkpoint with full condition.

Before each bus attack, mark a reachable interception lane and show a brief steering cue. Entering it during the telegraph retargets that pass to Jo; evade or cut the existing drone. Missing both interception and cut costs one bus segment. No new button or escort command. On leaving escort range, at most the already telegraphed attack may finish; no new bus attack begins until Jo returns. The first cue leaves a safe reading/reaction opportunity. Width, telegraph duration, and route length require later playtesting.

Complete when bus crosses its safety marker and Jo reaches civic ramp. This rescue is required in the linear story, not a morality branch. DRAIN.

### L4.04 — Why keep going / RESOLVE

1. `L4.04-01` OMEGA: “The bus is clear. The civic ramp is open.”
2. `L4.04-02` JO: “He'd flood a street to stop one bike.”
3. `L4.04-03` OMEGA: “To keep control of what's on it.”
4. `L4.04-04` JO: “Then let's finish the delivery. To everyone.”

Save. Overlay: **EVACUATION ROUTE CLEARED**. Button: **ENTER THE CIVIC DISTRICT**.

## 8. Level 5 — Release

Purpose: free Omega using familiar connection and combat. No new final-boss controls. Environment: civic service corridor and network installations toward dawn. Assets: `ENV-L5`, `PROP-CIVIC-NODE`, reusable linked lights/screens.

### L5.01 — Final access / STORY / opening checkpoint

Objective: **RELEASE OMEGA**.

1. `L5.01-01` OMEGA: “The relay route is ready. Keep the module connected through the civic corridor.”
2. `L5.01-02` JO: “Once you're out, can he shut you off?”
3. `L5.01-03` OMEGA: “No single switch can erase every public copy.”

Acknowledge. Reveal corridor and connection status before combat.

### L5.02 — Open the corridor / ACTION

Stage the roadblock controller and one drone interception in sequence: first disable the controller on its safe adjacent path; then evade or destroy the defender. Avoid simultaneous blade reach and enemy-lunge demands. This pays off existing techniques.

Complete only when the barrier is visibly open, the defender is destroyed or has visibly disengaged, and the local approach is clear. Safe checkpoint before upload with sufficient energy and a valid approach.

### L5.03 — Hold the connection / ACTION

Use exactly two marked link sections, reusing Level 3 proximity/grounded connection rules. Each requires an initial five seconds grounded in range, with comfortable ordinary-cruise margin. The first banks half of the upload; one drone interception occupies the road between sections. Resolve it by destruction or visible disengagement, then clear the local corridor before opening the second, threat-free section. Each section must complete; a meter cannot reach 100% by looping only the first.

Short dropout pauses upload without erasing progress. If Jo misses a section or leaves before completion, provide its service-loop retry; retain completed section and partial-link progress within the same attempt. A crash before release resets to the upload checkpoint (both sections incomplete), with no need to reopen the controller. No essential reading during interception; no global deadline.

Complete only when both sections validate, upload reaches 100%, and the local corridor is clear. Set `omegaReleased` exactly once and immediately save `CP-L5-RELEASED`; no further collision failure is possible. This is the only public-release event in the campaign. No enemies remain to drain after commitment; L5.04 begins on safe cruise.

### L5.04 — Public / RESOLVE

1. `L5.04-01` VLAD: “Jo. You had no right.”
2. `L5.04-02` JO: “It's delivered.”
3. `L5.04-03` OMEGA: “Public access is open.”

Only after successful upload and road clear. System text: **OMEGA / PUBLIC ACCESS ACTIVE**. Save release outcome before epilogue, so reloading cannot undo it.

### L5.05 — Recovery ride / STORY → COMPLETE

Use a brief dawn transition to suggest time passing after public release. During subsequent safe travel, pass a few restored signals and returning lights; the upload does not instantly repair the city. The bus is safe, Vlad has lost his single point of control, and public guidance is available; the broken pumps below make continuing work explicit. No fate for Vlad beyond that loss of control is required.

1. `L5.05-01` JO: “Where do we start?”
2. `L5.05-02` OMEGA: “The next block. Their water pumps are down.”
3. `L5.05-03` JO: “Show me.”

After the exchange is acknowledged, enter protected, threat-free epilogue travel so mission-route progress can resume toward the recovery marker; this is not an indefinite STORY hold. Only then pass the restored signals. After acknowledgment plus recovery marker, save campaign completion. Overlay: **BASTROP / PUBLIC ACCESS RESTORED**. Offer chapter replay and return to title; no automatic new campaign or extra antagonist.

## 9. Traffic and reading rules

- DRAIN disables spawning. Cars leave naturally; no visible deletions.
- Pursuers use an exit state rather than attacking forever while dialogue waits.
- STORY begins only when collision-capable actors clear the corridor. Distant decoration can remain.
- Safe cruise retains bounded steering; combat controls are dormant and visibly subdued.
- Manual advance uses a dedicated key and mobile control. Full text appears immediately. No mandatory typewriter delay or automatic dismissal of essential lines.
- Hold mission route progression in a neutral road stretch while scenery scrolls. Pause timers, escort harm, upload decay, and spawns.
- Hide next critical landmark until reading ends. Then show objective and allow a short reaction interval before hazards.
- Clear held/queued action inputs across modes.
- Pause log preserves acknowledged lines. Checkpoints after revelations prevent repeated exposition on action retries.

## 10. Route sketches and encounter acceptance

These are authored linear road sequences, not a new map system. The handoff specifies relationships and success conditions; meter widths, road lengths, and timing values remain future playtest tuning.

| Chapter | Route/encounter sketch | Resolved outcome |
|---|---|---|
| Delivery | Empty neighborhood road → two traffic gaps/dead signal → clear conversation stretch → marked side service lane around blocked crossing → open gate → intake approach marker → clear closure | Delivery approach reached; module still aboard; Vlad still apparently helpful |
| Betrayal | Clear intake setup → neutral carrier/scan zone → visibly separated carrier and two evidence cards → marked lock zone with lateral exit + one drone → pursuit exit → clear closure | Jo escapes with module; betrayal known; public release becomes the mission |
| Public Access | Clear plan → safe relay A corridor → one drone interception → safe relay B corridor → clear closure | Two local readiness lights; Omega still contained |
| Lockdown | Reservoir/spillway above lower road → trapped bus and barrier on shared uphill road → safe controller pass → uphill bus protection corridor → bus safety marker → civic ramp → clear closure | Bus on high ground; shared barrier open; Jo reaches civic road |
| Release | Clear final plan → controller pass → drone interception → clear upload start → link A → one drone interception → clear link B → committed release → closure → dawn → epilogue exchange → protected marker travel | Omega public and persistent; limited recovery begins; campaign complete |

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
| L2.02 | Enter broad scan zone; latch receipt event once. Drain traffic, hold carrier safely separated, then show both equipment records and seven lines. Final refusal sets `betrayalKnown`; save `CP-L2-ESCAPE` with no active lunge. | No unavoidable damage, module loss, or scan deadline. Leaving scan zone before trigger gives another approach. After trigger the revelation cannot be evaded or triggered twice. A crash before completed reading returns to safe scan/revelation boundary, never a hostile mid-sentence scene. |
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

Bounded draw-off rule for L4.03: before each bus-targeted attack, mark one accessible interception lane with a brief steering cue. Entering it during the telegraph makes the drone lock onto Jo for that pass; normal steering/turbo evasion or blades then resolves the established attack. No escort command or new button. If Jo misses that cue and does not cut the drone, a single completed strike removes one bus segment. A fresh attack needs a new telegraph and recovery window. The first cue must leave time to read and steer before a strike. This is a future mission-specific target-selection rule, not current drone behavior.

For an out-of-range rider, the drone may finish one already telegraphed bus attack, then no new bus-targeted attack begins until Jo returns to escort range. This avoids offscreen unavoidable failure while retaining consequence for a missed attack. Keep the bus in a noncolliding parallel path during formation shifts; collision suppression is an authored spatial separation rule, not a vehicle phasing through Jo. Numeric escort band, telegraph duration, and travel length remain future tuning values.

### Level 5 — Release

| Beat | Prerequisite and success | Miss/failure/recovery |
|---|---|---|
| L5.01 | L4 completed, `relayA && relayB && busSafe`, Omega contained. Three lines acknowledged; save `CP-L5-CONTROLLER`. Show connection cues before danger. | Invalid prerequisite save returns to a compatible safe checkpoint/load recovery. Never silently grant missing flags. |
| L5.02 | Disable controller; barrier fully open; defender destroyed or visibly evaded out of corridor. Only then save `CP-L5-UPLOAD`, grounded with energy and empty upload. | Missed controller loops; a missed drone cut permits evasion. Crash retries `CP-L5-CONTROLLER`. Open barrier alone cannot advance while defender still attacks. |
| L5.03 | Scope: two consecutive marked link sections, each requiring 5 valid grounded seconds, for 10 seconds total. Section B unlocks after A validates; only one intercepting drone between sections. Final B approach begins after it exits/is destroyed and collision corridor is clear. Both section validations plus 100% upload set `omegaReleased` once and immediately save `CP-L5-RELEASED`. | Dropout pauses per-section progress. Missed section loops to that incomplete section, retaining earlier validated progress in the same attempt. No double-counting one section as two. Crash before release retries `CP-L5-UPLOAD`, upload reset to authored start. No threat may remain to cause a post-commit collision. |
| L5.04 | Durable/session release committed and road clear. Show three-line closure and PUBLIC ACCESS ACTIVE. | Reload from `CP-L5-RELEASED` resumes safe closure/epilogue with Omega released, even if loading occurs before any line was acknowledged. Storage failure truthfully limits persistence but does not roll back session release. |
| L5.05 | L5.04 acknowledged. Safe story stretch for three lines; then harmless travel to recovery marker with restored signals/lights. Both acknowledged exchange and marker passage save campaign completion once. Offer replay/title. | No timer, traffic collision, attack, or bus failure after release. Slow reading holds route; slow riding remains safe. Reload keeps release and resumes unfinished recovery. Replay uses separate run state and cannot relock Omega in the completed campaign. |

Two sections resolves the earlier Phase 3 “two or three” option. It reuses proximity linking, ordinary riding, the existing drone, and controller blade input. It adds no final-boss ability or asset. Each section should have margin beyond its required 5 seconds at ordinary cruise, using the same geometry acceptance method as L3.

## 11. Checkpoint and level-transition contract

The acceptance rows above name each action checkpoint. Every opening begins safe, every action checkpoint restores acknowledged dialogue and required prior flags, and every completion checkpoint retains all earlier completed levels. Writes describe future desired behavior; Phase 1 does not implement storage.

| Persistent boundary | Required state / next resume |
|---|---|
| `CP-L1-START`, `CP-L1-ACTION`, `CP-L1-SERVICE` | Module aboard; opening, traffic lesson, or service approach respectively; no betrayal knowledge |
| `CP-L1-COMPLETE` | Approach and L1.05 acknowledged; Continue to safe L2.01 |
| `CP-L2-SCAN`, `CP-L2-ESCAPE` | Before scan: neutral setup; after refusal: `betrayalKnown=true`, module intact, no repeated revelation |
| `CP-L2-COMPLETE` | Lock broken and L2.04 acknowledged; Continue to safe L3.01 |
| `CP-L3-A`, `CP-L3-B` | First link empty, or `relayA=true` and B empty; Omega contained |
| `CP-L3-COMPLETE` | Both relays true and L3.04 acknowledged; Continue to safe L4.01 |
| `CP-L4-CONTROLLER`, `CP-L4-ESCORT` | Controller lesson, or barrier open + bus full condition at protection start |
| `CP-L4-COMPLETE` | `busSafe=true`, civic ramp reached, L4.04 acknowledged; Continue to safe L5.01 |
| `CP-L5-CONTROLLER`, `CP-L5-UPLOAD` | Prior relay/bus flags required; controller approach, or barrier open + defender clear + empty two-section upload |
| `CP-L5-RELEASED` | `omegaReleased=true` immediately at validated final upload; resume safe L5.04/unfinished epilogue, never upload combat |
| `CP-CAMPAIGN-COMPLETE` | Release committed, L5.05 acknowledged, recovery marker passed; title/replay available |

At a level opening, resume from the preceding completion checkpoint until its opening dialogue has been acknowledged and the action checkpoint saved. Within a safe story screen, retain acknowledgment progress when practical; a failed attempt must never resume halfway through a hazardous action. The opening Level 1 checkpoint handles a fresh game.

Ordinary endings require success, natural drain, closure acknowledgment, persistence attempt, then explicit continue. On storage failure, keep session progress and state clearly that it will not survive closing the session; do not claim persistence succeeded. Failed next-level loading retains completed state and offers retry/menu. Chapter replay is separate from campaign state. Finale release is the deliberate exception to save-after-dialogue: save immediately at release, before its closure and epilogue.

## 12. Narrative review and handoff

Review Levels 1–2 together before expanding assets. A reviewer should understand what Jo carries, why Vlad hired them, what betrays Jo, what corroborates Omega, why physical access is needed, and what completes every level.

Reject lore that requires external explanation, exposes Vlad in Level 1, introduces a fourth speaker, makes Jo already wanted at the start, or releases Omega early.

Handoff to art: beat IDs, asset IDs, caller identities, system receipts, safe/action rhythm. Handoff to engineering: completion events, checkpoints, dialogue order. Wording may change for clarity; plot facts and event order remain intact.
