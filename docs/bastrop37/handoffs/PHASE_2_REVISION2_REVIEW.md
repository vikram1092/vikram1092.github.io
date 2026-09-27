# Phase 2 revision 2 — independent visual review

2026-09-27. Scope: **one revised Delivery ACTION / Vlad dialogue / Omega dialogue treatment**. Recommendation: **present this treatment to the user for visual judgment**. This is not visual acceptance, Phase 2 completion, approval of later chapter kits, or Phase 3 authorization.

## Visual verdict

The revision materially addresses the rejected package's central problem. The new apartment/service frontage has deep reveals, pipes, worn shutters, uneven concrete, and localized amber light. The signal's hooded dark lenses and the gate's asymmetric machinery/beam have actual volume and weathering. These painted contours and surfaces now belong with the scarlet bike and detailed city backdrop. The rejected v1's flat window blocks and front-elevation gate no longer determine the foreground language.

The final desktop composition reads as a dense inland service street: near blue-gray frontage frames a hazier tall city, the wet road remains central, the rider has substantial foreground scale, and the service opening is visible on the right. Cars now sit within the asphalt aperture; the upright bike matches the straight road. The amber/ivory equipment belongs to the street rather than appearing as a separate vector kit. The final horizon haze no longer ends in a hard rectangular edge.

The HUD is also meaningfully revised. The open speed arc, segmented energy rail, condensed italic objective and asymmetrical communication strip create a recognizable instrument vocabulary. It avoids the v1 arrangement of repeated generic rectangular panels. Dialogue has the strongest local text hierarchy, with a restrained portrait/symbol, clear message, and advance action. Its remaining dark communication backplate serves legibility rather than becoming a dashboard grid.

This is a quieter and more symmetrical scene than the original concept's dramatic traffic/action image. It restores much of its material density, scarlet focal point and depth; it does not reproduce that concept's full sense of motion or spectacle. Those distinctions should remain visible to the user when presenting the revision.

## Findings, fixes and remaining limitations

No unresolved blocker was found for **presenting this bounded static treatment** after the fixes below. This conclusion rests on visual inspection, not solely on successful dimensions/layout checks.

| Consequence | Finding and reproduction | Final result |
|---|---|---|
| Medium, corrected | At 1440×900 ACTION, initial sedan/coupe placement overlapped storefront/curb areas. See `review/initial-current-1440-action.png`; scene projection/actor placement in `revision-v2/preview.js`. | Final `review/1440x900-action-0.png` places both vehicles on asphalt and the open gate on the right service passage. Upright rider pose also resolves the straight-road/lean mismatch seen in the earlier owner capture. |
| Medium, corrected | At 390×844 ACTION, flat shoulder wedges and a signal foot over featureless fill weakened grounding. See `review/initial-current-390-action.png`. | Final mobile scene uses a dim textured roadside under the frontage. Signal base has a ground surface; the gate has two readable feet. |
| Medium, corrected | Mobile `.instruments` scaling reduced ENERGY/TURBO labels to roughly 6px apparent size and retained a tiny desktop SHIFT cue. | Final `review/390x844-action-0.png` uses legible 10px energy/turbo labels and omits SHIFT. |
| Low, corrected | The radial haze was clipped before reaching transparency, producing a horizontal rectangular boundary over the desktop road. Reproduced in ACTION and dialogue. | Final `preview.js` draws beyond the radial extent; final `review/1440x900-omega-0.png` shows a continuous fade. |
| Low, remaining visual limitation | Portrait mobile has less prop detail and a more distant street framing than desktop. In final `review/390x844-action-0.png`, signal is about 83px tall and gate about 136px wide, below the standalone sheet's 150px signal / 320px gate examples. | Signal and open-gate silhouettes remain recognizable, but their surface detail is not a prominent mobile read. Show the actual mobile capture with desktop rather than imply equal richness. No additional asset production recommended before user judgment. |

## Evidence actually inspected

Read the current user assignment, `BASTROP37_STORY.md`, Phase 1 Level 1, Phase 2 specification, current `BUILD_STATUS.md`, and revision `ART_DIRECTION.md`. Independently inspected the actual original `public/bastrop37/assets/scarlet-bike-neon-traffic.jpg`, rejected v1 `phase2/captures/full-1440x900-service.png` and `phase2/final-review/1440x900-delivery-action.png`, all three selected raster images, and the light/dark asset contact sheet.

Captured the current local preview independently with [review/independent-check.mjs](../phase2/revision-v2/review/independent-check.mjs). Results and final source hashes are in [independent-checks.json](../phase2/revision-v2/review/independent-checks.json). Final visual inspection included:

- [1440×900 ACTION](../phase2/revision-v2/review/1440x900-action-0.png), [Vlad](../phase2/revision-v2/review/1440x900-vlad-0.png), and [Omega](../phase2/revision-v2/review/1440x900-omega-0.png).
- [390×844 ACTION](../phase2/revision-v2/review/390x844-action-0.png), [Vlad long line](../phase2/revision-v2/review/390x844-vlad-2.png), and [longest reply](../phase2/revision-v2/review/390x844-omega-4.png).
- [1280×720 ACTION](../phase2/revision-v2/review/1280x720-action-0.png) and [long reply](../phase2/revision-v2/review/1280x720-omega-4.png); [1024×768 ACTION](../phase2/revision-v2/review/1024x768-action-0.png) and [long reply](../phase2/revision-v2/review/1024x768-omega-4.png).

The original-sized and final captures were viewed, not inferred from author summaries. Initial-current captures remain explicitly diagnostic history; the other viewport captures are the final run.

## Copy, layout and asset checks

- 20 captured layouts: ACTION plus two Vlad and two Omega exchange positions at all four requested sizes. No horizontal overflow, missing decoded scene assets, page exceptions or HTTP errors.
- All ten L1.01/L1.03 dialogue lines match Phase 1 text and speakers exactly. Manual button and Enter advancement worked; keyboard focus reached controls. JO remains text-only. No fourth speaker, threatening Vlad treatment, or premature public Omega release was found.
- Dialogue scenes visually remove traffic and the upcoming service gate. They retain the rider and clear road. This verifies static composition only; no traffic-drain behavior is claimed.
- Mobile dialogue is 16px. The longest inspected reply begins at y537, after the rider ends at y512.68; its strip ends at y756 before touch controls start at y778. Desktop dialogue is 18px, with 16px at 1024px width. No inspected comms panel covers Jo.
- Three manifest entries match actual PNG dimensions/byte lengths and have existing prompt files. Source provenance, alpha/crop/anchor, blend, layer, collision intent and memory estimates are supplied. All remain unapproved candidates. The standalone signal/gate edges were inspected on light and dark backgrounds; no opaque sprite rectangle or generated wording was seen.
- Read-only `git diff --name-only -- src public tests` returned no tracked changes. This reviewer made no production, narrative or asset edits.

## Handoff and exact next step

Created only this report and `phase2/revision-v2/review/**` evidence/script. Present **one revised Delivery treatment**, preferably desktop ACTION and Omega dialogue beside their actual mobile counterparts, plus the three-asset sheet and original/v1 comparison. Describe the material/depth/HUD improvements and the mobile detail tradeoff. The user decides whether it fits Bastrop37 before any chapter-wide propagation.

Not verified: real riding, actor exits/drain, moving road seams/parallax, gate traversal/collisions, checkpoint/save/failure paths, performance/loading on devices, large-text settings, or actual touch gameplay. The page is an isolated static proposal; these require separately authorized implementation/validation. No push, deployment, new chat, phase advancement or chapter-wide approval is performed by this review.
