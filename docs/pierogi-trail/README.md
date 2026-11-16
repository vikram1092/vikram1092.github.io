# The Pierogi Trail — revision 3

Live route: `/pierogi-trail/`.

Revision 3 gives every cave its own original painting based on documented real-world formations, plus a matching stone floor. Pierogi are 56 pixels wide instead of 34, about 65% bigger. The seven asset paths and crop settings live in `src/scripts/pierogi-trail/cave-art.ts`, so swapping an image does not require engine changes. See [CAVE-ART.md](CAVE-ART.md) for the file list, replacement instructions, references and full generation prompts.

The page is now only the game. It fills the viewport without a website header, title, start card, footer, field-guide dialog, separate passport section, toolbar, or jump button. The seven cave stamps, current region, pierogi total, and a thin route-progress line sit across the top as a read-only game HUD. Play starts when the art is loaded. Tap the game, including the top tracker, to jump. Arrow Up, Space, W, and Enter also work. P / Escape pauses; a screen tap resumes. Hiding the tab pauses rather than allowing the horse to finish unseen. The ending is drawn inside the game, with tap-anywhere replay. No lives, damage, lost collectibles, or game over.

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

There is no longer a scenery group that vanishes at a hard distance threshold. Background tiles are positioned in continuous world coordinates, with mirrored matching edges to avoid gaps. Houston blends into Hill Country across 7,000 world pixels; the western sunset arrives across 7,500 pixels. Cave visits now last about 16 seconds instead of seven, with over 11 seconds at full opacity instead of three. They begin 4,400 pixels before each stamp and end 2,200 pixels after it; 900-pixel entrance and exit fades leave outdoor scenery between caves and let Sonora finish before the ending. Physical cave signs mark the earlier entrances. Timing and scroll speed are centralized in `CAVE_VIEW` in `art.ts`. Every cave loads a separate painting and its own floor texture. The outdoor vegetation fades out with the ground as the cave appears. Signs leave the viewport by ordinary scrolling. Starship passes overhead during 10 seconds of every 29-second cycle. Terrain scrolls at full gallop speed; outdoor panoramas scroll at 19%, and mirrored cave panoramas at 10% (down from 24%). Paintings are resized once per viewport size and cached for smooth rendering.

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

`model.ts` owns deterministic physics and progression; `art.ts` owns loading, sprite sampling, scenery placement, and rendering; `game.ts` owns the loop, game-surface input, pause, replay, and the top HUD. `audio.ts` plays the original 104 BPM, 32-bar (~74-second) retro tune through a native, hidden `<audio>` element and synthesizes short effects with Web Audio. Music and SFX are always enabled: there are no sound buttons, mute shortcut, or stored mute preferences. Playback is attempted automatically and retried synchronously from native `touchend`, `click`, pointer and keyboard gestures, so Safari can authorize it on the first tap. When available, `navigator.audioSession.type = "playback"` selects the music route instead of Web Audio's default ambient route. The real music element provides media playback on older Safari too; it is deliberately not routed back through a Web Audio graph. Pausing or hiding the page pauses music and suspends effects; resuming continues the tune, while replay restarts it. Completion plays a short resolving chime, then goes quiet. Collection chimes are limited to one per 850 ms with a shared 180 ms effect cooldown; jump and stumble sounds are soft and short, cave chimes take priority, and hoofbeats/landings stay silent. A Web Audio failure leaves the native soundtrack and ride playable. Reduced motion disables decorative particles. Paused, finished, or hidden views avoid needless redraws. Asset errors show a short in-game retry message; a screen tap retries loading.

The original score lives in `scripts/pierogi-trail-score.ts`. Regenerate `public/pierogi-trail/audio/trail-theme-v1.mp3` with `node scripts/render-pierogi-trail-music.mjs` (Playwright Chromium and local FFmpeg required). This renders the mellow pulse lead, triangle bass and offbeat plucks once, then encodes a 96 kbps mono MP3 with a -23 LUFS loudness target, about 886 KB. The shipped encoding measures -23.6 LUFS with a -5 dBFS true peak, giving mobile speakers more headroom than the earlier very quiet synth mix. No third-party music or runtime rendering dependency is involved.

Safari implementation references: [WebKit's direct user gesture requirement](https://webkit.org/blog/6784/) and [Audio Session playback versus ambient routing](https://www.w3.org/TR/audio-session/). Browser automation can validate native media playback and gesture handling, but cannot reproduce a physical iPhone's Ring/Silent switch.

`npm run build` and `npx playwright test tests/pierogi-trail.spec.ts tests/pierogi-trail-audio.spec.ts` cover full completion, permissive jump timing, pause/buffering, continuous scenery weights and tile coverage, automatic play, mobile taps and absence of controls, viewport fitting, real sprite alpha, full browser completion, and tap-to-replay. Audio checks verify actual encoded samples and native media progress, strict touchend-only unlocking, ignored legacy mute preferences, effect pacing, pause/resume, interruption recovery, hidden-tab silence, completion/replay, and native music continuing when Web Audio fails. Browser visual inspection includes desktop, portrait phone, landscape phone, cave interiors, and western scenery. Publish with a normal commit and push to `master`, then check GitHub Pages and the live route.
