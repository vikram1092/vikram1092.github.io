# Vikram Ramkumar

A static Astro portfolio with an interactive jelly-letter lake over the original Yosemite photograph.

```sh
npm ci
npm run dev
npm run build
```

The `master` branch deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## The lake

Drag letters and release them over the water, or use **Drop a letter** with touch or a keyboard. Letters settle with spring buoyancy and soft collisions. **Reassemble** brings the name back; **Pause** freezes the scene. Clicking the water produces ripples.

`src/scripts/water-scene.ts` owns the bevelled 3D Manrope lettering, jelly deformation, interaction, and physics. `water-shader.ts` reflects the rendered photograph and typography with animated waves and landing ripples. This is a deliberately lightweight screen-space reflection, not a full fluid simulation. The existing `/images/background.jpg` remains the source image.

The animation loads separately from the page, uses capped pixel density and reduced-resolution transmission, and stops in hidden tabs. Reduced-motion settings, unavailable WebGL, and disabled JavaScript retain the real HTML heading and all navigation. Changing to reduced motion while the scene is running also restores the static layout.

## Browser checks

```sh
npx playwright install chromium
npm run build
npm test
```

Tests serve the production output and cover letter drops, reassembly, pause, touch controls, mobile sizing, reduced motion, unavailable WebGL, and disabled JavaScript. `CHROME_PATH` can select an existing local Chromium executable.

The glyph outlines are a subset of the existing Manrope font under its included SIL Open Font License. To regenerate after changing the name or weight:

```sh
python -m pip install fonttools brotli
python scripts/build-jelly-font.py
```
