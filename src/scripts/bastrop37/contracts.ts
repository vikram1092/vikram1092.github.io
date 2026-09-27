/** Shared M1 boundary. Gameplay derives state; HUD renders it and sends intentions. */
export type Speaker = 'jo' | 'vlad' | 'omega';
export type BeatMode = 'story' | 'action' | 'drain' | 'resolve';
export type DialogueLine = { id: string; speaker: Speaker; text: string };
export type HudView = {
  state: 'ready' | 'playing' | 'paused' | 'crashed' | 'complete' | 'error';
  mode: BeatMode;
  beatId: string;
  objective: string;
  routeCue: string;
  speed: number;
  energy: number; // 0..1
  turbo: 'ready' | 'active' | 'charging' | 'unavailable';
  dialogue: DialogueLine | null;
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
  advance(): void;
  pause(): void;
  resume(): void;
  retry(): void;
  menu(): void;
};
