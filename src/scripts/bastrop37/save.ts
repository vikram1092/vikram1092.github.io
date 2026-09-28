import type { DialogueLine, EquipmentRecord, TransmissionEntry } from './contracts';
import { DELIVERY_DIALOGUE } from './delivery-content';
import { BETRAYAL_DIALOGUE, BETRAYAL_RECORDS } from './betrayal-content';

export const DELIVERY_SAVE_KEY = 'bastrop37-campaign-v1';
export type DeliveryCheckpoint = 'CP-L1-ACTION' | 'CP-L1-SERVICE' | 'CP-L1-COMPLETE';
export type BetrayalCheckpoint = 'CP-L2-SCAN' | 'CP-L2-ESCAPE' | 'CP-L2-COMPLETE';
type Flags = { betrayalKnown: boolean; relayA: false; relayB: false; busSafe: false; omegaReleased: false };
type BaseSave = { version: 1; completedLevels: string[]; flags: Flags; acknowledged: string[]; log: DialogueLine[] };
export type DeliverySave = BaseSave & { checkpoint: DeliveryCheckpoint; flags: Flags & { betrayalKnown: false } };
export type BetrayalSave = BaseSave & { checkpoint: BetrayalCheckpoint; records: EquipmentRecord[]; history: TransmissionEntry[] };
export type CampaignSave = DeliverySave | BetrayalSave;

const l1 = [...DELIVERY_DIALOGUE['L1.01'], ...DELIVERY_DIALOGUE['L1.03'], ...DELIVERY_DIALOGUE['L1.05']];
const l2Opening = BETRAYAL_DIALOGUE['L2.01'];
const l2Confrontation = BETRAYAL_DIALOGUE['L2.02'];
const l2Closure = BETRAYAL_DIALOGUE['L2.04'];
const l2 = [...l2Opening, ...l2Confrontation, ...l2Closure];
const flagKeys = ['betrayalKnown', 'busSafe', 'omegaReleased', 'relayA', 'relayB'];
const cloneLine = (line: DialogueLine): DialogueLine => ({ id: line.id, speaker: line.speaker, text: line.text });
const cloneRecord = (record: EquipmentRecord): EquipmentRecord => ({ id: record.id, title: record.title, source: record.source, lines: [...record.lines] });
function expectedHistory(checkpoint: BetrayalCheckpoint): TransmissionEntry[] {
  const start: TransmissionEntry[] = [...l1, ...l2Opening];
  if (checkpoint === 'CP-L2-SCAN') return start;
  start.push(...BETRAYAL_RECORDS, ...l2Confrontation);
  if (checkpoint === 'CP-L2-COMPLETE') start.push(...l2Closure);
  return start;
}
function sameCanonical(actual: unknown, expected: unknown): boolean { return JSON.stringify(actual) === JSON.stringify(expected); }

export function deliverySave(checkpoint: DeliveryCheckpoint, log: DialogueLine[]): DeliverySave {
  const count = checkpoint === 'CP-L1-ACTION' ? 5 : checkpoint === 'CP-L1-SERVICE' ? 10 : 13;
  return {
    version: 1, checkpoint, completedLevels: count === 13 ? ['L1'] : [],
    flags: { betrayalKnown: false, relayA: false, relayB: false, busSafe: false, omegaReleased: false },
    acknowledged: l1.slice(0, count).map(line => line.id), log: log.slice(0, count).map(cloneLine),
  };
}

export function betrayalSave(checkpoint: BetrayalCheckpoint, log: DialogueLine[], records: EquipmentRecord[], history: TransmissionEntry[]): BetrayalSave {
  const count = checkpoint === 'CP-L2-SCAN' ? 3 : checkpoint === 'CP-L2-ESCAPE' ? 10 : 14;
  return {
    version: 1, checkpoint, completedLevels: checkpoint === 'CP-L2-COMPLETE' ? ['L1', 'L2'] : ['L1'],
    flags: { betrayalKnown: checkpoint !== 'CP-L2-SCAN', relayA: false, relayB: false, busSafe: false, omegaReleased: false },
    acknowledged: [...l1, ...l2.slice(0, count)].map(line => line.id),
    log: log.map(cloneLine), records: records.map(cloneRecord),
    history: history.map(entry => 'speaker' in entry ? cloneLine(entry) : cloneRecord(entry)),
  };
}

export function validDeliverySave(value: unknown): value is DeliverySave {
  if (!value || typeof value !== 'object') return false;
  const save = value as Record<string, unknown>;
  if (save.version !== 1 || !['CP-L1-ACTION', 'CP-L1-SERVICE', 'CP-L1-COMPLETE'].includes(String(save.checkpoint))) return false;
  const count = save.checkpoint === 'CP-L1-ACTION' ? 5 : save.checkpoint === 'CP-L1-SERVICE' ? 10 : 13;
  if (!sameCanonical(save.completedLevels, count === 13 ? ['L1'] : [])) return false;
  if (!validFlags(save.flags, false)) return false;
  return sameCanonical(save.acknowledged, l1.slice(0, count).map(line => line.id)) && sameCanonical(save.log, l1.slice(0, count));
}

function validFlags(value: unknown, betrayalKnown: boolean): boolean {
  if (!value || typeof value !== 'object') return false;
  const flags = value as Record<string, unknown>;
  return sameCanonical(Object.keys(flags).sort(), flagKeys) && flags.betrayalKnown === betrayalKnown &&
    flags.relayA === false && flags.relayB === false && flags.busSafe === false && flags.omegaReleased === false;
}

export function validBetrayalSave(value: unknown): value is BetrayalSave {
  if (!value || typeof value !== 'object') return false;
  const save = value as Record<string, unknown>;
  if (save.version !== 1 || !['CP-L2-SCAN', 'CP-L2-ESCAPE', 'CP-L2-COMPLETE'].includes(String(save.checkpoint))) return false;
  const checkpoint = save.checkpoint as BetrayalCheckpoint;
  const count = checkpoint === 'CP-L2-SCAN' ? 3 : checkpoint === 'CP-L2-ESCAPE' ? 10 : 14;
  if (!sameCanonical(save.completedLevels, checkpoint === 'CP-L2-COMPLETE' ? ['L1', 'L2'] : ['L1'])) return false;
  if (!validFlags(save.flags, checkpoint !== 'CP-L2-SCAN')) return false;
  const lines = [...l1, ...l2.slice(0, count)];
  const expectedRecords = checkpoint === 'CP-L2-SCAN' ? [] : BETRAYAL_RECORDS;
  return sameCanonical(save.acknowledged, lines.map(line => line.id)) && sameCanonical(save.log, lines) &&
    sameCanonical(save.records, expectedRecords) && sameCanonical(save.history, expectedHistory(checkpoint));
}

export type SaveRead = { kind: 'none' } | { kind: 'invalid' } | { kind: 'valid'; save: CampaignSave };
export function readDeliverySave(): SaveRead {
  try {
    const raw = localStorage.getItem(DELIVERY_SAVE_KEY);
    if (raw === null) return { kind: 'none' };
    const parsed: unknown = JSON.parse(raw);
    return validDeliverySave(parsed) || validBetrayalSave(parsed) ? { kind: 'valid', save: parsed } : { kind: 'invalid' };
  } catch { return { kind: 'invalid' }; }
}

export function writeDeliverySave(save: CampaignSave): boolean {
  if (!validDeliverySave(save) && !validBetrayalSave(save)) return false;
  try {
    const serialized = JSON.stringify(save);
    localStorage.setItem(DELIVERY_SAVE_KEY, serialized);
    return localStorage.getItem(DELIVERY_SAVE_KEY) === serialized;
  } catch { return false; }
}

export function clearDeliverySave(): boolean {
  try { localStorage.removeItem(DELIVERY_SAVE_KEY); return localStorage.getItem(DELIVERY_SAVE_KEY) === null; }
  catch { return false; }
}
