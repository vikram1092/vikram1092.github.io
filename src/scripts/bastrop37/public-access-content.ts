import type { DialogueLine } from './contracts';

/** Approved Phase 1 Public Access exchanges. L3.02 and L3.03 are action without speaker lines. */
export const PUBLIC_ACCESS_DIALOGUE: Record<string, DialogueLine[]> = {
  'L3.01': [
    { id: 'L3.01-01', speaker: 'omega', text: 'Two relay points. Keep me close long enough to connect each one.' },
    { id: 'L3.01-02', speaker: 'jo', text: 'And that gets you out?' },
    { id: 'L3.01-03', speaker: 'omega', text: "It prepares the route. I'll stay in the module until we reach civic access." },
  ],
  'L3.04': [
    { id: 'L3.04-01', speaker: 'omega', text: "Both relay points are ready. I'm still inside the module." },
    { id: 'L3.04-02', speaker: 'vlad', text: "Close that connection, Jo. You're making this worse." },
    { id: 'L3.04-03', speaker: 'jo', text: 'Worse for who?' },
    { id: 'L3.04-04', speaker: 'omega', text: "The civic road crosses the reservoir. That's our way in." },
  ],
};

export type PublicAccessAssetKey = 'architecture' | 'relay' | 'relayConnecting' | 'relayLinked';
export const PUBLIC_ACCESS_ASSETS: Record<PublicAccessAssetKey, string> = {
  architecture: '/bastrop37/assets/public-access/env-l3-v3.png',
  relay: '/bastrop37/assets/public-access/relay-node-v3.png',
  relayConnecting: '/bastrop37/assets/public-access/relay-connecting-overlay-v3.svg',
  relayLinked: '/bastrop37/assets/public-access/relay-linked-overlay-v3.svg',
};

type PublicAccessAssetMetadata = {
  id: string;
  state: string;
  layer: 'midground' | 'roadside' | 'state-overlay';
  sourceSize: readonly [number, number];
  anchor: readonly [number, number];
  anchorSpace: 'source-pixels';
  displayCrop: readonly [number, number, number, number] | null;
};

/** Measured Phase 2 source coordinates; relay effects share the body's crop and transform. */
export const PUBLIC_ACCESS_ASSET_METADATA: Record<PublicAccessAssetKey, PublicAccessAssetMetadata> = {
  architecture: {
    id: 'ENV-L3-V3', state: 'market-service-streets', layer: 'midground',
    sourceSize: [1536, 1024], anchor: [768, 442], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  relay: {
    id: 'RELAY-NODE-V3', state: 'dormant', layer: 'roadside',
    sourceSize: [1024, 1536], anchor: [512, 1525], anchorSpace: 'source-pixels',
    displayCrop: [185, 0, 655, 1536],
  },
  relayConnecting: {
    id: 'RELAY-CONNECTING', state: 'connecting', layer: 'state-overlay',
    sourceSize: [1024, 1536], anchor: [512, 1525], anchorSpace: 'source-pixels',
    displayCrop: [185, 0, 655, 1536],
  },
  relayLinked: {
    id: 'RELAY-LINKED', state: 'linked', layer: 'state-overlay',
    sourceSize: [1024, 1536], anchor: [512, 1525], anchorSpace: 'source-pixels',
    displayCrop: [185, 0, 655, 1536],
  },
};
