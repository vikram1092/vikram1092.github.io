# BASTROP37 prototype assets

## Production sprite kit — September 24, 2026

`sprites/` contains five transparent RGBA sheets and 49 individual 640×640 padded PNG frames. Browse `/bastrop37/assets/` for individual downloads. `sprites/manifest.json` maps names to files, source rectangles, canvas sizes, center pivots, and blend modes.

Primary bike set: `bike-angles-sheet.png` supplies five matching views (straight, left/right gentle steer, left/right hard slide) for each of normal riding, deployed blades, and jumping. Use `bike-{normal|blades|jump}-{straight|left-15|right-15|left-35|right-35}.png`. Angle numbers are intended pose labels, not measured camera calibrations. Initial bike sheet remains available for turbo and jump transitions. Correction prompt: `scripts/bastrop37-bike-correction-prompt.txt`.

- Bike: neutral, steering left/right, slides left/right, deployed blades, turbo body, jump anticipation/rise/apex/fall/landing.
- Drone: hover, flanks, attack warning, lunge, left/right broken ring and separate core. Animate the fragments independently for split-and-tumble destruction.
- Traffic: white sedan straight/left/right, yellow hauler straight/left, purple coupe.
- Effects: cyan trail, yellow turbo, hover thrust, blade overlay, cutting/impact sparks, landing ring, debris. Render separately; suggested additive blend for effects. Body PNGs use source-over.

Art generated once with built-in image_gen using the three approved concepts. Prompts: `scripts/bastrop37-sprite-prompts.json`. Rebuild individual frames with `node scripts/package-bastrop37-sprites.mjs` (ImageMagick required). Generated alpha is preserved, including soft edge transparency. Sprite sheets are pose/state collections; jump height, transition timing, scale, trails, and fragment motion belong to the game renderer.

The environment is split into lossless high-definition assets: `environment/city-skyline-v4.png`, a clean elevated rear-chase skyline plate, and `environment/road-loop-v4.png`, a pristine orthographic five-lane wet-road texture. The Canvas renderer perspective-maps and loops the complete road asset beneath the stationary city layer, so its asphalt and lane markings move together without competing procedural lines. Its backing resolution scales up to 2× for large and Retina-class displays while gameplay stays in the original logical coordinate system. Prompts: `scripts/bastrop37-environment-prompt.txt`.

## Original prototype

Original code-drawn SVG sprites for milestones 01–02. Integer coordinates and crispEdges preserve a pixel-art silhouette. Transparent backgrounds. No external assets or fonts embedded. Bike 32×64, coupe 32×56, hauler 44×84.

The game uses one bike sprite transformed continuously for lean/slide poses. These are functional placeholder designs, not the final art pass or final animated sprite sheet.

Browse /bastrop37/assets/ to inspect originals; /bastrop37/ to play. Future work: original production sprites, art direction reference, missions, pursuit, audio, intro, finale. Those are intentionally outside this milestone.
