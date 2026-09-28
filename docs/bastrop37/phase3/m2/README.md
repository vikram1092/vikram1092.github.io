# M2 local playtest evidence

Phase 3 M2 only. Production is built locally at `http://127.0.0.1:4321/bastrop37/`; M2 has not been pushed or deployed.

## Playtest route

Start a new Delivery or continue an existing completed Level 1 save. At the saved Delivery ending choose **CONTINUE TO INTAKE**. Read the three opening lines, ride through the broad inspection lane, acknowledge both equipment records separately, and read the confrontation through Jo's refusal.

The refusal saves a safe retry point. Steer outside the marked recovery lock for 1.5 continuous seconds, then clear the pursuit exit. Use lateral movement when the drone signals its attack, or hold **J / Control** for blades. Ordinary **Shift** turbo remains available when its energy is sufficient. Overdrive is optional and uses its own meter; one drone cut gives 35 points, not an automatic full meter.

After the road clears, read all four closure lines. **RECOVERY LOCK BROKEN** is the saved M2 ending. Reload/Continue restores it; **RIDE TO THE RELAY** reports the bounded slice ending. Level3 is not playable in this milestone.

## Evidence

- `record-1440.png`, `record-1280.png`, `record-1024.png`, `record-390.png`: real runtime equipment receipt at the four required sizes.
- `mobile-long-dialogue.png` and `geometry.json`: full confrontation line,51.4px rider clearance and 17px D-pad gap; no horizontal overflow.
- `desktop-intake.png`, `desktop-record.png`, `desktop-drone-failure.png`, `desktop-blade-defense.png`, `desktop-complete.png`: real input-driven chapter states.
- `earned-completion-save.json`: earned by the passing fresh continuous L1–L2 browser run; it is not a fabricated progress fixture.
- `review/`: fresh independent review evidence, owned by the reviewer.

All 36 automated cases have passing results across the full run/targeted reruns; exact run counts are recorded in BUILD_STATUS and the director handoff. Retained independent desktop/mobile evidence passes; the reviewer disconnected during prose handoff. The director-authored review record transparently records that limitation and accepts M2 for user playtest. Browser device emulation is not physical-phone performance evidence. No M3–M5 or publication is authorized here.

Overdrive playtest limitation: a fresh M2 encounter can award at most55 points (20 from its two unique civilian near-passes and35 from its one drone). It therefore cannot naturally reach 100. Full-charge activation is verified only in the localhost fixture. No farming, extra traffic encounter or required Overdrive gate was added. Root explicitly accepted this as a prototype/playtest limitation.
