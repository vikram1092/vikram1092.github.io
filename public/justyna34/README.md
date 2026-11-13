# Justyna's 34th birthday

Standalone route: `/justyna34/`. The page is intentionally unlinked from the portfolio and marked `noindex, nofollow` (this does not make it private).

## Adding the birthday content

Edit `src/data/justyna34.ts`. Each memory has a stable ID, a local photo path, descriptive alt text, an optional crop position, a question, and answer options. Add `correctOption` with the correct option ID for a factual quiz question; omit it for questions with no wrong answer. Update `birthdayRevision` when replacing the preview content so stored demo answers are discarded. Put photos in this directory's `photos/` folder. The enlarged view always shows the uncropped image.

The current five scenic photographs and question/answer labels are placeholders, not personal memories. The preview accepts every answer. All imagery and fonts are served locally; there is no remote service, tracking, or form submission. Progress is saved only in the visitor's browser, with an in-memory fallback when storage is unavailable.

## Verified palette and font

The foundation uses [Radix Colors](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), verified against the [official light color scales](https://github.com/radix-ui/colors/blob/main/src/light.ts): Gold 2 `#faf9f2` (cream), Gold 3 `#f2f0e7` (shade), Bronze 6 `#dfcdc5` (hover fill), and Bronze 11 `#7d5e54` (text, focus, and selected answer fill). Complementary champagne, dusty rose, and sage decorate the frames, balloons, and background washes. Answer buttons use deep brown `#43302b` on rose `#e7d9d3`, then cream on bronze when selected. Automated checks measure actual rendered text contrast against the page, unselected answers, and selected answers, requiring WCAG AA's 4.5:1 ratio.

Cormorant Garamond is self-hosted from Google Fonts under the SIL Open Font License in `fonts/OFL.txt`. The sans-serif is the site's existing self-hosted Manrope.

## Temporary photos

Downloaded from Unsplash under the [Unsplash license](https://unsplash.com/license). Source identifiers are retained here so the placeholders can be traced and removed when personal photos arrive:

| File | Unsplash image ID |
| --- | --- |
| `coast.jpg` | `photo-1476514525535-07fb3b4ae5f1` |
| `flowers.jpg` | `photo-1490750967868-88aa4486c946` |
| `sea.jpg` | `photo-1518837695005-2083093ee35b` |
| `mountains.jpg` | `photo-1464822759023-fed622ff2c3b` |
| `sunset.jpg` | `photo-1500534623283-312aade485b7` |

## Presentation and motion

Keep the composition minimal: lowercase title with an optically centered large `34`, a balloon bouquet on each side, rounded champagne photo frames, then the question and filled answer choices. No tape, counters, carousel arrows, thumbnails, or hearts. Swipe, mouse drag, tap a neighboring photograph, or use the left/right keyboard keys to navigate. Tap the current photograph to enlarge it in a matching frame. Title alignment uses the loaded font's visible glyph bounds rather than its line box.

Broad champagne, rose, and sage background washes slowly drift and crossfade. Subtle photograph drift/zoom gives the page a quiet resting state. Pointer movement adds bounded tilt and reflected light; pressing a photograph adds a soft light wash. The enlarged photo opens from and returns to the tapped photo's position. Answer selection uses a gentle ripple and check; a newly accepted answer advances to the next unanswered memory after 1.35 seconds. Manual navigation, opening a photo, or hiding the tab cancels that scheduled advance. Completion stays on the last answer without adding a results panel. Answers remain editable and saved in the visitor's browser.

The optional, dynamically loaded Three.js header renders six satin balloons with soft studio reflections, small knots, and flexible strings. Gentle spring motion responds to nearby pointer movement or touch. Rendering is capped at 30 fps and 1.5 device-pixel ratio, and pauses when the header is offscreen or the tab is hidden. Resize, context loss/recovery, and page teardown are handled. Matching inline SVG balloons remain available while loading or if WebGL is unavailable.

Reduced motion disables ambient animations, tilt, ripples, and animated transitions. Visitors who start with reduced motion get static SVG balloons without loading Three.js; live preference changes stop or resume the scene. Background/photo motion pauses when the photos are offscreen or the tab is hidden.

## Verification

`npm run build` and `npx playwright test tests/justyna34.spec.ts` cover production output, touch and mouse swipes, circular navigation, anchored photo enlargement and keyboard dismissal, quiz persistence and completion, automatic advance and its cancellation, factual-answer retries, unavailable storage, pointer motion, live reduced-motion changes, responsive frames and balloons, offscreen rendering pause, WebGL fallback, touch targets, image availability, and palette contrast. Publish with the repository's normal `master` push and GitHub Pages workflow.
