import type { DialogueLine } from './contracts';
import { DELIVERY_DIALOGUE } from './delivery-content';

export const DELIVERY_SAVE_KEY = 'bastrop37-campaign-v1';
export type DeliveryCheckpoint = 'CP-L1-ACTION' | 'CP-L1-SERVICE' | 'CP-L1-COMPLETE';
export type DeliverySave = {
  version: 1;
  checkpoint: DeliveryCheckpoint;
  completedLevels: string[];
  flags: {
    betrayalKnown: false;
    relayA: false;
    relayB: false;
    busSafe: false;
    omegaReleased: false;
  };
  acknowledged: string[];
  log: DialogueLine[];
};

const opening = Array.from({ length: 5 }, (_, i) => `L1.01-0${i + 1}`);
const service = Array.from({ length: 5 }, (_, i) => `L1.03-0${i + 1}`);
const closure = Array.from({ length: 3 }, (_, i) => `L1.05-0${i + 1}`);
const ordered = [...opening, ...service, ...closure];
const speakers = new Set(['jo', 'vlad', 'omega']);

export function deliverySave(checkpoint: DeliveryCheckpoint, log: DialogueLine[]): DeliverySave {
  const count = checkpoint === 'CP-L1-ACTION' ? 5 : checkpoint === 'CP-L1-SERVICE' ? 10 : 13;
  return {
    version: 1,
    checkpoint,
    completedLevels: checkpoint === 'CP-L1-COMPLETE' ? ['L1'] : [],
    flags: { betrayalKnown: false, relayA: false, relayB: false, busSafe: false, omegaReleased: false },
    acknowledged: ordered.slice(0, count),
    log: log.slice(0, count).map(line => ({ id: line.id, speaker: line.speaker, text: line.text })),
  };
}

export function validDeliverySave(value: unknown): value is DeliverySave {
  if (!value || typeof value !== 'object') return false;
  const save = value as Record<string, unknown>;
  if (save.version !== 1 || !['CP-L1-ACTION', 'CP-L1-SERVICE', 'CP-L1-COMPLETE'].includes(String(save.checkpoint))) return false;
  const count = save.checkpoint === 'CP-L1-ACTION' ? 5 : save.checkpoint === 'CP-L1-SERVICE' ? 10 : 13;
  if (!Array.isArray(save.completedLevels) || JSON.stringify(save.completedLevels) !== JSON.stringify(count === 13 ? ['L1'] : [])) return false;
  if (!save.flags || typeof save.flags !== 'object') return false;
  const flags = save.flags as Record<string, unknown>;
  const flagKeys = ['betrayalKnown', 'relayA', 'relayB', 'busSafe', 'omegaReleased'];
  if (JSON.stringify(Object.keys(flags).sort()) !== JSON.stringify(flagKeys.sort()) || flagKeys.some(key => flags[key] !== false)) return false;
  if (JSON.stringify(save.acknowledged) !== JSON.stringify(ordered.slice(0, count))) return false;
  if (!Array.isArray(save.log) || save.log.length !== count) return false;
  return save.log.every((line: unknown, i: number) => {
    if (!line || typeof line !== 'object') return false;
    const item = line as Record<string, unknown>;
    const canonical = [...DELIVERY_DIALOGUE['L1.01'], ...DELIVERY_DIALOGUE['L1.03'], ...DELIVERY_DIALOGUE['L1.05']][i];
    return item.id === ordered[i] && item.id === canonical.id && speakers.has(String(item.speaker)) &&
      item.speaker === canonical.speaker && item.text === canonical.text;
  });
}

export type SaveRead = { kind: 'none' } | { kind: 'invalid' } | { kind: 'valid'; save: DeliverySave };

export function readDeliverySave(): SaveRead {
  try {
    const raw = localStorage.getItem(DELIVERY_SAVE_KEY);
    if (raw === null) return { kind: 'none' };
    const parsed: unknown = JSON.parse(raw);
    return validDeliverySave(parsed) ? { kind: 'valid', save: parsed } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

export function writeDeliverySave(save: DeliverySave): boolean {
  if (!validDeliverySave(save)) return false;
  try {
    localStorage.setItem(DELIVERY_SAVE_KEY, JSON.stringify(save));
    return localStorage.getItem(DELIVERY_SAVE_KEY) === JSON.stringify(save);
  } catch {
    return false;
  }
}

export function clearDeliverySave(): boolean {
  try {
    localStorage.removeItem(DELIVERY_SAVE_KEY);
    return localStorage.getItem(DELIVERY_SAVE_KEY) === null;
  } catch {
    return false;
  }
}
