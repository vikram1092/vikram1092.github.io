import type { DialogueLine } from './contracts';

/** Approved Phase 1 Delivery exchanges. Action beats L1.02 and L1.04 have no speaker lines. */
export const DELIVERY_DIALOGUE: Record<string, DialogueLine[]> = {
  'L1.01': [
    { id: 'L1.01-01', speaker: 'vlad', text: 'You have the module?' },
    { id: 'L1.01-02', speaker: 'jo', text: "It's on the bike. Where am I going?" },
    { id: 'L1.01-03', speaker: 'vlad', text: "Municipal intake. Take the service road. I'll get you through." },
    { id: 'L1.01-04', speaker: 'jo', text: 'And this gets the lights back on?' },
    { id: 'L1.01-05', speaker: 'vlad', text: "That's what it's for. Your payment is ready." },
  ],
  'L1.03': [
    { id: 'L1.03-01', speaker: 'omega', text: 'The crossing signal reports a blockage. The right service lane is clear.' },
    { id: 'L1.03-02', speaker: 'jo', text: "Who's talking?" },
    { id: 'L1.03-03', speaker: 'omega', text: "Omega. I'm inside the module you're carrying." },
    { id: 'L1.03-04', speaker: 'jo', text: 'Mayor? Your package talks.' },
    { id: 'L1.03-05', speaker: 'vlad', text: 'A diagnostic system. It can read the road equipment. Follow the service lane.' },
  ],
  'L1.05': [
    { id: 'L1.05-01', speaker: 'vlad', text: "You're nearly here. Take the inspection lane. I'll have you cleared through." },
    { id: 'L1.05-02', speaker: 'jo', text: "Then we're done?" },
    { id: 'L1.05-03', speaker: 'vlad', text: "Then we're done." },
  ],
};

export type DeliveryAssetKey = 'architecture' | 'signalDead' | 'serviceGateOpen' | 'crossingBlocked' | 'vladNeutral' | 'omegaSymbol';
export const DELIVERY_ASSETS: Record<DeliveryAssetKey, string> = {
  architecture: '/bastrop37/assets/delivery/delivery-architecture-v2.png',
  signalDead: '/bastrop37/assets/delivery/signal-dead-v2.png',
  serviceGateOpen: '/bastrop37/assets/delivery/service-gate-open-v2.png',
  crossingBlocked: '/bastrop37/assets/delivery/barrier-closed-v3.png',
  vladNeutral: '/bastrop37/assets/delivery/vlad-neutral-v1.png',
  omegaSymbol: '/bastrop37/assets/delivery/omega-symbol-v1.svg',
};

type DeliveryAssetMetadata = {
  id: string;
  state: string;
  layer: 'midground' | 'roadside' | 'hud';
  sourceSize: readonly [number, number];
  anchor: readonly [number, number];
  anchorSpace: 'source-pixels' | 'normalized-full-source';
  displayCrop: readonly [number, number, number, number] | null;
};

/** Measured Phase 2 source coordinates; runtime world size and collision remain gameplay-owned. */
export const DELIVERY_ASSET_METADATA: Record<DeliveryAssetKey, DeliveryAssetMetadata> = {
  architecture: {
    id: 'ENV-L1-ARCHITECTURE-V2', state: 'delivery-dark', layer: 'midground',
    sourceSize: [1536, 1024], anchor: [768, 440], anchorSpace: 'source-pixels', displayCrop: null,
  },
  signalDead: {
    id: 'PROP-SIGNAL-DEAD-V2', state: 'dead', layer: 'roadside',
    sourceSize: [1024, 1536], anchor: [538, 1515], anchorSpace: 'source-pixels',
    displayCrop: [304, 7, 428, 1510],
  },
  serviceGateOpen: {
    id: 'PROP-SERVICE-GATE-OPEN-V2', state: 'open', layer: 'roadside',
    sourceSize: [1536, 1024], anchor: [768, 999], anchorSpace: 'source-pixels',
    displayCrop: [20, 8, 1504, 994],
  },
  crossingBlocked: {
    id: 'BARRIER-CLOSED-V3', state: 'blocked-crossing', layer: 'roadside',
    sourceSize: [1536, 1024], anchor: [768, 852], anchorSpace: 'source-pixels',
    displayCrop: [0, 180, 1536, 680],
  },
  vladNeutral: {
    id: 'CHAR-VLAD', state: 'neutral', layer: 'hud',
    sourceSize: [1254, 1254], anchor: [0.5, 0.5], anchorSpace: 'normalized-full-source', displayCrop: null,
  },
  omegaSymbol: {
    id: 'CHAR-OMEGA', state: 'contained-idle', layer: 'hud',
    sourceSize: [128, 128], anchor: [0.5, 0.5], anchorSpace: 'normalized-full-source', displayCrop: null,
  },
};
