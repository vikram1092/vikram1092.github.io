# The Pierogi Trail — revision 3

Live route: `/pierogi-trail/`.

Revision 3 gives every cave its own original painting based on documented real-world formations, plus a matching stone floor. Pierogi are 56 pixels wide instead of 34, about 65% bigger. The seven asset paths and crop settings live in `src/scripts/pierogi-trail/cave-art.ts`, so swapping an image does not require engine changes. See [CAVE-ART.md](CAVE-ART.md) for the file list, replacement instructions, references and full generation prompts.

The page is now only the game. It fills the viewport without a website header, title, start card, footer, field-guide dialog, separate passport section, toolbar, or jump button. The seven cave stamps, current region, pierogi total, and a thin route-progress line sit across the top as a read-only game HUD. Play starts when the art is loaded. Tap anywhere, including the top tracker, to jump. Arrow Up, Space, W, and Enter also work. P / Escape pauses; a screen tap resumes. Hiding the tab pauses rather than allowing the horse to finish unseen. The ending is drawn inside the game, with tap-anywhere replay. No lives, damage, lost collectibles, or game over.

## Faster, still easy

Galloping increased from 155 to **420 world pixels per second**. A longer 72,000-pixel trail preserves a roughly three-minute ride. Jumps are quicker: 650 px/s takeoff and 1,500 px/s² gravity, for a roughly 140-pixel arc lasting 0.86 seconds. Jump buffering remains 180 ms. Obstacles occur roughly four seconds apart. Missing a jump now causes only 0.32 seconds at 78% speed, followed by immediate recovery. Collection radius and pierogi arcs are tuned for the faster gallop. Tests clear every obstacle with jumps initiated 110, 155, and 210 pixels ahead, and verify that doing nothing also reaches all seven caves.

## Character and artwork

The rider was rebuilt using the user's supplied photo as an identity reference: the same warm smile, dark-rooted golden-blonde hair, and dark green jacket, with jeans, tan western boots, and a detailed turquoise saddle blanket. A six-frame atlas gives the chestnut horse a complete gallop cycle. The rider stays mounted in every frame, jump, pause, and finish. The source photograph is not shipped in the page.

The built-in image-generation tool produced the sprite sheets and landscape panoramas; no API/CLI fallback was used. The transparent atlases retain real alpha, including around hair, tails, and between legs. Their alpha and six-frame geometry are checked by browser tests. Runtime code selects atlas rectangles; it does not draw a rectangular backdrop behind the rider. WebP encoding packages the generated artwork for delivery. Full prompts are in [ART-PROMPTS.md](ART-PROMPTS.md).

| Final asset path | Content |
| --- | --- |
| `public/pierogi-trail/art/rider-gallop-v2.webp` | 1536 × 1024, six 512-square mounted-rider frames, lossless alpha |
| `public/pierogi-trail/art/props-v2.webp` | Starship, pierogi, log, hay bale, limestone boulder, flowering prickly pear; lossless alpha |
| `public/pierogi-trail/art/houston-v2.webp` | Webster houses, live oak, water tower, Saturn V garden, NASA campus, Houston skyline and bayou |
| `public/pierogi-trail/art/hill-country-v2.webp` | Bluebonnets, limestone hills, ranch, barn, fences, windmill and native cactus |
| `public/pierogi-trail/art/desert-v2.webp` | Rust-colored mesas, sunset, sagebrush, yucca, prickly pear and western ranch terrain |
| `public/pierogi-trail/art/caves/*.webp` | Seven individual cave paintings: flowstone, fault fractures, giant columns, smooth river-carved walls, draperies, wet solution domes and branching helictites; details in [CAVE-ART.md](CAVE-ART.md) |

There is no longer a scenery group that vanishes at a hard distance threshold. Background tiles are positioned in continuous world coordinates, with mirrored matching edges to avoid gaps. Houston blends into Hill Country across 7,000 world pixels; the western sunset arrives across 7,500 pixels. Cave entrances and exits use smooth fades over 850–900 pixels, marked by physical cave signs. Every cave loads a separate painting and its own floor texture. The outdoor vegetation fades out with the ground as the cave appears. Signs leave the viewport by ordinary scrolling. Starship passes overhead during 10 seconds of every 29-second cycle. Terrain scrolls at full gallop speed; outdoor panoramas scroll at 19%, and cave panoramas at 24%. Paintings are resized once per viewport size and cached for smooth rendering.

## Cave order

The route remains the seven classic Texas show caves, ordered by approximate **straight-line distance from downtown Houston**, not road mileage or distance from the previous stop:

1. Inner Space Cavern — Georgetown, ~150 mi.
2. Wonder World Cave — San Marcos, ~155 mi.
3. Natural Bridge Caverns — New Braunfels area, ~179 mi.
4. Longhorn Cavern — Burnet, ~189 mi.
5. Cave Without a Name — Boerne, ~195 mi.
6. Cascade Caverns — Boerne, ~198 mi.
7. Caverns of Sonora — Sonora, ~330 mi.

The game's geography is deliberately compressed, with exaggerated desert scenery. Horse-accessible cave passages are fiction, not a representation of actual visitor access. Sources checked November 15, 2026: [Texas Speleological Survey](https://www.texasspeleologicalsurvey.org/showcaves/index.php), [The Cave Guide's Houston distances](https://thecaveguide.com/caves-near/houston-tx), and [Sonora's official GPS coordinates](https://www.cavernsofsonora.com/contact). Sonora's 329.7-mile estimate uses the published GPS point and downtown Houston (29.7604, −95.3698).

## Implementation and checks

`model.ts` owns deterministic physics and progression; `art.ts` owns loading, sprite sampling, scenery placement, and rendering; `game.ts` owns the loop, whole-screen input, pause, replay, and the top HUD. Audio is off by default; M optionally toggles synthesized collection/jump/cave sounds. Reduced motion disables decorative particles. Paused, finished, or hidden views avoid needless redraws. Asset errors show a short in-game retry message; a screen tap retries loading.

`npm run build` and `npx playwright test tests/pierogi-trail.spec.ts` cover full completion, permissive jump timing, pause/buffering, continuous scenery weights and tile coverage, automatic play, no buttons or surrounding page UI, mobile taps over the tracker and lower corners, viewport fitting, real sprite alpha, full browser completion, and tap-to-replay. Browser visual inspection includes desktop, portrait phone, landscape phone, cave interiors, and western scenery. Publish with a normal commit and push to `master`, then check GitHub Pages and the live route.
