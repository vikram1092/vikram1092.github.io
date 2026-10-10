/** Shared campaign boundary. Gameplay derives state; HUD renders it and sends intentions. */
export type ChapterId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type Speaker = 'jo' | 'vlad' | 'omega';
export type BeatMode = 'story' | 'action' | 'drain' | 'resolve';
export type DialogueLine = { id: string; speaker: Speaker; text: string };
export type EquipmentRecord = { id: string; title: string; source: string; lines: string[] };
export type TransmissionEntry = DialogueLine | EquipmentRecord;
export type AbilityView = { state: 'ready' | 'active' | 'cooldown' | 'unavailable'; binding: string; cooldown?: number };
export type HudView = {
  state: 'loading' | 'ready' | 'playing' | 'paused' | 'crashed' | 'complete' | 'error';
  readyToStart?: boolean;
  mode: BeatMode;
  chapterId?: ChapterId;
  omegaReleased?: boolean;
  campaignComplete?: boolean;
  replay?: { active: boolean; unlocked: ChapterId[] };
  chapterLabel?: string;
  completionTitle?: string;
  continueLabel?: string;
  completionSaveLabel?: string;
  retryLabel?: string;
  beatId: string;
  objective: string;
  routeCue: string;
  roadCombat?: { condition: number; knockouts: number };
  driveLabel?: string;
  speed: number;
  energy: number; // 0..1
  turbo: 'ready' | 'active' | 'charging' | 'unavailable';
  dialogue: DialogueLine | null;
  record?: EquipmentRecord | null;
  recordIndex?: number;
  recordCount?: number;
  records?: EquipmentRecord[];
  history?: TransmissionEntry[]; // Ordered acknowledged dialogue/receipts; fallback to log for M1.
  abilities?: { blades: AbilityView; jump: AbilityView };
  overdrive?: { value: number; ready: boolean; active: boolean }; // 0..100, separate from ordinary energy.
  missionMeter?: { label: string; value: number; detail: string }; // 0..1, gameplay-owned progress.
  connection?: { kind?: 'relay' | 'upload'; relay: 'A' | 'B'; state: 'in-range' | 'linking' | 'out-of-range' | 'linked'; progress: number }; // 0..1 for the current physical section; only omegaReleased signals public release.
  controller?: { state: 'active' | 'retracting' | 'open'; progress: number };
  escort?: { condition: 0 | 1 | 2 | 3; inRange: boolean; intercept: 'left' | 'right' | null; busSafe: boolean; busProgress: number; rampPassed: boolean; attackPhase: 'idle' | 'telegraph' | 'strike' | 'recover' | 'cleared' }; // Gameplay-derived; no HUD-owned progress or damage.
  dialogueIndex: number;
  dialogueCount: number;
  log: DialogueLine[];
  hasSave: boolean;
  saveStatus: 'none' | 'saved' | 'session' | 'invalid';
  message?: string;
};
export type HudActions = {
  start(): void;
  continue(): void;
  newGame(): void;
  replay(chapterId: ChapterId): void;
  advance(): void;
  pause(): void;
  resume(): void;
  retry(): void;
  menu(): void;
};
