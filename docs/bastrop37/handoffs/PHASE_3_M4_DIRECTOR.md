# M4 final acceptance — 2026-10-04

**Accepted by the director for the authorized full-campaign integration.** The repaired build passed independent browser/visual review and all 15 affected tests in 480.170 seconds, zero failures/skips/flaky results. Build/check passed 24 files with zero diagnostics. The initial 15/15 behavior run and failed visual candidate are retained below as history; the final repaired evidence is under phase3/m4/repair/ and phase3/m4/review/repair/.

Implemented Level 4 through EVACUATION ROUTE CLEARED: ordered spillway receipt, required safe blade controller and visible barrier opening, three-condition bus escort/draw-off/steering or blades, independent bus/ramp latches, failures and full-condition retry, compatible saves and mobile controls. Final earned save has 41 spoken lines, 3 records, 44 chronological entries, completed L1–L4, busSafe true and Omega still contained. Independent review covers controller miss/hit/retraction, bus attacks/range/ramp-first, reload, four-size actual action, mobile failure/retry and steer-plus-blades.

Limits: one low consequence RIGHT SERVICE LOOP floor label can overlap the closed barrier during the miss transition; the safe bypass and return work. Physical-device performance, sustained load and human pacing remain playtest limits. Existing M2 optional Overdrive and jump limits remain unchanged. No new audio or extra cast.

**Pickup:** commit the intended M4 files locally, then implement M5 under its agreed handoffs/contracts. The user already approved all remaining levels and final publication. Do not pause for another gate. Complete M5, full campaign integration/review/performance, update records, commit/push master, verify normal Pages deployment, report and stop. The unrelated swap remains untouched. M5 content/mechanical packages and gameplay/HUD plans are ready; production has not started at this acceptance point.

---

# Phase 3 M4 director handoff

2026-10-04. User explicitly authorized all remaining levels, full verification and normal commit/push/Pages publication, then stop. Current assignment is M4 Inland rescue; M5 follows M4 review without another approval gate.

## Baseline and ownership

Verified M3 committed locally as `7d46d88` on master; origin remains939066d. The97 committed files are the previously reviewed M3 and retained approval docs/evidence. Swap remains untouched/untracked. M3 full48/48 and independent PASS retained; fresh precommit Astro check20files zero diagnostics. No new M4 test/build has run yet.

- Gameplay: `src/scripts/bastrop37.ts`, `save.ts`, new `lockdown.ts`, reusable `controller.ts`, M4 gameplay handoff. Own mission/runtime/save/projection only.
- Content: new `lockdown-content.ts`, `public/bastrop37/assets/lockdown/`, M4 content handoff. Seven exact lines and one equipment record, source-identical selected approved art.
- HUD (after content rotation): `src/pages/bastrop37/index.astro`, `src/styles/bastrop37.css`, `src/scripts/bastrop37/hud.ts`, M4 HUD handoff. Read-only derived mission states, whole-card receiver preserved.
- Director: contracts, tests/helpers, M4 integration evidence, authority/status/handoff. Agree interface before parallel dependent edits.
- Mechanical: bounded exact data/path/hash checks only. Fresh reviewer: own independent actual-browser/visual evidence/report only.

Root plus director occupy two slots; at most two active specialists. No recursive delegation, shared checkout, one writer per file.

## Scope and acceptance

L4.01 safe reservoir/lower road/uphill barrier/bus/ramp geography. Vlad line1, separate readable LOWER ROAD DISCHARGE / AUTH: MAYOR VLAD receipt, then Omega line2 and Jo line3. No flood countdown or harm during reading. Preserve the two old receipts/history; this adds one local record.

L4.02 repeat actual blade binding and safe marked controller pass; controller hit one-shot within blade range without body contact. Miss loops before closed barrier, no pursuer, no bus harm. Barrier retracts visibly before actor passage; save CP-L4-ESCORT full bus condition.

L4.03 marked escort band, reachable bus in spatially separate parallel lane; stop progress when Jo leaves. Three condition segments. New telegraph/recovery per attack; accessible marked intercept lane retargets that pass to Jo, resolved by existing evasion/blades. Missing draw-off/cut costs one segment. Out-of-range allows at most already signalled bus strike, then no new bus attack until return. Zero or Jo crash retries escort fullcondition. Bus safety latch suppresses future harm; Jo ramp independently required and repeatable. Natural clear-road drain.

L4.04 four exact lines; CP-L4-COMPLETE, EVACUATION ROUTE CLEARED / ENTER THE CIVIC DISTRICT. Expected total41spoken,3records,44history; betrayal/relayA/B/busSafe true, omegaReleased false. M5 integration may subsequently enable this Continue, but M4 review establishes contained boundary first.

Verify controller miss/hit/retraction, empty-energy blade feasibility, reward exclusions, escort range and bus position, telegraph/draw-off/evasion and blade alternatives, bus damage once/zero/failure, outside-range suppression, safety-first/ramp-first combinations, all checkpoints/reload/old/corrupt saves, asset retry/storage limits, mobile controls/wholecard/four-size visuals, natural exits. Use source/world geometry and actual browser captures, not screenshots alone for behavior. Preserve all historical release evidence.

## Current state and pickup

Content and gameplay are active; minimal numeric/model/HUD interface proposal pending. No M4 runtime completion claim. Next rotate HUD after content, integrate/build/test, rotate bounded mechanical/fresh reviewer, resolve findings, record exact results, locally commit reviewed M4, then M5. Final full campaign publish is approved, no additional authorization request needed.

## Frozen M4 interface and geometry decisions

HudView.chapterId adds L4; optional controller state(active/retracting/open)/progress and escort condition(0..3)/inRange/intercept(left/right/null)/busSafe/busProgress/rampPassed/attackPhase(idle/telegraph/strike/recover/cleared). Existing missionMeter remains the one primary rail. No new control; HUD reads fields only.

Gameplay model LockdownMission(checkpoint?,log,records,history), advance(), tick(dt,travel,riderX,trafficClear), controllerBladeHit(riderX,grounded,bladeReach), escortDroneCut()/escortDodge(). ControllerGate reusable for M5: one-shot hit,1.2-second retraction,650-unit repeat connector. Proposed controller route520,x452 with rider405..430 safe bladeadjacency; closedbarrier route780; loop beforebarrier with visible continuity. Escort bus parallelx550,z~220, Jo range340..490, busgoal3600. First telegraph>=1.5s,later1.2s,recovery1.3s; accessible rightintercept420..490. Jo ramp separately latchable from independent travel (~3900), including beforebus; both markersrequired and repeatable. These numericvalues require browser confirmation and may be tuned with evidence.

Read-only dataset contract: controllerState,barrierProgress,controllerLoops,busCondition,busProgress,busZ,escortInRange,interceptLane,escortAttackPhase,escortTarget,escortPasses,busSafe,rampPassed,rampLoops. No test may directly mutate runtime missionprogress.

## Integration progress

Content and HUD source complete; mechanical checks matched7 exact lines/record and11 approved asset copies with zero discrepancies (13,654,180bytes). Gameplay runtime wiring continues. Director source review caught retained-record presence/index bug and getter-after-insert bug before browser integration; gameplay fixed both. Natural three-hit failure needed more route margin: busgoal now3600 and Jo ramp3900, making all3 strikes reachable before safety without shrinking readable telegraphs. Zero-condition failure is latched one-shot.

Director8 new model scenarios passed in414ms: safe opening/ordered record, valid/missed controller and1.2s retraction, out-of-range bus reachability/progress,3 distinct hits and retry, single in-flight strike while away, draw-off retarget, both safety/ramp orders/clearroad closure, strict checkpoint/canonical record validation. This is model evidence only. Seven new browser scenarios/helpers are prepared but not run. Fresh independent m4_reviewer is reading scope and waiting for integrated build; it must not review the stale M3 dist.

Runtime source audit additionally requested bus-targeted drone contact at actual busdepth/parallel lane, no bus placement beyond closed barrier, continuous bypass and visible120→220 escort join, explicit env anchorX819 and staged closed/low→open/high spillway after receipt. Gameplay reports those fixes present; actual build/browser inspection still pending. Blade reach measured from accepted source ≈60.13right/56.13left worldunits; controller x452 and rider390..425 is feasible in model, actual browser cut not yet verified.

Seven browser scenarios are now written in tests/lockdown.spec.ts with normal input helpers; none has run yet. These and8 modeltests give15 new M4 cases. Original modelrun was8/8 in414ms; later busdepth-join source refinement still requires rerun. Fresh reviewer owns PHASE_3_M4_REVIEW.md and phase3/m4/review/, waiting for director build-ready.

## First integrated candidate

Gameplay froze after source fixes; final relay datasets now retaintrue in L4. npm run check passed23files, zero diagnostics. npm run build passed at2026-10-04 10:10:04 local, zero Astro errors/warnings/hints, existing Vite>500kB advisory only. build.log retained; local review-copy message is not publication.

15-case M4 run started with8 model +7 browser scenarios (`results-initial.json`, written atfinish). Eight models passed again; browser run active. Fresh m4_reviewer received build-ready and is reviewing same candidate with normal inputs at127.0.0.1:4321. No acceptance yet. Runtime must stay frozen until concrete findings are coordinated; if rebuilt, restart affected verification and label superseded evidence.

## Material findings on first candidate (not accepted)

Director and fresh reviewer independently inspected actual PLAYING captures: bus floats over the void beyond road edge; controller/barrier/escort/uphill labels occupy the center lower road while approved right uphill portal/apron is disconnected. Scenic portal presence does not fulfill shared uphill escape route. Open spillway inner crop exposes red city skyline through alpha instead of water/infrastructure; approved water effects are not sufficiently visible/registered. Evidence: director desktop-escort-start.png and reviewer controller-approach-1440.png, escort-start-1440.png, telegraph-1440.png, opening/record frames. Gameplay is planning bounded M4 projection/road-surface/actor grounding and opaque water-backing repairs; runtime still frozen while initial behavior run/reviewer finish. No M5production until this is resolved/reviewed.

Current initial-run progress:13/15 passed (8models +5browser), now real Jo crash/steering draw-off/session storage and final mobile route. Reviewer independently verified20s slow reading/recordorder,3 distinct bus hits ending failure at route2939 beforegoal3600, away-progress held786/condition2 with no new strikes, and bladesx456 reaching clear L4.04 condition3/bothmarkers. Await exact final run/report before claiming broader passes.

## Initial verification completed

Initial15-case run completed15/15 in6.2minutes, nofailed/skippedcases. Includes8models and7browsercases, realJo crash/steeringalternative/session-onlystorage andfour-size/touchcompletion. This is behavior evidence for the initialcandidate, not visualacceptance. Independent reviewer additionally confirmed fullescort retry, earnedcomplete reload, controllerloop, ramp-first/buslater completion. Mobile390×844clipsbus and excludesreservoir/portal; sharedroad/water/mobileframing remainmaterialvisualblockers. Boundedrendererrepairapproved, pendingclosedreviewjobs before edits. Initialresults preserved as results-initial.json.

## Repaired candidate — verification in progress

Gameplay froze the bounded renderer repair. The shared asphalt branch now uses the accepted road texture, covers the bus lane, and joins the approved uphill portal floor; the barrier drawing spans Jo and bus. L4-only projection and portrait framing changed; mission, controller, escort and save models did not. Opaque freshwater backing prevents skyline bleed through the spillway. Source check passed 24 files with zero diagnostics. Build completed at 2026-10-04 10:31:44 local (existing Vite chunk advisory only).

Director inspected actual earned-escort PLAYING captures at 1440×900 and 390×844; bus grounding/portal connection and mobile inclusion are visibly improved. Four-size captures and geometry are under phase3/m4/repair/. These are observations, not final acceptance. Fresh independent re-review is active; all 15 affected tests are rerunning against the frozen repaired candidate with results destined for repair/results.json.

M5 independent content preparation is complete: nine approved lines, seven exact new copies (5,426,434 bytes), 14 total references. Mechanical verification found no discrepancies. Runtime M5 has not started; gameplay is preparing an interface plan while M4 verification runs.

Independent repaired visual update: the reviewer confirms grounded branch/bus/portal at all four sizes, visible mobile geography, opaque blue-green spillway backing, no clipping blocker, page errors or overflow. Its behavior recheck continues. Director repaired matrix has passed thirteen of fifteen cases; actual Jo collision/steering/session-only and touch completion remain running. Do not mark the whole run passed until its JSON finishes.

## Repaired behavior matrix complete

Repaired candidate passed all 15 cases in 480.170 seconds: 8 model and 7 browser, zero failed, skipped or flaky. Evidence is repair/results.json. Whole-card reading, controller miss/retraction, real blade escort, three-hit loss and retry, outside-range suppression, actual Jo collision, steering alternative, blocked storage, asset recovery, all four story sizes and touch-only completion passed. Independent final behavior/report remains the only acceptance item outstanding. The longer wall time versus the initial run is not a measured performance claim; both ran alongside independent browser work.
