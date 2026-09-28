# Bastrop37 build status

Active phase: **Phase 3 — M0 and M1 verified; Delivery ready for user playtest**. Updated 2026-09-27. Phase 1 is approved. The user explicitly confirmed **“I approved it all”**, approving the full revised Phase 2 package. Phase 3 **M0 and M1 only** was authorized, then stopped for the playable Delivery review. After verification, the user authorized pushing and publishing this slice. M2–M5 remain unauthorized. Historical approval requests below are superseded by this recorded approval.

## Phase 3 current execution

- Initial checkout contained only the preserved `.BASTROP37_PLAN.md.swp` as unrelated untracked work. The former timed escape was verified before implementation: zero check diagnostics and 17/17 baseline browser tests. Baseline results do not establish M1 acceptance.
- One writer per file: director owns contracts/tests/status/authority notes; gameplay owns main script/delivery/save; HUD owns page/scoped CSS/hud; content owns approved dialogue/production asset copies; independent reviewer owns review evidence/handoff. Configured role models/reasoning were retained.
- Implemented L1.01–L1.05 with all 13 exact approved lines, full-text manual acknowledgments, separate visual/mission clocks, natural traffic drain, objectives, service gate/approach, safe missed-gate loops, real blocked-crossing contact, crash/retry, and three named checkpoints. Completion saves the Delivery ending and stops at the honest M1 boundary. Omega remains unreleased; no later chapter is playable.
- Approved revision-v2 Delivery architecture/signal/gate, revision-v3 barrier and HUD direction, neutral Vlad/Omega and original riding sprites are integrated. Six production image copies match approved sources. Original steering/slide/jump/blade/turbo/contact/audio remain; bounded localhost-only mechanics fixture verifies drone mechanics without introducing hostile Delivery encounters or saving fixture progress.
- Agreed interface: `createHud(HudActions).render(HudView)`; HUD owns menu/dialogue bindings, gameplay owns keyboard/driving/mute and mission/save state. Data-only `DELIVERY_DIALOGUE`/`DELIVERY_ASSETS` define approved content. Saves validate schema, checkpoint, canonical flags and acknowledged logs; unavailable storage uses an honest session-only fallback. Required asset failures have retry recovery; New Game requires confirmation and clears prior progress.
- Integrated automated evidence: `npm test -- --reporter=line` passed **20/20 in 3.9 minutes** (13 Delivery/fixture browser scenarios, 3 mission/save model checks, 4 home checks). An additional touch-only full Delivery/save/reload scenario passed **1/1 in 48.7 seconds**. Tests exercise actual browser inputs and rendered runtime, including slow reading, held Enter, all dialogue/transitions, five natural offscreen traffic exits, route loops, collisions/retry, save/Continue, denied storage, invalid saves, asset retry, mute/gallery and mobile multitouch.
- Independent review found and drove fixes for stale New Game saves, load-error bypass, skyline/rider framing, overwritten tutorial cues, long portrait card overlap and gantry exit continuity. The portrait correction passed 2/2 affected mobile browser checks in 41.2 seconds and independent visual review (about 27px full-rider clearance). The final gantry fade passed independent sequential-frame review: readable approach, continuous fade, gone before intersecting Jo, no hard pop. No material independent-review finding remains open.
- `npm run build` passes with zero Astro diagnostics; Vite retains its existing large-chunk advisory. The build's “Published isolated review” message refers only to copying local `dist` files. No push or deployment had occurred at M1 acceptance; the user later authorized both.
- Four-size capture/measurement evidence: no page errors or horizontal overflow at 1440×900,1280×720,1024×768,390×844. Short 175-frame reading and live-traffic samples average about 60fps with 16.7–16.8ms p95 intervals on Apple M4/16GB headless Chromium; this is not physical-mobile or sustained-performance proof. Initial loaded resources total about 23.57MB. See [measurements](phase3/live-measurements.json).
- Final review/evidence: [director handoff](handoffs/PHASE_3_DIRECTOR.md), [gameplay](handoffs/PHASE_3_GAMEPLAY.md), [HUD](handoffs/PHASE_3_HUD.md), [content](handoffs/PHASE_3_CONTENT.md), [independent review](handoffs/PHASE_3_REVIEW.md), [browser captures](phase3/captures/).

**Next:** user Delivery playtest at <http://127.0.0.1:4321/bastrop37/> and publication at <https://vikramramkumar.me/bastrop37/> authorized by the user's push/publish request. Stop at M1. Human pacing and physical-device performance require playtest evidence; the 90–150 second pacing target is not yet demonstrated. No M2–M5 is authorized.

## Historical Phase 2 revision v3 record (approval now received)

- Preserve rejected v1 and accepted-direction v2 as versioned references. Produce the full revised package under `phase2/revision-v3/`; no original asset or live runtime edits.
- Scope: all 14 canonical environment/prop/vehicle groups and required HUD states, all 50 approved dialogue lines, asset metadata/provenance, specifications and Phase 3 handoff. M0/M1 cannot substitute for completing the Phase 2 register.
- Agreed art contract: four distinct alpha environment flank layers (intake, old relays, inland reservoir, civic core); detailed raster carrier/relay/civic/controller bases; shared mechanical closed/open spillway and barrier variants. Reuse the v2 Delivery architecture/gate/signal, original Jo/traffic/drone and existing raster bus. Scan/link/lens/light states use restrained overlays on detailed bodies.
- Maintain v2 worn charcoal steel/concrete, dirty ivory municipal paint, amber utility lighting and restrained cyan technology. Preserve shared vanishing point, whole-body road grounding, open instrument rails and authored communication strips. Rejected flat v1 scene bodies/cards are not final art.
- Content owns assets/manifest/ART_NOTES; HUD owns isolated preview/captures/HUD_NOTES; director owns authority/status/ART_DIRECTION and final Phase 3 handoff. Fresh configured reviewer judges thematic quality and actual scene composition before technical coverage.
- Completed v3 production:12 selected raster bodies,13 source-aligned SVG effects,14canonical asset groups /30states /43resolving references;50isolated HUD samples and all50exact dialogue lines. Measured metadata, prompts/provenance, asset/HUD notes, and refreshed Phase3 integration handoff are present. v1/v2 sources are preserved.
- Director inspected all four new environment sources and actual-size desktop/mobile L2/L3/L4 compositions plus full chapter sheet. Corrections grounded gantry/node feet, replaced the floating L4 code ramp with a real raster portal/apron, fitted gate leaves into its embedded frame, and repaired alpha regression. Material/identity match the accepted v2 direction.
- Verification:200layouts across four target sizes and100exact-line checks, required evidence and final-release/recovery sequence checks, no reported page errors/missing images/overflow/default panel scrolling. All87 protected src/public/tests files remain exactly unchanged by SHA-256. New raster download27,433,027bytes /nominalRGBA75,494,688bytes; runtime loading/performance remains unverified.
- Independent thematic/technical review passed: no unresolved blocker to final user review. Reviewer confirmed coherent chapter art and independently matched all50lines to Phase1. Two medium findings were fixed and independently rechecked: all three acknowledged equipment receipts now persist in the session log, and L2 reading suppresses the approach gate/cue while keeping the carrier visibly separated from mobile Jo. Affected captures/contact sheets were refreshed. See [revision3 review](handoffs/PHASE_2_REVISION3_REVIEW.md).
- Outstanding: **final user Phase2completion approval**. Package is frozen for root publication/presentation. Static geometry and numeric meters remain proposals, not validated gameplay. Barrier static ground feet align but upper housing/lamp differs about75sourcepixels; animated transition needs Phase3 reconciliation.
- Current review artifacts: [preview](phase2/revision-v3/index.html), [chapter sheet](phase2/revision-v3/captures/contact-chapters.png), [HUD state sheet](phase2/revision-v3/captures/contact-states.png), [art specifications](phase2/revision-v3/ART_NOTES.md), [HUD state map](phase2/revision-v3/HUD_NOTES.md), [manifest](phase2/revision-v3/asset-manifest.json).
- Root owns authorized publication and will add `revision-v3/preview.js` to public path rewriting. Publication is isolated review only.

Historical revision v2 status at presentation: **revised Delivery treatment ready for visual review**. Updated 2026-09-27. The user rejected the expanded chapter visuals/HUD and specifically called the signal, gate and buildings unthematic and boring. The earlier technical/layout pass did **not** establish visual acceptance. Phase 2 completion is not approved. Phase 3 remains unauthorized.

## Revision v2 historical gate — user accepted direction

- Preserve `phase2/` as the published v1 reference; new work is isolated in `phase2/revision-v2/`. Do not overwrite original assets or blanket-label the rejected treatment approved.
- Scope now: one coherent Delivery treatment plus desktop/mobile action and dialogue, then user review. No chapter-wide propagation until this new treatment is accepted. Existing neutral Vlad and non-human Omega can remain.
- Director diagnosis from actual references/screenshots: detailed raster rider/city were combined with flat front-elevation SVG buildings/props, weak perspective/material continuity, large empty gray shoulders, and repeated generic rectangular HUD panels. Asset completeness and overflow checks missed this art-direction failure.
- Working direction: gritty retro-industrial civic streets after rain; worn charcoal steel/concrete, dirty ivory paint, controlled amber lighting, cyan for local technical cues, scarlet bike as focus. Content and HUD agreed material/light/camera before production.
- Art owner `revision2_content` (configured Sol/medium): three new imagegen raster candidates—framing neighborhood/service architecture, aged dead signal, open municipal service gantry—plus measured/provenance notes. No additional character, audio or 3D assets.
- HUD owner `phase2_hud` (configured Sol/medium): fresh isolated composition, open bike instrument rails, segmented energy, authored communication strip, responsive captures. Desktop camera horizon42%, larger foreground rider; mobile crops preserve artwork proportions and text/road visibility.
- New paths: `phase2/revision-v2/index.html`, `assets/delivery-architecture-v2.png`, `assets/signal-dead-v2.png`, `assets/service-gate-open-v2.png`, new captures and notes. Exact generator dimensions/crops remain measured from output.
- Independent reviewer will assess theme, silhouette, material coherence, perspective, atmosphere and hierarchy first, then layout/copy. Any unresolved visual quality concern must be stated candidly.
- Completed revision: three selected raster candidates with alpha/provenance/measurements, corrected architecture perspective, grounded projected traffic/gate, straight foreground Jo, new instrument/communication treatment, desktop/mobile ACTION and Vlad/Omega dialogue. Earlier flat geometry and generic HUD are not reused for this revision.
- Verification: 20 layouts across all four target sizes; 10 exact approved L1 lines; no overflow, missing image or page error; manual/Enter advancement works. Director viewed final1440 desktop and390 mobile action/dialogue; 87 src/public/tests files remain unchanged. These remain static proposals, not gameplay proof.
- Independent art-quality review: materially stronger gritty material, depth and authored HUD; **no blocker to presenting this one revised treatment**. Fog clipping, actor grounding and mobile labels were corrected and rechecked. Mobile signal/gate fine detail is diminished at small display size, though silhouettes remain identifiable; user must still judge the treatment.
- Review links: [new preview](phase2/revision-v2/index.html), [contact sheet](phase2/revision-v2/captures/contact-sheet.png), [v1/v2 comparison](phase2/revision-v2/captures/comparison-sheet.png), [art notes](phase2/revision-v2/ART_NOTES.md), [HUD notes](phase2/revision-v2/HUD_NOTES.md), [review handoff](handoffs/PHASE_2_REVISION2_REVIEW.md).
- Outstanding: **user acceptance of this one revised treatment**. Do not propagate it across chapters or claim Phase 2 complete. Earlier production counts below are historical v1 coverage, not a current completion claim.


## Prior v1 production record — preserved reference, visual acceptance rejected

## Scope, ownership and decisions

- Director owns this status, phase boundaries, canonical phase-authority notes, and Phase 2 director / Phase 3 art-HUD handoffs.
- Configured `bastrop_content` (Sol/medium) owns isolated art, manifest, specifications and content handoff; `bastrop_hud` (Sol/medium) owns isolated review page/styles/script, responsive captures, HUD specifications and handoff. Fresh configured `bastrop_reviewer` (Sol/high) owns independent final review/evidence.
- First Delivery treatment is approved. Completing Phase 2 means the entire bounded asset register and HUD state list; no required later kit was silently deferred to M0/M1. New files remain candidates for final user approval.
- Preserve sprite-based/faked-depth riding, existing assets and one neutral Vlad / one Omega identity. New raster art used the imagegen skill/tool; code-native layers/states use SVG. No new characters, audio or 3D, and no live gameplay/HUD integration.
- Root owns user-authorized publication/build-copy maintenance. This publishes isolated review files only; it grants no Phase 3 authorization.

## Completed production

- **39 measured manifest entries**, covering every **14 canonical Phase 1 environment/prop/vehicle IDs** plus character identities. Approval split: 11 approved first-package entries, 28 new final-review candidates (27 SVGs and one transparent rear bus raster). All 31 SVGs parse; generated prompt/provenance and state-family pivots/dimensions are recorded.
- All five environment treatments, neutral/active intake and recovery carrier composite, dormant/connecting/linked relays, freshwater reservoir/spillway and staged water, closed/open shared barrier with separate active/disabled controller, anonymous civilian bus, dormant/linked/public civic node, dawn/recovery signal, and Delivery approach/blocked-crossing dressing.
- **37 isolated chapter/HUD samples** cover title, action/drain/story, equipment records, abilities/optional Overdrive, local link states, escort condition/range, failure, pause/settings/log, honest save results, chapter completions, final public activation, dawn dialogue and protected recovery travel. Approved Delivery views remain available.
- All **50 canonical dialogue lines** are included exactly. Two carrier records receive separate acknowledgment before all seven confrontation lines; release/dawn exchanges retain all three lines each. Restored signals are withheld until subsequent protected recovery travel.
- Completed [asset specifications](phase2/ASSET_SPECIFICATIONS.md), [HUD behavior/state map](phase2/HUD_SPECIFICATIONS.md), [companion manifest](phase2/asset-manifest.json), [Phase 3 art/HUD handoff](handoffs/PHASE_3_ART_AND_HUD.md), and worker/director handoffs.

## Verification and review

- Reproducible capture/check script: `node docs/bastrop37/phase2/captures/capture-check.mjs` against a repository-root static server; `REVIEW_URL` can select the published preview. **148 state/viewport layouts** (37 × four required sizes) checked; default panels have no horizontal overflow, missing images or page errors. Expanded pause disclosures intentionally scroll to accessible controls.
- Independent review validates all 39 manifest dimensions, 31 SVGs, exact 50-line canonical copy, equipment/refusal sequence, public/recovery gating and selector reset. Original Delivery long dialogue and completion were rechecked at all four viewports.
- Director inspected actual new chapter asset sheets and representative desktop/mobile scenes. Final L4 revisions place spillway outside HUD backplates, connect the shared barrier to a broad uphill branch, keep Jo/bus below it, and separate interception labels. Static geometry proposes spatial relationships; no navigability or collision is claimed.
- Existing `src/`, `public/`, and `tests/` inventory and SHA-256 contents remain exactly **87 unchanged files**. Root's isolated-review publication script change is authorized and outside that protected runtime baseline.
- Final independent recommendation: **ready for final Phase 2 user approval; no unresolved blocker**. All final L4 clearance/route corrections were independently rechecked. See [PHASE_2_FINAL_REVIEW.md](handoffs/PHASE_2_FINAL_REVIEW.md). Earlier [first-gate review](handoffs/PHASE_2_REVIEW.md) remains historical evidence.

## Placeholders, limits and outstanding work

No missing required image or temporary character placeholder remains. Numeric instruments, meters, save results, selected chapter state and road geometry are illustrative static samples. Controls select review states; they do not simulate riding, checkpoint storage, traffic exits, encounter resolution or public release.

Runtime projection/world scale, alpha-crop/pivot/collision compatibility, blade reach, road seams in motion, actor exits, escort ranges, loading/performance, device coverage and large-text behavior are Phase 3 verification obligations, not missing Phase 2 art. Bus/traffic visible-body crops and original alpha artifacts are explicitly documented. New art remains pending final user acceptance.

**Exact next step:** present the full chapter/state sheets and interactive review page for user Phase 2 completion approval. Stop here. Only after that approval and explicit Phase 3 authorization may M0/M1 implementation begin; later milestones remain separately bounded.

## Full package review links

- [Chapter contact sheet](phase2/captures/full-contact-chapters.png), [HUD state contact sheet](phase2/captures/full-contact-states.png), [all chapter asset states](phase2/assets/chapter-asset-review.html).
- Isolated review page: <https://vikramramkumar.me/docs/bastrop37/phase2/>; final publication/deployment verification is owned and reported by root after this handoff.
- [Director handoff](handoffs/PHASE_2_DIRECTOR.md), [content handoff](handoffs/PHASE_2_CONTENT.md), [HUD handoff](handoffs/PHASE_2_HUD.md), [final independent review](handoffs/PHASE_2_FINAL_REVIEW.md), [Phase 3 handoff](handoffs/PHASE_3_ART_AND_HUD.md).

## First Delivery visual review links

- User authorized pushing the current project and publishing web-accessible review links on 2026-09-27. The user subsequently approved the first visual package and authorized continuation of the originally requested Phase 2 package; publication remains separate from Phase 3 implementation. The build copies the isolated review into the static site without integrating the HUD into gameplay.
- Published review target: <https://vikramramkumar.me/docs/bastrop37/phase2/>; deployment verification is recorded in the delivery response.
- Live isolated preview while local server runs: <http://localhost:4178/docs/bastrop37/phase2/>. Restart from repository root using `python3 -m http.server 4178` if needed.
- [HUD contact sheet](phase2/captures/contact-sheet.png), [asset review sheet](phase2/assets/asset-review.png), [asset specifications](phase2/ASSET_SPECIFICATIONS.md), [HUD specifications](phase2/HUD_SPECIFICATIONS.md), [companion manifest](phase2/asset-manifest.json).
- [Director handoff](handoffs/PHASE_2_DIRECTOR.md), [content handoff](handoffs/PHASE_2_CONTENT.md), [HUD handoff](handoffs/PHASE_2_HUD.md), [independent review](handoffs/PHASE_2_REVIEW.md).

## Phase 1 record (approved)

## Scope and ownership

- Director owns canonical documentation, phase dependencies, this status, and `handoffs/PHASE_1_DIRECTOR.md`.
- `bastrop_gameplay` (Sol/high) owns `handoffs/PHASE_1_GAMEPLAY.md`: read-only feasibility and encounter recommendations.
- `bastrop_content` (Sol/medium) owns `handoffs/PHASE_1_CONTENT.md`: dialogue and continuity recommendations.
- `bastrop_reviewer` (Sol/high) owns `handoffs/PHASE_1_REVIEW.md`: fresh-context independent review after integration.
- All work is documentation only. Runtime code, assets, tests, and existing unrelated changes are preserved. No commit, push, deploy, or new chats.

## Completed Phase 1 documentation

- Refined all five chapters while preserving 22 beat IDs and all confirmed story constraints. Added 50 explicit unique dialogue IDs, five linear route sketches, 22 encounter acceptance rows, and named checkpoint/resume boundaries.
- Equipment evidence precedes accusation: two carrier records plus Vlad's admission establish betrayal; a local spillway order establishes the approved flood escalation. Omega reads nearby equipment; no omniscient hacking or evidence inventory.
- Relay lights in Level 3 mean readiness only. Only the validated final civic upload can release Omega; release is saved before the epilogue.
- Each missed approach has a safe service loop; crashes restore a named safe checkpoint. Lock escape permits steering without turbo. Level 4 repeats a safe blade lesson before its mandatory controller. Bus attacks have explicit interception, condition, range, and retry rules.
- Final upload uses two connection sections separated by one interception. The final section is already clear of threats before release commits; epilogue dialogue is followed by harmless marker travel.
- Phase 2 dependency copy now specifies isolated HUD/scene comparisons, equipment records, and visual causality. Phase 3 future contracts match the revised encounters. Operating plan explicitly supersedes its old M0/M1 instruction for this request.

All of the above is **specified in documents**. No campaign behavior, saves, visual treatment, timing, or performance has been implemented or playtested in this task.

## Decision record

Confirmed user direction is retained in `BASTROP37_STORY.md`. Director-selected refinements within the existing draft: local equipment evidence, readable receipts with no extra speaker, safe loops, steering escape fallback, repeated blade lesson, one bounded bus interception rule, two final link sections, and protected post-release travel. These close continuity/feasibility gaps without new buttons, cast, audio, renderer, or game modes.

Creative choices approved with Phase 1 on 2026-09-27:

1. Portable local Omega, old relay preparation, and final civic release.
2. Required anonymous bus rescue during Vlad's deliberate discharge toward the lower road.
3. Paid delivery and Vlad's false repair promise, accepted with the full draft.

No outstanding Phase 1 creative questions remain. Approval establishes the narrative and encounter baseline; future runtime tuning still requires playtesting.

No final arrest, death, redemption, or extra antagonist is added for Vlad. Loss of his exclusive control is the ending's required outcome; the city begins recovering without instant repair.

## Verification and independent review

- Gameplay Sol/high read current renderer, controls, collisions, drones, save/reset code, and tests without editing them. Existing prototype supports the visual/control vocabulary; mission state, actor exits, escort targeting, links, and campaign saves are future work. See `handoffs/PHASE_1_GAMEPLAY.md` for source evidence and limitations.
- Content Sol/medium traced all five chapters and supplied exact line changes; director inspected and integrated the handoff. See `handoffs/PHASE_1_CONTENT.md`.
- Python document assertions passed: 22 ordered canonical beats, 50 unique line IDs with only JO/VLAD/OMEGA, 22 matching acceptance rows, 14 Phase 1 asset IDs present in Phase 2, and local documentation links resolve.
- SHA-256 comparison passed for 87 existing files under `src`, `public`, and `tests`; none changed during this task. The coordinating agent independently compared 101 captured non-document files (also including `.codex/` and root non-Markdown/non-swap files); all were unchanged. No build, browser, gameplay, visual, save, or performance validation was claimed or needed for documentation-only edits.
- Fresh-context independent Sol/high review completed: recommends Phase 1 approval once creative choices are accepted; no unresolved documentation defects. The sole low-severity finding (L1 gate/approach-marker/drain ordering) was corrected and independently rechecked. Reviewer separately verified 22 beat/acceptance pairs, 50 unique dialogue IDs, three speakers, 17 checkpoint references, 14 asset references, and relative links. See `handoffs/PHASE_1_REVIEW.md`.

## Files changed in this task

Canonical: `BASTROP37_STORY.md`; `PHASE_1_NARRATIVE_AND_ENCOUNTERS.md`; dependency clarifications in `PHASE_2_ART_AND_HUD.md` and `PHASE_3_IMPLEMENTATION_AND_VALIDATION.md`; phase authority in `AGENT_OPERATING_PLAN.md`; this status.

New bounded reports: `handoffs/PHASE_1_GAMEPLAY.md`, `handoffs/PHASE_1_CONTENT.md`, `handoffs/PHASE_1_REVIEW.md`, and `handoffs/PHASE_1_DIRECTOR.md`.

Existing deleted prototype plan, editor swap file, old plan, `.codex/`, untracked docs, and `src/scripts/bastrop37/contracts.ts` are preserved. Historical status below is not overwritten or treated as verification.

## Phase 2 handoff and exact next steps

1. Historical first-package plan below is fulfilled. Phase 1 and first Delivery visual approval were received; the full Phase 2 package is now at final user-approval gate. Any structural story change still requires narrative review.
2. Only after explicit Phase 2 authorization, produce the first Delivery treatment: reuse existing Jo/bike/traffic; minimal `ENV-L1`, `PROP-SIGNAL`, `PROP-SERVICE-GATE`; one neutral Vlad portrait; one Omega symbol; optional module detail only if it reads clearly.
3. Produce isolated ACTION, STORY, and LEVEL COMPLETE HUD mockups at 1440×900, 1280×720, 1024×768, and portrait 390×844. Show full manual-advance dialogue, one objective, the clear road, truthful completion/continue states, and control separation. Use L1.01–05, the exact line IDs, `DELIVERY APPROACH REACHED`, and `CONTINUE TO INTAKE`.
4. Supply one manifest sample and traffic-versus-cleared-road scene comparison in mockups. Review at intended size, including a plausible helpful Vlad and a readable central road. No live gameplay integration; no later-level asset campaign yet.
5. Carry later visual requirements forward: separate equipment cards, local-only relay lights, inland spillway/lower-road/shared-barrier/uphill-ramp geography, two final connection sections, and limited dawn recovery. Existing asset IDs suffice.
6. Stop for Phase 2 approval. Phase 3 M0/M1 remain future implementation milestones requiring explicit authorization. Future engineers must playtest corridor widths/durations, blade reach, drone exits, bus ranges/telegraphs, save failures, and mobile input; written feasibility is not proof of runtime behavior.

## Historical record — prior M0/M1 assignment, superseded and unverified

The following was already in this file at the start of this request. It is retained to preserve prior work and context. Its scope/ownership and pending test claims are historical, not current authorization or verified outcomes. Existing `src/scripts/bastrop37/contracts.ts` is preserved; its presence does not establish completion of any milestone.

Milestone: M0 baseline / M1 Delivery only. Director: Astra/high. No commit, push, deployment, or later campaign work authorized.

## Baseline

- Checkout: `/Users/vikram/Developer/website` (shared existing checkout).
- Preserved user state: deleted `BASTROP37_PLAN.md`; untracked `BASTROP37_PLAN_OLD.md`, `.BASTROP37_PLAN.md.swp` (not read), story and planning docs.
- Existing game is a Canvas 2D rear chase timed escape; old sea-wall, Voss, countdown copy is a replacement target.
- Baseline build and 17-test suite launched; results pending.

## Ownership

- Director: this status, `contracts.ts`, tests, final integration, browser verification and acceptance.
- Gameplay Sol/high: `src/scripts/bastrop37.ts`, new `delivery.ts` and `save.ts` if needed; gameplay handoff.
- HUD Sol/medium: `src/pages/bastrop37/index.astro`, scoped additions to `src/styles/bastrop37.css`, new `hud.ts`, minimal vector character assets/manifest; HUD handoff.
- Independent Sol/high reviewer rotates in after integration; read-only review except its handoff.

## Agreed interface

`src/scripts/bastrop37/contracts.ts` contains `HudView`, `HudActions`, `DialogueLine`, `BeatMode`. HUD exports `createHud(actions): { render(view): void }` from `hud.ts`. Gameplay owns all state and invokes render; HUD sends callback intentions. Keep legacy `#game`, `#start`, `#pause`, `#mute`, `#overlay`, `#feedback` and `[data-key]` hooks; other old UI access must migrate to HUD module. Gameplay alone binds mute, canvas keyboard and touch riding controls. HUD binds menu/dialogue controls. Root is `#bastrop-game`.

L1.01 sample: story, objective DELIVER THE MODULE, first line `L1.01-01`, vlad, “You have the module?”, completion `dialogueComplete` after five acknowledgments and steering introduction. L1.02 uses authored civilian traffic gaps and dead signal; L1.03 introduces Omega; L1.04 service gate; L1.05 manual closure then save.

## Decisions

- Continue at M1 ending opens an honest end-of-slice boundary/menu; it cannot load Level 2.
- No new raster art is necessary: retain Jo/bike/environment; small original vector Vlad portrait, Omega symbol and projected signal/gate dressing are the minimal kit.
- No civilian combat, drones, Overdrive, jump tutorial, or new audio work in this slice. Preserve engine capability for future work without enabling later campaign encounters.
- Retain riding, collision, mobile, pause, audio, gallery/home navigation coverage; replace obsolete timed escape and villain assertions. Future drone/jump coverage must be retained in a clearly isolated regression fixture if practical, not exposed as campaign mechanics.

## Verification / next actions

Pending baseline results, worker integration, scenario tests, actual browser captures at desktop/mobile, save/restart and storage-failure checks, independent review and material fixes.
