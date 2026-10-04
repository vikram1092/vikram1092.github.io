# Phase 3 M3 HUD handoff

## Final director integration addendum — 2026-10-01

Integrated HUD passed the final 48/48 suite and fresh independent four-size action/visual review. Final story geometry is under `phase3/m3/story-geometry.json`; action evidence is under `phase3/m3/review/`. Whole-card keyboard/touch and prior M1/M2 controls passed. Mobile long text has 51.4px rider clearance and 17px D-pad separation, no overflow/page errors. Reviewer noted duplicate mobile connection labels at 8–9px as nonblocking readability polish; runtime was kept frozen.

M3 is verified locally and awaits user acceptance. Full results, performance limits, independent verdict and exact pickup are in [director handoff](PHASE_3_M3_DIRECTOR.md) and [review](PHASE_3_M3_REVIEW.md). The original worker-stage notes below retain provenance; pending integration items there are now fulfilled by this addendum. No commit/push/deploy occurred. Stop here; publication needs explicit approval after acceptance, and M4/M5 remain unauthorized.

## Original worker handoff

2026-10-01. User authorized M3 implementation. This handoff covers only the assigned live page, scoped style, and HUD renderer. Integrated browser behavior remains pending gameplay wiring and final build readiness.

## Implemented

- `src/scripts/bastrop37/hud.ts`: L3 chapter number/menu fallback copy, action ability visibility, and relay A/B plus IN RANGE / LINKING / OUT OF RANGE / LINKED display from the optional gameplay `connection` view. The existing gameplay-owned `missionMeter` remains the one visible progress meter; the HUD does not calculate link time or grant progress. Connection styling is removed when the field is absent, preserving M2 meter geometry. New Game continues to say START DELIVERY because its runtime action begins at L1.
- `src/pages/bastrop37/index.astro`: one compact status label beside the existing meter title, accessible as a polite status, plus chapter-neutral page title. The receiver remains one native whole-card button; its acknowledgment and chronological history code is unchanged.
- `src/styles/bastrop37.css`: scoped local cyan/amber connection treatment and a compact mobile width. Existing road, receiver, controls, gallery and portfolio selectors remain in place.

## Verification evidence and limits

- Read the story bible, L3 Phase 1 beats, approved Phase 2 revision-v3 HUD/art notes, the accepted M1 speaking HUD revision and M2 HUD handoff, the M3 director scope, and the frozen `HudView` contract.
- `git diff --check -- src/pages/bastrop37/index.astro src/styles/bastrop37.css src/scripts/bastrop37/hud.ts` passed with no whitespace errors. Source inspection confirms the new status is read-only and the mission progress still renders only from `view.missionMeter`.
- Actual 1440×900, 1280×720, 1024×768 and 390×844 integrated browser captures, keyboard/touch checks, build diagnostics, and independent review are **pending**. Prior M1/M2 screenshots are not M3 verification.

## Dependency and next steps

1. Gameplay must provide `missionMeter` alongside `connection` during active L3 link windows. `missionMeter.label/value/detail` owns the single progress rail; `connection.relay/state` owns the adjacent local status text. This hook was sent to the director for gameplay coordination.
2. When the integrated build is ready, inspect real action/link/out-of-range/linked and long dialogue states at all four required sizes. Record geometry and screenshots under `docs/bastrop37/phase3/m3/hud/` only if those checks actually run.
3. Director and independent reviewer validate M1/M2 regression, whole-card acknowledgment, native focus, mobile controls, and local-only L3 presentation before M3 acceptance. No publication or later chapter UI is included.
