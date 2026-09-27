# Delivery revision 2 — art notes

2026-09-27. **Unapproved Phase 2 candidate**, one Delivery treatment only. This is isolated asset production and visual review, not runtime integration. Latest user rejection supersedes the prior treatment's visual acceptance for this revision; original and v1 files remain preserved.

## Material and camera agreement

Director and HUD agreed charcoal blue damp concrete, oxidized civic steel, worn dirty ivory paint, restrained amber utility fixtures, scarlet rider focal point, cyan reserved for Omega/technical states. Detailed inked and painted raster forms relate to the original `scarlet-bike-neon-traffic.jpg`: substantive housing/beam depth, deliberate contours, joints, recesses and material wear. Street fronts feel inhabited and maintained unevenly, not a prison or military perimeter. Only Jo, Vlad and Omega remain speakers; art adds no character. Inland service streets; no water horizon.

Desktop composition agreement: rear chase, vanishing point 50% X / 42% Y; open foreground road, architecture on shoulders. The generated corrected source converges visually near (768,440), or 50% X / 43% Y. Align that source point to the scene horizon. Preserve source aspect ratio. Mobile must crop/reposition framing around the scene's 32% horizon rather than squeeze a wide source into portrait. The source aperture is transparent; HUD owns road, skyline, rider and scene layering. Viewport scaling and safe geometry still require later runtime measurement.

## Three candidates

| File | Source | Display / anchor |
|---|---|---|
| `assets/delivery-architecture-v2.png` | 1536×1024 | Full framing source; visual vanishing anchor (768,440). Apartment/shop frontage left, municipal service frontage right; central sky and road alpha. |
| `assets/signal-dead-v2.png` | 1024×1536 | Crop x304,y7,w428,h1510; foot anchor source(538,1515). Review at150/280px height. Three dark lenses, separate rain hoods, cabinet and conduit. |
| `assets/service-gate-open-v2.png` | 1536×1024 | Crop x20,y8,w1504,h994; ground anchor source(768,999). Review at320px width. Asymmetric service pylon, structural beam, blank sign, no lower arm. |

The architecture's first output converged at about68% height. It is preserved as `assets/delivery-architecture-v2-initial.png` for provenance, **not selected for composition**. A targeted imagegen edit rebuilt perspective while preserving materials. No campaign art was regenerated.

All selected bodies use `source-over`; source alpha stays unchanged. The signal has almost invisible nonzero-alpha fringe outside its visible body; the display crop excludes it. No crop-derived collider is proposed. Architecture never collides; signal stands outside the riding corridor. Gate's visible opening is approximately x450–1260 below the overhead beam, but eventual safe lane geometry must be authored independently. Gate perspective gives the upper beam a slight slope; do not distort it to manufacture a rectangular collision boundary. No additional states, effects, signage words or characters were generated.

## Provenance and verification

Used the `imagegen` skill at `/Users/vikram/.codex/skills/.system/imagegen/SKILL.md` and the **built-in image_gen** tool. Four calls total: architecture, signal, gate, and one targeted architecture perspective edit. Exact prompts are the adjacent `.prompt.txt` files; manifest records exact source filenames under `/Users/vikram/.codex/generated_images/01a0e47a-a942-7141-a040-8fb95c946efe/`. Selected output PNGs were copied into this workspace without resizing, color processing or alpha edits. No CLI/API fallback.

Inspected original concept, skyline, road, rider, old L1 art sheet and prior desktop STORY composition. Visually inspected each generated output, corrected architecture, and [contact sheet](assets/asset-contact-sheet.png). [Contact sheet HTML](assets/asset-contact-sheet.html) shows architecture at840×560 with pale background through alpha, signal at150/280px body height, and gate at320px width on dark/light backgrounds. Housing, pole and gate silhouette survive those scales; no generated wording, active signal lens, unwanted opaque background or muddy halo observed. The contact sheet is diagnostic, not the composed riding scene.

Actual selected PNG downloads total **6,003,921 bytes**. Nominal RGBA decode totals **18,874,368 bytes** (each selected image1,572,864 pixels), excluding browser/GPU copies, mipmaps and overhead. Retained initial candidate and review capture are not runtime assets. Alpha ranges0–254 for selected files; zero-alpha shares architecture52.47%, signal78.43%, gate59.12%. Exact nonzero and alpha>20 bounds are in [asset-manifest.json](asset-manifest.json).

Reproduce measurements from repo root: `node docs/bastrop37/phase2/revision-v2/assets/measure-review.mjs`. It reads the three selected PNGs, measures via Chromium canvas and writes only this revision's companion manifest. Reuse paths resolve to unchanged skyline, road, Jo and Vlad. Canonical meaning remains ENV-L1, PROP-SIGNAL, PROP-SERVICE-GATE; versioned IDs prevent overwriting the v1 register. No live sprite manifest changes.

## Remaining gate

Director/HUD review the new scene composition and mobile crop, then user reviews this one treatment. Asset approval is pending. Isolated scale/alpha checks do not validate parallax, road-loop motion, visibility while playing, gate traversal, collisions or performance. Those require separately authorized Phase 3. Later chapter production stays paused until the treatment is accepted.
