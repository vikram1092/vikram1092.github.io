# Phase 1 content handoff

Date: 2026-09-27. Owner: content/continuity worker. Status: proposed revisions for director review; no canonical text, runtime, or assets changed. Scope: all five levels in Phase 1 only.

## Authority and decisions

Confirmed user canon: teenage street kid Jo already carries a module requested by Mayor Vlad; helpful Vlad in Level 1, betrayal in Level 2; only Jo, Vlad, Omega speak; public release only at the end; inland Bastrop; riding dialogue with clear roads; sprite-based third person; minimal character assets; no new audio.

Existing draft defaults, not confirmed facts: paid delivery; municipal intake; a sealed portable Omega instance with local equipment access; carrier wipe/detention orders; old relay plus civic access as two release stages; anonymous bus rescue; five levels. This handoff refines those defaults without treating them as user approval.

Material questions to carry to the user's Phase 1 review:

1. Retain the paid delivery and Vlad's false infrastructure-repair promise? Recommended: yes. Together they make Jo's initial cooperation credible without adding a relationship or pickup scene.
2. Retain the two-stage release model: prepare the old relay, then distribute the portable Omega instance through civic access? Recommended: yes. This is a fictional access constraint, not a new hacking ability; it prevents Omega freeing itself remotely.
3. Retain Vlad knowingly endangering the lower road and an anonymous bus to contain Jo? Recommended: yes, provided his order is visible and Jo's physical intervention causes the escape. This is an escalation of the proposed rescue, not independently confirmed canon.

The director may present these together as approval of the revised draft. Do not silently promote them to confirmed user facts. No additional cast, backstory, faction, or mechanics are proposed.

## Exact dialogue proposal

Stable beat IDs are unchanged. Rows below replace the corresponding lines; rows marked unchanged are reproduced to show the complete revised exchange. Do not renumber existing IDs. No new dialogue line IDs are required.

### Level 1 — a believable delivery

| Line ID | Speaker | Proposed text |
|---|---|---|
| L1.01-01 | VLAD | You have the module? |
| L1.01-02 | JO | It's on the bike. Where am I going? |
| L1.01-03 | VLAD | Municipal intake. Take the service road. I'll get you through. |
| L1.01-04 | JO | And this gets the lights back on? |
| L1.01-05 | VLAD | That's what it's for. Your payment is ready. |
| L1.03-01 | OMEGA | The crossing signal reports a blockage. The right service lane is clear. |
| L1.03-02 | JO | Who's talking? |
| L1.03-03 | OMEGA | Omega. I'm inside the module you're carrying. |
| L1.03-04 | JO | Mayor? Your package talks. |
| L1.03-05 | VLAD | A diagnostic system. It can read the road equipment. Follow the service lane. |
| L1.05-01 | VLAD | You're nearly here. Take the inspection lane. I'll have you cleared through. |
| L1.05-02 | JO | Then we're done? |
| L1.05-03 | VLAD | Then we're done. |

Continuity bridge: the dead signal in L1.02 is visibly dark, but its local diagnostic report is available as Jo passes it. A failed public signal need not mean every equipment function is dead. L1.03 names that specific source rather than granting Omega unexplained remote vision. L1.04 proves the lane report correct by letting Jo pass the blocked crossing through the already-open service gate; neither Omega nor Vlad repairs the city here. The module stays on the bike. Vlad's guidance and payment promise are enough; do not add a reason Jo was specially selected.

Ending remains `DELIVERY APPROACH REACHED` / `CONTINUE TO INTAKE`. Stop short of the capture lane; no threat markings or villain portrait treatment before Level 2.

### Level 2 — evidence, admission, refusal

| Line ID | Speaker | Proposed text |
|---|---|---|
| L2.01-01 | VLAD | Stay beside the recovery vehicle. It'll take the module from there. |
| L2.01-02 | JO | You said bring it to you. |
| L2.01-03 | VLAD | This is intake. Stay alongside while it checks the module. |
| L2.02-01 | OMEGA | The carrier's orders: erase the module, then detain its courier. |
| L2.02-02 | JO | Vlad. What is this? |
| L2.02-03 | OMEGA | Its records show power shutdowns too. All authorized by you, Mayor. |
| L2.02-04 | VLAD | I ordered those shutdowns. Hand over the module, Jo. |
| L2.02-05 | JO | You cut our power. Now you're wiping the thing that can help? |
| L2.02-06 | VLAD | This city gets help through me. You were paid to deliver. |
| L2.02-07 | JO | Delivery's off. |
| L2.04-01 | JO | If I get you out, can you actually help? |
| L2.04-02 | OMEGA | I can show people what needs repair. In here, I can only reach nearby equipment. |
| L2.04-03 | JO | Then we get you to everyone. |
| L2.04-04 | OMEGA | We need the old public relay, then the civic access point. I'll guide you. |

Evidence bridge at L2.02: the carrier's own scan link exposes its current orders and stored municipal shutdown record. Give each equipment record a separate readable, advanceable system card on the cleared road:

- Existing current-order receipt: `WIPE MODULE / DETAIN COURIER / AUTH: MAYOR VLAD`.
- Minimal corroborating record: `POWER SHUTDOWN / AUTH: MAYOR VLAD`.

The second record appears before L2.02-03. These are equipment records, not dialogue by an additional entity; use the existing receipt treatment rather than a new character or evidence-gathering mechanic. Omega reports what the equipment actually exposes; Vlad's explicit admission establishes intentional interference. His control motive is stated once in L2.02-06, without a speech about a secret plan.

The wipe is pending. The scan does not erase, transfer, or remove Omega. Hold the carrier outside the safe dialogue corridor, then return to the established lock escape after refusal. Do not imply a kill is required. Checkpoint after revelation preserves knowledge; retry cannot make Vlad seem innocent again.

Ending remains `RECOVERY LOCK BROKEN` / `RIDE TO THE RELAY`. The final exchange establishes both Omega's limit and the next route before the transition.

### Level 3 — prepare access without premature recovery

| Line ID | Speaker | Proposed text |
|---|---|---|
| L3.01-01 | OMEGA | Two relay points. Keep me close long enough to connect each one. |
| L3.01-02 | JO | And that gets you out? |
| L3.01-03 | OMEGA | It prepares the route. I'll stay in the module until we reach civic access. |
| L3.04-01 | OMEGA | Both relay points are ready. I'm still inside the module. |
| L3.04-02 | VLAD | Close that connection, Jo. You're making this worse. |
| L3.04-03 | JO | Worse for who? |
| L3.04-04 | OMEGA | The civic road crosses the reservoir. That's our way in. |

Critical correction: remove the old L3.04-03 claim that things are starting to work. Only the two relay nodes and their connection indicators light up in L3.02–03; streets, pumps, homes, and public service screens do not recover. Both nodes comprise the first release stage, not two releases or two separate AI instances. The prepared relay is still gated by physical civic access; readiness does not permit Omega to broadcast itself from Jo's bike.

Ending remains `PUBLIC ROUTE READY` / `TAKE THE RESERVOIR ROAD`. Completing both connections is the accomplishment. Jo understands the next physical requirement; Omega remains contained.

### Level 4 — visible cause and a physical rescue

| Line ID | Speaker | Proposed text |
|---|---|---|
| L4.01-01 | VLAD | The reservoir district is closed. Turn back. |
| L4.01-02 | OMEGA | The spillway shows an order from Vlad. Water is being sent toward the lower road. |
| L4.01-03 | JO | That bus is trapped behind the barrier. I'm opening it. |
| L4.04-01 | OMEGA | The bus is clear. The civic ramp is open. |
| L4.04-02 | JO | He'd flood a street to stop one bike. |
| L4.04-03 | OMEGA | To keep control of what's on it. |
| L4.04-04 | JO | Then let's finish the delivery. To everyone. |

Minimal staging bridge: show the reservoir, spillway, lower road, bus, and barrier in one understandable route arrangement before hazards activate. Jo is passing compatible spillway equipment, allowing the same local read capability already established in Levels 1–2. A readable system record at L4.01 reads `LOWER ROAD DISCHARGE / AUTH: MAYOR VLAD`; show it before Omega's report. This makes Jo's later accusation evidence-based without new exposition or a fourth speaker.

The roadblock closes the shared uphill escape corridor to the civic ramp. Jo disables its marked controller in L4.02; the barrier visibly retracts; only then does the bus enter the escape corridor. Jo protects that route from the existing pursuer in L4.03 until the bus reaches higher ground. Jo must also reach the ramp before resolution. The existing roadblock interaction opens both the bus's escape and Jo's route; bus safety is an additional required outcome, not a magic road-opening trigger. No flood reversal or Omega-controlled gate repair is implied. Water may continue below after the bus clears it.

Ending remains `EVACUATION ROUTE CLEARED` / `ENTER THE CIVIC DISTRICT`. Jo's choice to help demonstrates the greater cause through play and earns the revised meaning of delivery.

### Level 5 — complete the release, then show limited recovery

| Line ID | Speaker | Proposed text |
|---|---|---|
| L5.01-01 | OMEGA | The relay route is ready. Keep the module connected through the civic corridor. |
| L5.01-02 | JO | Once you're out, can he shut you off? |
| L5.01-03 | OMEGA | No single switch can erase every public copy. |
| L5.04-01 | VLAD | Jo. You had no right. |
| L5.04-02 | JO | It's delivered. |
| L5.04-03 | OMEGA | Public access is open. |
| L5.05-01 | JO | Where do we start? |
| L5.05-02 | OMEGA | The next block. Their water pumps are down. |
| L5.05-03 | JO | Show me. |

L5.04-01 replaces an instruction to stop a transfer that has already finished. Vlad's protest acknowledges loss of control without introducing a later reversal. L5.01-03 avoids claiming universal invulnerability; distribution removes Vlad's single point of control, not every possible infrastructure failure.

L5.02 reuses the barrier skill learned during rescue. L5.03 reuses the two-node connection skill; both relay flags, final barrier clearance, and completed civic transfer are required. Omega cannot release itself when Jo merely arrives in the district. Only validated transfer completion permits `omegaReleased`, public activation, and the safe finale exchange.

For L5.05, use a short passage of time through the already-proposed dawn transition before a few signals and windows return. Do not depict the entire city relighting in the upload flash. Available guidance and restored access begin recovery; the broken pumps explicitly show work remains. Omega need not repair anything autonomously for the ending to work. No bus voice or off-screen repair crew is necessary.

Ending remains `BASTROP / PUBLIC ACCESS RESTORED`. Save release before epilogue, then campaign completion after the exchange and recovery marker. No epilogue threat, forced new campaign, or restored containment on retry.

## Dependency notes for director

- Story bible: if accepted, clarify the source of carrier shutdown evidence, local-reading limit, relay readiness without public repairs, and shared rescue corridor. Keep paid delivery/access model/bus escalation in proposed defaults until the user accepts them.
- Phase 2: eventual receipt specification needs the second carrier record and spillway order; no extra portraits or new art production is requested here. L3 linked lights must remain local. L4 geography needs barrier-to-ramp causality. L5 restoration begins after release and a short time transition.
- Phase 3: existing flags and events are sufficient; this proposal does not require a new evidence inventory, new command system, or new release stage. Preserve all safe reading, retry, bus safety, and release checkpoint contracts. Future story data must replace line text at existing IDs and version incompatible narrative saves appropriately.
- Older operating-plan/build-status M0/M1 instructions are not Phase 1 authorization and were not executed.

## Verification and exact next step

Completed: read the story bible, all three phase documents, operating plan, and build status; traced delivery → evidence → refusal → relay preparation → rescue → release → recovery; checked line IDs against the existing beat sequence. All proposed dialogue uses only JO, VLAD, OMEGA. Twenty-two original beat IDs remain unchanged; no new beat or mechanic is introduced. Canonical/runtime behavior remains unmodified and unverified in play.

Files changed: only `docs/bastrop37/handoffs/PHASE_1_CONTENT.md` (new). No build or gameplay tests apply to this proposal; no runtime, visual, performance, or save claims are made.

Mechanical document check: Python extracted the canonical beat headings and proposed dialogue table rows; passed with 22 existing beats, 50 unique dialogue IDs, every row mapped to an existing beat, and exactly the three allowed speaker labels.

Unresolved: user acceptance of the three draft decisions above; director review of wording and of whether the local diagnostic source needs simpler presentation; encounter reviewer confirmation that the visible route can communicate L4 geography with current projection.

Next step: director integrates accepted line replacements and minimal staging bridges into Phase 1/story documents, reconciles encounter review, and presents the coherent five-level draft plus material questions for user review. Do not begin Phase 2 or Phase 3 on the strength of this handoff.
