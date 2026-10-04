# Bastrop37 — Agent operating plan

Current completion status (2026-10-04): the approved five-level campaign is complete and published as `61427a0` after independent review, 81 distinct passing scenarios across the full/focused runs, successful Pages deployment and public script-byte/smoke verification. The requested work is complete; stop after the documentation-record remote/deployment check. No further level or implementation phase is queued. Read BUILD_STATUS and handoffs/PHASE_3_CAMPAIGN_REPORT.md for exact results and limitations; historical gates below remain context.

Current authority (2026-10-04): the user explicitly approved all remaining stages and said to finish all levels, push and stop. Phase 3 M4 and M5, full campaign integration/review, commit/push and the normal GitHub Pages deployment are authorized. Complete the approved five-level campaign sequentially; no further milestone/publication permission is needed. Director owns orchestration and single-writer delegation. Earlier M3-only/acceptance/publication gates below are historical and superseded for this request.


Current authority (2026-10-01): the user explicitly said **“Yes begin M3.”** Phase 3 M3 implementation and validation are authorized through PUBLIC ROUTE READY, with Omega contained. M3 is now implemented and verified locally: 48/48 tests and independent review passed; see BUILD_STATUS and the M3 director/review handoffs for actual evidence and limitations. Stopped for user M3 acceptance. M4/M5 remain unauthorized; push/deploy require explicit publication approval after M3 acceptance. Director owns orchestration and single-writer delegation. Earlier audit/authority notes below are historical.

Historical pickup authority (2026-10-01, before M3 authorization): M2 was accepted by the user and published as `209ab59`; `939066d` records that approval. The current request authorizes a director-led pickup audit and M3 scope determination only. **M3–M5 remain unauthorized.** Ask for explicit M3 implementation/validation authorization; then stop at verified M3 for user acceptance. Push/deploy additionally require explicit publication approval after M3 acceptance. See [M3 scope handoff](handoffs/PHASE_3_M3_DIRECTOR.md). All prior authority notes below are historical.

Historical authority (2026-09-28): the user accepted M1 and requested continuing Phase3; root confirmed **M2 only**, stopping at its second review gate. M3–M5 and M2 publication require later authorization. Prior authority notes are historical.
Historical authority (2026-09-27): the user confirmed **“I approved it all”**, approving the full revised Phase 2 package, and authorized **Phase 3 M0/M1 only**. After M1 was verified, the user authorized pushing and publishing this slice. Stop after M1; no M2–M5.

Authorized configuration: Astra manages; Sol implements and reviews; Luna handles bounded mechanical work when useful. This document records the user's selected team, not a request to maximize agent count or reasoning effort.

## Director and working context

- Director: `gpt-6-astra`, reasoning `high`, in a fresh project chat.
- The director owns creative consistency, task boundaries, dependencies, integration, and milestone acceptance.
- Work in the existing website checkout. A separate chat provides separate conversational context, not filesystem isolation.
- Read `BASTROP37_STORY.md` and all three phase documents before assigning work.
- Preserve unrelated changes. At setup, the original `BASTROP37_PLAN.md` was deleted in the working tree, `BASTROP37_PLAN_OLD.md` and `.BASTROP37_PLAN.md.swp` were untracked, and the new story/docs were untracked. Treat these as user work; do not restore, remove, or bulk-stage them. Do not open or modify the editor swap file.
- The old prototype's automatic commit/push instruction is historical. The user's later request explicitly authorized publishing the verified M1 slice; no M2–M5 work is included.

## Historical scope and phase gates

The phase assignments and gates below are retained as historical project context. The current authority block at the top of this file supersedes them.

The 2026-09-27 user request authorizes **Phase 1 narrative and encounters only**: revise all five levels in documentation, consult gameplay for read-only feasibility and content for continuity, independently review the revised documents, and stop for user approval. No production assets, runtime edits, or M0/M1 work are authorized by this request.

Phase 1 was approved on 2026-09-27; no later phase is authorized by that approval alone.

Phase 1 → user approval → Phase 2 art and isolated HUD production → user approval → Phase 3 implementation and validation. M0 and M1 are milestones inside Phase 3. Agent setup and a completed document are not permission to cross a phase gate.

Historical initial assignment (superseded for this request): execute M0/M1, establish a baseline, and build a Delivery slice. Preserve existing files from that effort, but do not continue it under the Phase 1 request.

Jo has already picked up a module for Mayor Vlad. Level 1 portrays Vlad as helpful. Omega speaks from the module. Only these three characters speak. Keep inland Bastrop, third-person sprite-based riding, small character assets, clear-road dialogue, mobile compatibility, and no new audio or 3D migration.

## Roles and models

1. Gameplay engineer: `gpt-6-sol`, `high`. Owns mission state, traffic drain, safe cruise, dialogue sequencing, checkpoints, and simulation wiring.
2. HUD engineer: `gpt-6-sol`, `medium`. Owns reviewed game layout, dialogue card, objective/ability states, responsive styles, and menu presentation. Escalate to `high` only for a concrete interaction problem.
3. Independent reviewer: `gpt-6-sol`, `high`, fresh context after integration. Review requirements and diff, exercise the actual game, and report actionable findings. Rotate in when an implementation worker finishes.
4. Optional mechanical worker: `gpt-6-luna`, `medium`. Only for explicit data/manifest validation, specified edits, and routine checks. Do not create until such work is ready. Use Sol/medium instead when visual judgment or substantial implementation is required.

Use native subagent tools for workers; do not create a user-owned sidebar chat for every subtask. The user explicitly authorizes these model/effort assignments and delegation. For model overrides, spawn with fresh or limited history (`fork_turns: "none"` plus a self-contained assignment is preferred). Do not use a full-history fork with model overrides.

Maximum four active agents including director under the current environment. Initially use director plus two workers. No recursive delegation by workers unless the director has an explicit reason and capacity. Director remains Astra/high; an implementation failure is not a reason to downgrade management or promote every worker to Astra.

## Coordination rules

- Director agrees the minimal mission/dialogue-to-HUD interface before parallel edits.
- Assign one writer per file. Gameplay owns the existing main script initially; HUD owns page/style changes. Assign new modules explicitly. HUD should request runtime hooks rather than edit the gameplay owner's file.
- When interfaces are unresolved, workers may independently inspect and propose, but dependent edits wait for the agreement.
- Director owns final integration; workers cannot overwrite one another's changes or independently commit the entire shared checkout.
- Use current image-generation skills/tools for new raster art only when needed for the minimal slice. Preserve approved originals and keep the art scope small.
- Do not start a broad refactor, renderer replacement, asset regeneration campaign, or later-level mechanic during M1.
- Worker findings are evidence, not automatic acceptance. Director reviews the integrated behavior.

## Assignment packet

Every worker receives: objective; relevant document sections; current baseline and repository path; owned files; shared interface; forbidden scope; acceptance checks; required return format.

Avoid copying the entire design conversation. Include the confirmed story constraints in the packet and point to the documents for details.

## Durable state and handoffs

Director maintains `docs/bastrop37/BUILD_STATUS.md` with milestone, assigned owners/files, interfaces, completed work, verification results, blockers, and next actions. Maintain a concise decision log there or in `DECISIONS.md` when needed. Workers write bounded handoffs under `docs/bastrop37/handoffs/` at completion or before replacement.

Handoff contents: implemented behavior and beat IDs; files changed; test commands/results; known defects; decisions and reasons; outstanding work; exact next step. Record facts and outcomes, not hidden reasoning transcripts. Do not present plans as completed code.

Refresh context at natural task boundaries. Before replacement or compaction, persist state. A successor reads the handoff and verifies the actual repository rather than trusting the summary alone. Only the director normally needs the full four-document scope in active context.

## Acceptance

Current Phase 1 acceptance: reviewable five-level narrative, stable beat/line IDs, playable encounter and retry specifications, independent document review, recorded open creative questions, and a bounded Phase 2 handoff. Stop for user approval. Runtime acceptance below applies only after Phase 3 is explicitly authorized.

M1 must run through Delivery with manual reading pace, visible traffic clearing, correct objectives, a saved ending, and functioning desktop/mobile controls. Test actual browser interaction and inspect screenshots, not just unit assertions. Report any unverified visuals or limitations.

Use independent Sol/high review, resolve material findings, and return the playable first slice plus a concise report to the user. Keep scope at M1 until review. Do not wait for permission for routine reversible implementation already inside this scope.
