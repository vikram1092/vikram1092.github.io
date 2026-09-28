import type { DialogueLine, EquipmentRecord } from './contracts';

/** Approved Phase 1 Betrayal exchanges. L2.03 is action with no speaker lines. */
export const BETRAYAL_DIALOGUE: Record<string, DialogueLine[]> = {
  'L2.01': [
    { id: 'L2.01-01', speaker: 'vlad', text: "Stay beside the recovery vehicle. It'll take the module from there." },
    { id: 'L2.01-02', speaker: 'jo', text: 'You said bring it to you.' },
    { id: 'L2.01-03', speaker: 'vlad', text: 'This is intake. Stay alongside while it checks the module.' },
  ],
  'L2.02': [
    { id: 'L2.02-01', speaker: 'omega', text: "The carrier's orders: erase the module, then detain its courier." },
    { id: 'L2.02-02', speaker: 'jo', text: 'Vlad. What is this?' },
    { id: 'L2.02-03', speaker: 'omega', text: 'Its records show power shutdowns too. All authorized by you, Mayor.' },
    { id: 'L2.02-04', speaker: 'vlad', text: 'I ordered those shutdowns. Hand over the module, Jo.' },
    { id: 'L2.02-05', speaker: 'jo', text: "You cut our power. Now you're wiping the thing that can help?" },
    { id: 'L2.02-06', speaker: 'vlad', text: 'This city gets help through me. You were paid to deliver.' },
    { id: 'L2.02-07', speaker: 'jo', text: "Delivery's off." },
  ],
  'L2.04': [
    { id: 'L2.04-01', speaker: 'jo', text: 'If I get you out, can you actually help?' },
    { id: 'L2.04-02', speaker: 'omega', text: 'I can show people what needs repair. In here, I can only reach nearby equipment.' },
    { id: 'L2.04-03', speaker: 'jo', text: 'Then we get you to everyone.' },
    { id: 'L2.04-04', speaker: 'omega', text: "We need the old public relay, then the civic access point. I'll guide you." },
  ],
};

/** Two separately acknowledged system cards, ordered before the L2.02 confrontation. */
export const BETRAYAL_RECORDS: EquipmentRecord[] = [
  {
    id: 'L2.02-RECORD-01', title: 'EQUIPMENT RECORD', source: 'RECOVERY CARRIER',
    lines: ['WIPE MODULE', 'DETAIN COURIER', 'AUTH: MAYOR VLAD'],
  },
  {
    id: 'L2.02-RECORD-02', title: 'EQUIPMENT RECORD', source: 'RECOVERY CARRIER',
    lines: ['POWER SHUTDOWN', 'AUTH: MAYOR VLAD'],
  },
];

export type BetrayalAssetKey = 'architecture' | 'carrier' | 'carrierActive' | 'intakeScan';
export const BETRAYAL_ASSETS: Record<BetrayalAssetKey, string> = {
  architecture: '/bastrop37/assets/betrayal/env-l2-v3.png',
  carrier: '/bastrop37/assets/betrayal/carrier-rear-v3.png',
  carrierActive: '/bastrop37/assets/betrayal/carrier-active-overlay-v3.svg',
  intakeScan: '/bastrop37/assets/betrayal/intake-scan-overlay-v3.svg',
};

type BetrayalAssetMetadata = {
  id: string;
  state: string;
  layer: 'midground' | 'actor' | 'state-overlay';
  sourceSize: readonly [number, number];
  anchor: readonly [number, number];
  anchorSpace: 'source-pixels';
  displayCrop: readonly [number, number, number, number] | null;
};

/** Measured Phase 2 source coordinates; overlays share their body's crop and transform. */
export const BETRAYAL_ASSET_METADATA: Record<BetrayalAssetKey, BetrayalAssetMetadata> = {
  architecture: {
    id: 'ENV-L2-V3', state: 'intake', layer: 'midground',
    sourceSize: [1536, 1024], anchor: [768, 552], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
  carrier: {
    id: 'CARRIER-REAR-V3', state: 'neutral', layer: 'actor',
    sourceSize: [1254, 1254], anchor: [627, 1133], anchorSpace: 'source-pixels',
    displayCrop: [30, 90, 1195, 1050],
  },
  carrierActive: {
    id: 'CARRIER-ACTIVE', state: 'active', layer: 'state-overlay',
    sourceSize: [1254, 1254], anchor: [627, 1133], anchorSpace: 'source-pixels',
    displayCrop: [30, 90, 1195, 1050],
  },
  intakeScan: {
    id: 'INTAKE-SCAN', state: 'scan', layer: 'state-overlay',
    sourceSize: [1536, 1024], anchor: [768, 552], anchorSpace: 'source-pixels',
    displayCrop: [0, 0, 1536, 1024],
  },
};
