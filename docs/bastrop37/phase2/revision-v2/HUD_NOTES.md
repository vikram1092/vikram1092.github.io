# Delivery treatment 02 — isolated visual revision

2026-09-27. Phase 2 only. This revision responds to rejection of the previous broad art/HUD treatment. It presents one revised Delivery scene in ACTION, VLAD DIALOGUE and OMEGA DIALOGUE. No later chapter production or live integration is included. Final user acceptance remains pending.

## Direction and visible changes

The original `scarlet-bike-neon-traffic.jpg` is the visual reference: a substantial scarlet rider against a rain-polished industrial city. Reused bike, wet asphalt, skyline and civilian sprites remain unchanged. Detailed content-owned raster frontage, dead signal and open gate replace the old simple geometric scenery. Cool worn metal, pipes, shutters, ivory civic paint and sparse amber lamps give the environment a shared material language.

The HUD uses open tachometer and segmented energy rails instead of a dashboard box. Heavy condensed italic type gives speed/objective/speaker hierarchy; body dialogue remains a conventional clear sans serif. The municipal channel uses amber stamped rails and the single neutral Vlad portrait. The contained local Omega channel uses muted cyan and its existing symbol. Jo has text only. No hostile/Overdrive demand is added to Delivery.

This is a new candidate, not a claim that the old package was accepted or that the game implements these visuals. Comparison sheet: `captures/comparison-sheet.png`; desktop/mobile state sheet: `captures/contact-sheet.png`.

## Camera and composition

Director-approved starting camera: central vanishing point, desktop road horizon42% of scene height; portrait32%. The new architecture's measured source vanishing point(768,440) in1536×1024 is aligned to the road horizon. Its aspect ratio is preserved; portrait crops a1.42×viewport-width composition rather than squeezing the flanks into thin columns. Textured dim asphalt continues under frontage where portrait framing ends; there are no flat gray roadside wedges.

Final grounding correction uses the straight rear bike on the straight road. Its taller aspect requires width14% capped200 CSS px on desktop and25% of portrait width to retain a substantial foreground area while leaving the near gap readable. Desktop base92%scene height; portrait action78%, dialogue56%. The rider remains fully above portrait comms. Earlier240px angled-pose studies are superseded.

Traffic center, width and service-gate opening derive from the same `roadHalf(y)` function used by the projected asphalt. This keeps whole civilian bodies inside the actual road aperture and the gate opening aligned with the right service lane. Modest ground shadows remain separate from source sprites. All scales are static design values, not collision or runtime calibration.

The original road is mapped in horizontal strips. Architecture, traffic and props are independent2D layers. A restrained radial distance haze draws beyond its full transparent radius; its edge never becomes a rectangular overlay. No3D, audio, shader migration or animation framework was introduced.

## State behavior

ACTION shows the L1.04 service-route proposal, open gate and civilian traffic. DIALOGUE shows a cleared neutral road; the next gate and civilian actors are absent. This contrasts static states; it does not simulate draining or route progress.

The Vlad selector starts L1.01-01 and contains all five exact L1.01 lines. Omega starts L1.03-01 and contains all five exact L1.03 lines. Full sentences appear immediately. Continue/Enter manually advances; Jo turns have no portrait. After the last line, this review returns to the ACTION sample. That is review navigation, not an implementation of every intervening encounter. Exact IDs remain in the outside-frame notes and `?view=omega&line=4` is available for long-copy review.

No saves, score, global timer, pause simulation, collision, touch driving or storage exists. Touch buttons show placement only. View navigation is outside the scene and explicitly labeled a static study. Source styles/scripts are confined to this isolated directory.

## Responsive and accessibility checks

Primary1440×900 and390×844; secondary1280×720 and1024×768. Desktop dialogue18px, intermediate16px, portrait16px. Portrait ENERGY/TURBO labels10px without global scale; keyboard SHIFT hint hidden on touch. Native buttons have visible focus and44px-class touch advance targets. Portrait full-width comms sit above separate steering/turbo controls. Reduced-motion has no animations to suppress and an explicit CSS fallback.

Reproduce with a root static server on4178 and `node docs/bastrop37/phase2/revision-v2/captures/capture-check.mjs`. Optional `REVIEW_URL` supports the root-owned published URL. Final result:20 viewport/state/long-copy captures; no console/HTTP/missing-asset errors or horizontal overflow; portrait bike-to-comms gap>10px and comms above controls; manual advance, text-only Jo, keyboard focus and reduced-motion checks pass. See `captures/render-checks.json`.

## Next gate and limits

Independent visual review must accept materials, perspective, grounding and hierarchy before technical review or expansion. Actual traffic movement, touch handling, resizing during play, collision, performance, accessibility settings and runtime data hooks remain Phase3 work requiring explicit authorization. Root owns publication. V1, all live source and original public assets are preserved.
