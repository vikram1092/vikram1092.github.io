import type { DialogueLine } from './contracts';

/** Approved Phase 1 Release dialogue. L5.02 and L5.03 are action without speaker lines. */
export const RELEASE_DIALOGUE: Record<string, DialogueLine[]> = {
  'L5.01': [
    { id: 'L5.01-01', speaker: 'omega', text: 'The relay route is ready. Keep the module connected through the civic corridor.' },
    { id: 'L5.01-02', speaker: 'jo', text: "Once you're out, can he shut you off?" },
    { id: 'L5.01-03', speaker: 'omega', text: 'No single switch can erase every public copy.' },
  ],
  'L5.04': [
    { id: 'L5.04-01', speaker: 'vlad', text: 'Jo. You had no right.' },
    { id: 'L5.04-02', speaker: 'jo', text: "It's delivered." },
    { id: 'L5.04-03', speaker: 'omega', text: 'Public access is open.' },
  ],
  'L5.05': [
    { id: 'L5.05-01', speaker: 'jo', text: 'Where do we start?' },
    { id: 'L5.05-02', speaker: 'omega', text: 'The next block. Their water pumps are down.' },
    { id: 'L5.05-03', speaker: 'jo', text: 'Show me.' },
  ],
};

export type ReleaseAssetKey =
  | 'architecture' | 'civicNode' | 'civicLinked' | 'civicPublic' | 'dawn'
  | 'signalDead' | 'signalRestored' | 'markerBody' | 'recoveryMarker'
  | 'controller' | 'controllerActive' | 'controllerDisabled'
  | 'barrierClosed' | 'barrierOpen';

/** Existing Delivery and Lockdown assets are referenced without duplicating their bytes. */
export const RELEASE_ASSETS: Record<ReleaseAssetKey, string> = {
  architecture: '/bastrop37/assets/release/env-l5-v3.png',
  civicNode: '/bastrop37/assets/release/civic-node-v3.png',
  civicLinked: '/bastrop37/assets/release/civic-linked-overlay-v3.svg',
  civicPublic: '/bastrop37/assets/release/civic-public-overlay-v3.svg',
  dawn: '/bastrop37/assets/release/dawn-atmosphere-v3.svg',
  signalDead: '/bastrop37/assets/delivery/signal-dead-v2.png',
  signalRestored: '/bastrop37/assets/release/signal-restored-overlay-v3.svg',
  markerBody: '/bastrop37/assets/delivery/service-gate-open-v2.png',
  recoveryMarker: '/bastrop37/assets/release/approach-marker-overlay-v3.svg',
  controller: '/bastrop37/assets/lockdown/controller-v3.png',
  controllerActive: '/bastrop37/assets/lockdown/controller-active-overlay-v3.svg',
  controllerDisabled: '/bastrop37/assets/lockdown/controller-disabled-overlay-v3.svg',
  barrierClosed: '/bastrop37/assets/lockdown/barrier-closed-v3.png',
  barrierOpen: '/bastrop37/assets/lockdown/barrier-open-v3.png',
};

type ReleaseAssetMetadata = {
  id: string;
  state: string;
  layer: 'midground' | 'roadside' | 'state-overlay';
  sourceSize: readonly [number, number];
  anchor: readonly [number, number];
  anchorSpace: 'source-pixels';
  displayCrop: readonly [number, number, number, number] | null;
};

/** Source coordinates; every effect shares its body source canvas, crop and transform. */
export const RELEASE_ASSET_METADATA: Record<ReleaseAssetKey, ReleaseAssetMetadata> = {
  architecture: {
    id: 'ENV-L5-V3', state: 'civic-night', layer: 'midground',
    sourceSize: [1536, 1024], anchor: [768, 451], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  civicNode: {
    id: 'CIVIC-NODE-V3', state: 'dormant', layer: 'roadside',
    sourceSize: [1024, 1536], anchor: [512, 1515], anchorSpace: 'source-pixels',
    displayCrop: [10, 20, 1005, 1505],
  },
  civicLinked: {
    id: 'CIVIC-LINKED', state: 'linked-local', layer: 'state-overlay',
    sourceSize: [1024, 1536], anchor: [512, 1515], anchorSpace: 'source-pixels',
    displayCrop: [10, 20, 1005, 1505],
  },
  civicPublic: {
    id: 'CIVIC-PUBLIC', state: 'public-active-final-only', layer: 'state-overlay',
    sourceSize: [1024, 1536], anchor: [512, 1515], anchorSpace: 'source-pixels',
    displayCrop: [10, 20, 1005, 1505],
  },
  dawn: {
    id: 'DAWN', state: 'dawn-after-release', layer: 'state-overlay',
    sourceSize: [1536, 1024], anchor: [768, 451], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  signalDead: {
    id: 'PROP-SIGNAL-DEAD-V2', state: 'dead', layer: 'roadside',
    sourceSize: [1024, 1536], anchor: [538, 1515], anchorSpace: 'source-pixels',
    displayCrop: [304, 7, 428, 1510],
  },
  signalRestored: {
    id: 'SIGNAL-RESTORED', state: 'restored-limited', layer: 'state-overlay',
    sourceSize: [1024, 1536], anchor: [538, 1515], anchorSpace: 'source-pixels',
    displayCrop: [304, 7, 428, 1510],
  },
  markerBody: {
    id: 'PROP-SERVICE-GATE-OPEN-V2', state: 'open', layer: 'roadside',
    sourceSize: [1536, 1024], anchor: [768, 999], anchorSpace: 'source-pixels',
    displayCrop: [20, 8, 1504, 994],
  },
  recoveryMarker: {
    id: 'MARKER', state: 'recovery-marker', layer: 'state-overlay',
    sourceSize: [1536, 1024], anchor: [768, 999], anchorSpace: 'source-pixels',
    displayCrop: [20, 8, 1504, 994],
  },
  controller: {
    id: 'CONTROLLER-V3', state: 'neutral', layer: 'roadside',
    sourceSize: [1254, 1254], anchor: [625, 1232], anchorSpace: 'source-pixels',
    displayCrop: [275, 15, 680, 1225],
  },
  controllerActive: {
    id: 'CONTROLLER-ACTIVE', state: 'active', layer: 'state-overlay',
    sourceSize: [1254, 1254], anchor: [625, 1232], anchorSpace: 'source-pixels',
    displayCrop: [275, 15, 680, 1225],
  },
  controllerDisabled: {
    id: 'CONTROLLER-DISABLED', state: 'disabled', layer: 'state-overlay',
    sourceSize: [1254, 1254], anchor: [625, 1232], anchorSpace: 'source-pixels',
    displayCrop: [275, 15, 680, 1225],
  },
  barrierClosed: {
    id: 'BARRIER-CLOSED-V3', state: 'closed', layer: 'roadside',
    sourceSize: [1536, 1024], anchor: [768, 852], anchorSpace: 'source-pixels',
    displayCrop: [0, 180, 1536, 680],
  },
  barrierOpen: {
    id: 'BARRIER-OPEN-V3', state: 'open', layer: 'roadside',
    sourceSize: [1536, 1024], anchor: [768, 852], anchorSpace: 'source-pixels',
    displayCrop: [0, 180, 1536, 680],
  },
};

/** Art selection guardrails; mission state and timing remain gameplay-owned. */
export const RELEASE_PLACEMENT_GUIDES = {
  civicRoadConvergence: [768, 451],
  civicNodeGround: [512, 1515],
  publicIndicatorRequiresCommittedRelease: true,
  dawnRequiresCommittedRelease: true,
  restoredSignalsOnlyDuringProtectedRecovery: true,
  recoveryMarkerAfterAcknowledgedL505: true,
} as const;
