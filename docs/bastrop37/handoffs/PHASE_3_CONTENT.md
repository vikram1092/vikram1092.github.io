# Phase 3 M0/M1 content handoff

2026-09-27. Assigned content and asset-transfer scope only. This handoff records prepared data; it does not claim a playable Delivery slice or validated gameplay behavior.

## Completed

- `src/scripts/bastrop37/delivery-content.ts` exports `DELIVERY_DIALOGUE: Record<string, DialogueLine[]>` using the existing `contracts.ts` type. Keys `L1.01`, `L1.03`, and `L1.05` contain the exact thirteen approved speaker lines and stable IDs. L1.02 and L1.04 are action beats without speaker dialogue.
- The same module exports `DELIVERY_ASSETS: Record<DeliveryAssetKey, string>` with root-relative public URLs for architecture, dead signal, open service gate, blocked crossing, neutral Vlad, and contained Omega. `DELIVERY_ASSET_METADATA` maps the same keys to canonical ID/state, layer, measured source size, source anchor/space, and display crop. Source coordinates are descriptive; runtime projection and collision remain gameplay-owned.
- Six versioned production copies are under `public/bastrop37/assets/delivery/`. The v2 architecture/signal/gate come from `phase2/revision-v2/assets/`; the v3 blocked-crossing barrier comes from `phase2/revision-v3/assets/`; Vlad/Omega come from `phase2/assets/`. Original rider, road, traffic, and existing source artwork were untouched.

## Verification

- Transpiled and imported the new TypeScript module, then compared its flattened thirteen dialogue objects in order against the revision-v3 review page's canonical lines: exact match.
- Compared the three v2 metadata records against the measured v2 companion manifest, the blocked-crossing record against the v3 companion manifest, and checked all six public URLs resolve to files.
- SHA-256 hashes of each production copy equal its selected source. `npm run check` passed with zero errors, warnings, or hints.

## Remaining for gameplay/HUD owners

- Import the content module and bind dialogue acknowledgment to authored beat transitions. L1.03 acknowledgment must change the objective to `TAKE THE SERVICE LANE`; L1.05 closure follows gate and approach-marker passage, safe drain, and a truthful save result.
- Calibrate art projection, source crop, feet, and traversable geometry in the real renderer; the metadata alone does not establish a hitbox or route. The revision-v3 approach-marker overlay is still outside this transferred package and can be considered by the runtime owner for the L1.05 visual treatment.
- Validate clear-road dialogue, fresh-press advance, checkpoint/reload, save failure and missing-next-level recovery, and desktop/mobile gameplay. These behaviors are specified but unimplemented by this content package.

Phase 3 is restricted to M0/M1 Delivery. Later chapters, character additions, new audio, and runtime architecture changes are outside this handoff.
