import type { CaveId } from "./model";

/** Swap a cave's src, or replace its WebP, without changing the game engine.
 * focus: horizontal fraction to center at the cave stamp (0 = left, 1 = right).
 * terrainStart: vertical fraction where the image's clear foreground path starts.
 * Keep source artwork opaque, with a level path across its bottom ~18%.
 */
export type CaveArtwork = {
  src: string;
  focus: number;
  terrainStart: number;
  feature: string;
};
export const CAVE_ART = {
  "inner-space": {
    src: "/pierogi-trail/art/caves/inner-space.webp",
    focus: 0.5,
    terrainStart: 0.84,
    feature: "Flowing Stone of Time · ivory flowstone",
  },
  "wonder-world": {
    src: "/pierogi-trail/art/caves/wonder-world.webp",
    focus: 0.5,
    terrainStart: 0.84,
    feature: "Balcones fault · fractured limestone",
  },
  "natural-bridge": {
    src: "/pierogi-trail/art/caves/natural-bridge.webp",
    focus: 0.6,
    terrainStart: 0.84,
    feature: "Castle of the White Giants · towering columns",
  },
  longhorn: {
    src: "/pierogi-trail/art/caves/longhorn.webp",
    focus: 0.5,
    terrainStart: 0.84,
    feature: "Hall of Marble · river-sculpted dolomite",
  },
  "without-a-name": {
    src: "/pierogi-trail/art/caves/without-a-name.webp",
    focus: 0.5,
    terrainStart: 0.84,
    feature: "Queen's Throne Room · folded draperies",
  },
  cascade: {
    src: "/pierogi-trail/art/caves/cascade.webp",
    focus: 0.5,
    terrainStart: 0.84,
    feature: "Diamond Ceiling · dripping domes and cascade",
  },
  sonora: {
    src: "/pierogi-trail/art/caves/sonora.webp",
    focus: 0.5,
    terrainStart: 0.84,
    feature: "Crystal Palace · branching calcite helictites",
  },
} satisfies Record<CaveId, CaveArtwork>;
