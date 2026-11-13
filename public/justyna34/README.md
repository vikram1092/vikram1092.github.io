# Justyna's 34th birthday

Standalone route: `/justyna34/`. The page is intentionally unlinked from the portfolio and marked `noindex, nofollow` (this does not make it private).

## Adding the birthday content

Edit `src/data/justyna34.ts`. Each memory has a stable ID, a local photo path, descriptive alt text, an optional crop position, a question, and answer options. Add `correctOption` with the correct option ID for a factual quiz question; omit it for questions with no wrong answer. Update `birthdayRevision` when replacing the preview content so stored demo answers are discarded. Put photos in this directory's `photos/` folder. The enlarged view always shows the uncropped image.

The current five scenic photographs and question/answer labels are placeholders, not personal memories. The preview accepts every answer. All imagery and fonts are served locally; there is no remote service, tracking, or form submission. Progress is saved only in the visitor's browser, with an in-memory fallback when storage is unavailable.

## Verified palette and font

The palette uses [Radix Colors](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), verified against the [official light color scales](https://github.com/radix-ui/colors/blob/main/src/light.ts): Gold 2 `#faf9f2` (cream), Gold 3 `#f2f0e7` (shade), Gold 4 `#eae6db` (ambient light), Bronze 3 `#f6edea` (selected), Bronze 4 `#efe4df` (pressed and ambient light), Bronze 6 `#dfcdc5` (decorative borders), and Bronze 11 `#7d5e54` (text and focus). Automated checks measure actual rendered text contrast against both normal and selected backgrounds, requiring WCAG AA's 4.5:1 ratio.

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

Keep the composition minimal: lowercase title with a large `34`, rounded edge-to-edge photographs, then the question and rounded answer choices. No frames, tape, counters, carousel arrows, thumbnails, or hearts. Swipe, mouse drag, tap a neighboring photograph, or use the left/right keyboard keys to navigate. Tap the current photograph to enlarge it.

Slow background light and subtle photograph drift/zoom give the page a quiet resting state. Pointer movement adds bounded tilt and reflected light; pressing a photograph adds a soft light wash. The enlarged photo opens from and returns to the tapped photo's position. Answer selection uses a gentle ripple and check; a newly accepted answer advances to the next unanswered memory after 1.35 seconds. Manual navigation, opening a photo, or hiding the tab cancels that scheduled advance. Completion stays on the last answer without adding a results panel. Answers remain editable and saved in the visitor's browser.

Reduced motion disables ambient animations, tilt, ripples, and animated transitions. Ambient motion pauses when the photos are offscreen or the tab is hidden. There is no continuously running JavaScript rendering loop.

## Verification

`npm run build` and `npx playwright test tests/justyna34.spec.ts` cover production output, touch and mouse swipes, circular navigation, anchored photo enlargement and keyboard dismissal, quiz persistence and completion, automatic advance and its cancellation, factual-answer retries, unavailable storage, pointer motion, live reduced-motion changes, rounded mobile layouts, touch targets, image availability, and palette contrast. Publish with the repository's normal `master` push and GitHub Pages workflow.
