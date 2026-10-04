import { DELIVERY_ASSETS } from './delivery-content';
import type { TransmissionEntry, HudActions, HudView, Speaker } from './contracts';

const speakerName: Record<Speaker, string> = {
  jo: 'JO',
  vlad: 'MAYOR VLAD',
  omega: 'OMEGA',
};

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Delivery HUD missing ${selector}`);
  return element;
}

function setText(element: HTMLElement, value: string): void {
  if (element.textContent !== value) element.textContent = value;
}

function show(element: HTMLElement, visible: boolean): void {
  if (element.hidden === visible) element.hidden = !visible;
}

function saveLabel(view: HudView): string {
  switch (view.saveStatus) {
    case 'saved': return view.state === 'complete' ? (view.completionSaveLabel || 'SAVED / DELIVERY APPROACH') : 'SAVED CHECKPOINT';
    case 'session': return 'SESSION ONLY — PROGRESS COULD NOT BE SAVED';
    case 'invalid': return 'SAVED RIDE UNAVAILABLE — START A NEW DELIVERY';
    default: return '';
  }
}

/** Renders only gameplay-derived state. No mission, dialogue, or save progression lives here. */
export function createHud(actions: HudActions): { render(view: HudView): void } {
  const root = requireElement<HTMLElement>('#bastrop-game');
  const overlay = requireElement<HTMLElement>('#overlay');
  const objective = requireElement<HTMLElement>('#objective');
  const routeCue = requireElement<HTMLElement>('#route-cue');
  const speed = requireElement<HTMLElement>('#speed');
  const driveState = requireElement<HTMLElement>('#drive-state');
  const energyValue = requireElement<HTMLElement>('#charge-value');
  const energySegments = requireElement<HTMLElement>('#energy-segments');
  const segments = [...energySegments.querySelectorAll<HTMLElement>('i')];
  const turboState = requireElement<HTMLElement>('#turbo-state');
  const comms = requireElement<HTMLElement>('#comms');
  const commsIdentity = requireElement<HTMLElement>('#comms-identity');
  const portrait = requireElement<HTMLImageElement>('#portrait');
  const identityCode = requireElement<HTMLElement>('#identity-code');
  const channel = requireElement<HTMLElement>('#channel');
  const speaker = requireElement<HTMLElement>('#speaker');
  const dialogueCount = requireElement<HTMLElement>('#dialogue-count');
  const dialogueText = requireElement<HTMLElement>('#dialogue-text');
  const overline = requireElement<HTMLElement>('#overline');
  const headline = requireElement<HTMLElement>('#headline');
  const message = requireElement<HTMLElement>('#message');
  const saveNote = requireElement<HTMLElement>('#save-note');
  const start = requireElement<HTMLButtonElement>('#start');
  const pause = requireElement<HTMLButtonElement>('#pause');
  const continueSave = requireElement<HTMLButtonElement>('#continue-save');
  const resume = requireElement<HTMLButtonElement>('#resume');
  const retry = requireElement<HTMLButtonElement>('#retry');
  const newGame = requireElement<HTMLButtonElement>('#new-game');
  const menu = requireElement<HTMLButtonElement>('#menu');
  const continueChapter = requireElement<HTMLButtonElement>('#continue-chapter');
  const resetConfirm = requireElement<HTMLElement>('#reset-confirm');
  const confirmNewGame = requireElement<HTMLButtonElement>('#confirm-new-game');
  const cancelNewGame = requireElement<HTMLButtonElement>('#cancel-new-game');
  const logDetails = requireElement<HTMLDetailsElement>('#log-details');
  const logCount = requireElement<HTMLElement>('#log-count');
  const logList = requireElement<HTMLOListElement>('#dialogue-log');
  const feedback = requireElement<HTMLElement>('#feedback');
  const advance = requireElement<HTMLButtonElement>('#advance');

  const chapterNumber = requireElement<HTMLElement>('.chapter-number');
  const chapterBrand = requireElement<HTMLElement>('.brand small');
  const chapterMicro = requireElement<HTMLElement>('.mission .micro');
  const combat = requireElement<HTMLElement>('#combat-status');
  const blades = requireElement<HTMLElement>('#blades-state');
  const jump = requireElement<HTMLElement>('#jump-state');
  const overdrive = requireElement<HTMLElement>('#overdrive-state');
  const overdriveMeter = requireElement<HTMLMeterElement>('#overdrive-meter');
  const lock = requireElement<HTMLElement>('#mission-meter');
  const lockLabel = requireElement<HTMLElement>('#mission-meter-label');
  const lockDetail = requireElement<HTMLElement>('#mission-meter-detail');
  const lockMeter = requireElement<HTMLMeterElement>('#mission-meter-value');
  const connectionStatus = requireElement<HTMLElement>('#connection-status');

  let confirmingReset = false;
  let lastLogKey = '';
  let previousState: HudView['state'] | null = null;

  start.addEventListener('click', () => actions.start());
  pause.addEventListener('click', () => actions.pause());
  continueSave.addEventListener('click', () => actions.continue());
  resume.addEventListener('click', () => actions.resume());
  retry.addEventListener('click', () => actions.retry());
  menu.addEventListener('click', () => actions.menu());
  continueChapter.addEventListener('click', () => actions.continue());
  advance.addEventListener('click', () => actions.advance());
  newGame.addEventListener('click', () => {
    confirmingReset = true;
    show(resetConfirm, true);
    confirmNewGame.focus();
  });
  confirmNewGame.addEventListener('click', () => {
    confirmingReset = false;
    show(resetConfirm, false);
    actions.newGame();
  });
  cancelNewGame.addEventListener('click', () => {
    confirmingReset = false;
    show(resetConfirm, false);
    newGame.focus();
  });

  function renderLog(entries: TransmissionEntry[]): void {
    const key = JSON.stringify(entries);
    if (key === lastLogKey) return;
    lastLogKey = key;
    logList.replaceChildren();
    for (const entry of entries) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      const isRecord = 'lines' in entry;
      name.textContent = isRecord ? `${entry.title} / ${entry.source}: ` : `${speakerName[entry.speaker]} / `;
      item.append(name, document.createTextNode(isRecord ? entry.lines.join(' · ') : entry.text));
      if (isRecord) item.dataset.kind = 'record';
      logList.append(item);
    }
    setText(logCount, String(entries.length));
  }

  return {
    render(view: HudView): void {
      root.dataset.state = view.state;
      root.dataset.mode = view.mode;
      const chapterLabel = view.chapterLabel || 'DELIVERY';
      const chapterNo = view.chapterId === 'L3' ? '03' : view.chapterId === 'L2' ? '02' : '01';
      setText(chapterNumber, chapterNo);
      setText(chapterBrand, `${chapterNo} / ${chapterLabel}`);
      setText(chapterMicro, `${chapterLabel} / BASTROP`);
      setText(continueChapter, view.continueLabel || 'CONTINUE TO INTAKE');
      setText(retry, view.retryLabel || (view.chapterId === 'L1' ? 'RETRY DELIVERY' : 'RETRY CHECKPOINT'));
      setText(objective, view.objective);
      setText(routeCue, view.routeCue);
      setText(speed, String(Math.max(0, Math.round(view.speed))).padStart(3, '0'));
      setText(driveState, view.mode === 'action' ? 'MANUAL / DRIVE' : view.mode === 'drain' ? 'TRAFFIC CLEARING' : 'SAFE CRUISE');

      const energy = Math.min(100, Math.max(0, Math.round(view.energy * 100)));
      setText(energyValue, String(energy));
      energySegments.setAttribute('aria-valuenow', String(energy));
      const lit = Math.ceil(energy / 10);
      segments.forEach((segment, index) => segment.classList.toggle('empty', index >= lit));
      const turbo = view.mode === 'action' ? view.turbo : 'unavailable';
      setText(turboState, `↗ TURBO / ${turbo.toUpperCase()}`);

      const action = view.state === 'playing' && view.mode === 'action';
      show(combat, action && (view.chapterId === 'L2' || view.chapterId === 'L3') && !!view.abilities);
      if (view.abilities) {
        for (const [element, label, ability] of [[blades, 'BLADES', view.abilities.blades], [jump, 'JUMP', view.abilities.jump]] as const) {
          setText(element, `${label} · ${ability.binding} / ${ability.state.toUpperCase()}${ability.state === 'cooldown' && ability.cooldown ? ` ${ability.cooldown.toFixed(1)}s` : ''}`);
          element.dataset.state = ability.state;
          element.title = ability.binding;
        }
      }
      const od = view.overdrive;
      show(overdrive, !!od);
      show(overdriveMeter, !!od);
      if (od) {
        const charge = Math.max(0, Math.min(100, Math.round(od.value)));
        setText(overdrive, od.active ? 'OVERDRIVE / ACTIVE' : od.ready ? 'OVERDRIVE / READY · NEXT TURBO' : `OVERDRIVE / ${charge}%`);
        overdriveMeter.value = charge;
        combat.dataset.overdrive = od.active ? 'active' : od.ready ? 'ready' : 'charging';
      }
      show(lock, action && !!view.missionMeter);
      if (view.missionMeter) {
        setText(lockLabel, view.missionMeter.label);
        setText(lockDetail, view.missionMeter.detail);
        lockMeter.value = Math.max(0, Math.min(1, view.missionMeter.value));
        lockMeter.setAttribute('aria-label', view.missionMeter.label);
      }
      const connection = action && view.chapterId === 'L3' ? view.connection : undefined;
      show(connectionStatus, !!connection);
      if (connection) lock.dataset.connection = connection.state;
      else delete lock.dataset.connection;
      if (connection) {
        const stateLabel = {
          'in-range': 'IN RANGE',
          linking: 'LINKING',
          'out-of-range': 'OUT OF RANGE',
          linked: 'LINKED',
        }[connection.state];
        setText(connectionStatus, `RELAY ${connection.relay} · ${stateLabel}`);
      }

      const canPause = view.state === 'playing';
      pause.disabled = !canPause;
      const reading = view.mode === 'story' || view.mode === 'resolve';
      show(comms, canPause && reading && !!(view.dialogue || view.record));
      advance.setAttribute('aria-label', view.record ? 'Acknowledge equipment record' : 'Continue dialogue');
      if (canPause && reading && view.record) {
        const record = view.record;
        comms.dataset.speaker = 'system';
        setText(speaker, record.title);
        setText(dialogueText, record.lines.join('\n'));
        setText(channel, record.source);
        setText(dialogueCount, `${String((view.recordIndex || 0) + 1).padStart(2, '0')} / ${String(view.recordCount || 2).padStart(2, '0')}`);
        show(commsIdentity, false);
      } else if (canPause && reading && view.dialogue) {
        const line = view.dialogue;
        comms.dataset.speaker = line.speaker;
        setText(speaker, speakerName[line.speaker]);
        setText(dialogueText, line.text);
        setText(dialogueCount, `${String(view.dialogueIndex + 1).padStart(2, '0')} / ${String(view.dialogueCount).padStart(2, '0')}`);
        setText(channel, line.speaker === 'vlad' ? 'MUNICIPAL CHANNEL' : line.speaker === 'omega' ? 'MODULE CHANNEL' : 'RIDER CHANNEL');
        show(commsIdentity, line.speaker !== 'jo');
        if (line.speaker === 'vlad') {
          if (portrait.src !== new URL(DELIVERY_ASSETS.vladNeutral, location.href).href) portrait.src = DELIVERY_ASSETS.vladNeutral;
          portrait.alt = 'Neutral portrait of Mayor Vlad';
          setText(identityCode, 'VL / 01');
        } else if (line.speaker === 'omega') {
          if (portrait.src !== new URL(DELIVERY_ASSETS.omegaSymbol, location.href).href) portrait.src = DELIVERY_ASSETS.omegaSymbol;
          portrait.alt = 'Omega symbol';
          setText(identityCode, 'Ω / MODULE');
        }
      }

      const menuVisible = view.state !== 'playing';
      show(overlay, menuVisible);
      if (view.state !== previousState) {
        confirmingReset = false;
        show(resetConfirm, false);
        previousState = view.state;
      }
      show(resetConfirm, confirmingReset && menuVisible);
      show(start, view.state === 'loading' || (view.state === 'ready' && !view.hasSave) || view.state === 'error');
      show(continueSave, view.state === 'ready' && view.hasSave);
      show(resume, view.state === 'paused');
      show(retry, view.state === 'paused' || view.state === 'crashed' || view.state === 'error');
      show(newGame, view.state === 'ready' && view.hasSave || view.state === 'paused' || view.state === 'crashed' || view.state === 'complete');
      show(menu, view.state === 'paused' || view.state === 'crashed' || view.state === 'complete' || view.state === 'error');
      show(continueChapter, view.state === 'complete');
      start.disabled = view.state !== 'ready' || view.readyToStart === false;
      setText(start, view.state === 'loading' ? `LOADING ${chapterLabel}…` : view.state === 'error' ? `${chapterLabel} UNAVAILABLE` : 'START DELIVERY');
      const saveText = saveLabel(view);
      show(saveNote, !!saveText && (view.state === 'ready' || view.state === 'paused' || view.state === 'complete'));
      setText(saveNote, saveText);
      saveNote.classList.toggle('session', view.saveStatus === 'session' || view.saveStatus === 'invalid');
      const history = view.history || view.log;
      renderLog(history);
      show(logDetails, view.state === 'paused' && history.length > 0);

      if (view.state === 'loading') {
        setText(overline, `${chapterLabel} / BASTROP`);
        setText(headline, 'BASTROP37');
        setText(message, view.message || (view.chapterId === 'L3' ? 'Preparing the public relay road.' : 'Preparing the road. Jo already has the module.'));
      } else if (view.state === 'ready') {
        setText(overline, `${chapterNo} / ${chapterLabel}`);
        setText(headline, 'BASTROP37');
        setText(message, view.message || (view.chapterId === 'L3' ? 'Jo is carrying Omega toward the old public relay.' : 'Jo has the module. Mayor Vlad is waiting at municipal intake.'));
      } else if (view.state === 'paused') {
        setText(overline, 'RIDE PAUSED');
        setText(headline, `${chapterLabel} ON HOLD`);
        setText(message, view.message || view.objective);
      } else if (view.state === 'crashed') {
        setText(overline, 'RIDE INTERRUPTED');
        setText(headline, 'TRY THE ROAD AGAIN');
        setText(message, view.message || 'Restart the ride from the last safe point.');
      } else if (view.state === 'complete') {
        setText(overline, `${chapterNo} / ${chapterLabel}`);
        setText(headline, view.completionTitle || 'DELIVERY APPROACH REACHED');
        setText(message, view.message || (view.chapterId === 'L3' ? 'Both local relay points are ready. Omega remains inside the module.' : 'Jo reached municipal intake. This playable slice ends here.'));
      } else if (view.state === 'error') {
        setText(overline, `${chapterLabel} UNAVAILABLE`);
        setText(headline, 'ROAD CLOSED');
        setText(message, view.message || 'The ride could not load. Refresh to try again.');
      }
      setText(feedback, view.state === 'playing' ? (view.message || (view.mode === 'drain' ? 'TRAFFIC CLEARING' : '')) : '');
    },
  };
}
