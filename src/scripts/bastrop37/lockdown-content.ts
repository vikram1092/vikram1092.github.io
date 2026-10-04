import type { DialogueLine, EquipmentRecord } from './contracts';

/** Approved Phase 1 Lockdown exchanges. L4.02 and L4.03 are action without speaker lines. */
export const LOCKDOWN_DIALOGUE: Record<string, DialogueLine[]> = {
  'L4.01': [
    { id: 'L4.01-01', speaker: 'vlad', text: 'The reservoir district is closed. Turn back.' },
    { id: 'L4.01-02', speaker: 'omega', text: 'The spillway shows an order from Vlad. Water is being sent toward the lower road.' },
    { id: 'L4.01-03', speaker: 'jo', text: "That bus is trapped behind the barrier. I'm opening it." },
  ],
  'L4.04': [
    { id: 'L4.04-01', speaker: 'omega', text: 'The bus is clear. The civic ramp is open.' },
    { id: 'L4.04-02', speaker: 'jo', text: "He'd flood a street to stop one bike." },
    { id: 'L4.04-03', speaker: 'omega', text: "To keep control of what's on it." },
    { id: 'L4.04-04', speaker: 'jo', text: "Then let's finish the delivery. To everyone." },
  ],
};

/** Acknowledged after L4.01-01 and before L4.01-02; the record has no speaker. */
export const LOCKDOWN_RECORDS: EquipmentRecord[] = [
  {
    id: 'L4.01-RECORD-01', title: 'LOWER ROAD DISCHARGE', source: 'SPILLWAY',
    lines: ['LOWER ROAD DISCHARGE', 'AUTH: MAYOR VLAD'],
  },
];

export type LockdownAssetKey =
  | 'architecture' | 'spillwayClosed' | 'spillwayOpen' | 'waterLow' | 'waterHigh'
  | 'barrierClosed' | 'barrierOpen' | 'controller' | 'controllerActive'
  | 'controllerDisabled' | 'bus';

export const LOCKDOWN_ASSETS: Record<LockdownAssetKey, string> = {
  architecture: '/bastrop37/assets/lockdown/env-l4-v3.png',
  spillwayClosed: '/bastrop37/assets/lockdown/spillway-closed-v3.png',
  spillwayOpen: '/bastrop37/assets/lockdown/spillway-open-v3.png',
  waterLow: '/bastrop37/assets/lockdown/spillway-water-low-v3.svg',
  waterHigh: '/bastrop37/assets/lockdown/spillway-water-high-v3.svg',
  barrierClosed: '/bastrop37/assets/lockdown/barrier-closed-v3.png',
  barrierOpen: '/bastrop37/assets/lockdown/barrier-open-v3.png',
  controller: '/bastrop37/assets/lockdown/controller-v3.png',
  controllerActive: '/bastrop37/assets/lockdown/controller-active-overlay-v3.svg',
  controllerDisabled: '/bastrop37/assets/lockdown/controller-disabled-overlay-v3.svg',
  bus: '/bastrop37/assets/lockdown/evac-bus-rear-v1.png',
};

type LockdownAssetMetadata = {
  id: string;
  state: string;
  layer: 'midground' | 'roadside' | 'state-overlay' | 'actor';
  sourceSize: readonly [number, number];
  anchor: readonly [number, number];
  anchorSpace: 'source-pixels';
  displayCrop: readonly [number, number, number, number] | null;
};

/** Measured source geometry. Effects share their body's full canvas, crop and transform. */
export const LOCKDOWN_ASSET_METADATA: Record<LockdownAssetKey, LockdownAssetMetadata> = {
  architecture: {
    id: 'ENV-L4-V3', state: 'reservoir-lower-road-civic-approach', layer: 'midground',
    sourceSize: [1536, 1024], anchor: [819, 558], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  spillwayClosed: {
    id: 'SPILLWAY-CLOSED-V3', state: 'closed', layer: 'roadside',
    sourceSize: [1536, 1024], anchor: [768, 998], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  spillwayOpen: {
    id: 'SPILLWAY-OPEN-V3', state: 'open', layer: 'roadside',
    sourceSize: [1536, 1024], anchor: [768, 998], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  waterLow: {
    id: 'WATER-LOW', state: 'low', layer: 'state-overlay',
    sourceSize: [1536, 1024], anchor: [768, 998], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  waterHigh: {
    id: 'WATER-HIGH', state: 'high', layer: 'state-overlay',
    sourceSize: [1536, 1024], anchor: [768, 998], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
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
  bus: {
    id: 'VEH-EVAC', state: 'neutral', layer: 'actor',
    sourceSize: [1254, 1254], anchor: [625, 1160], anchorSpace: 'source-pixels',
    displayCrop: [165, 90, 920, 1070],
  },
};

/** The final L4 environment already includes the spillway frame; fit only its inner gate to the bay. */
export const LOCKDOWN_PLACEMENT_GUIDES = {
  spillwayInnerGateCrop: [402, 360, 728, 540],
  environmentGateBay: [[420, 347], [551, 514]],
  environmentApronNearEdge: [[1140, 652], [1536, 868]],
  environmentPortalFloor: [[1230, 610], [1403, 648]],
} as const;
