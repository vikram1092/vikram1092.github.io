import { DELIVERY_ASSETS } from './delivery-content';
import type { DialogueLine, HudActions, HudView, Speaker } from './contracts';

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
    case 'saved': return view.state === 'complete' ? 'SAVED / DELIVERY APPROACH' : 'SAVED CHECKPOINT';
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

  function renderLog(lines: DialogueLine[]): void {
    const key = lines.map(line => `${line.id}:${line.speaker}:${line.text}`).join('|');
    if (key === lastLogKey) return;
    lastLogKey = key;
    logList.replaceChildren();
    for (const line of lines) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      name.textContent = `${speakerName[line.speaker]} / `;
      item.append(name, document.createTextNode(line.text));
      logList.append(item);
    }
    setText(logCount, String(lines.length));
  }

  return {
    render(view: HudView): void {
      root.dataset.state = view.state;
      root.dataset.mode = view.mode;
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

      const canPause = view.state === 'playing';
      pause.disabled = !canPause;
      const reading = view.mode === 'story' || view.mode === 'resolve';
      show(comms, canPause && reading && !!view.dialogue);
      if (canPause && reading && view.dialogue) {
        const line = view.dialogue;
        comms.dataset.speaker = line.speaker;
        setText(speaker, speakerName[line.speaker]);
        setText(dialogueText, line.text);
        setText(dialogueCount, `${String(view.dialogueIndex + 1).padStart(2, '0')} / ${String(view.dialogueCount).padStart(2, '0')}`);
        setText(channel, line.speaker === 'vlad' ? 'MUNICIPAL CHANNEL' : line.speaker === 'omega' ? 'MODULE CHANNEL' : 'RIDER CHANNEL');
        show(portrait.parentElement as HTMLElement, line.speaker !== 'jo');
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
      setText(start, view.state === 'loading' ? 'LOADING DELIVERY…' : view.state === 'error' ? 'DELIVERY UNAVAILABLE' : 'START DELIVERY');
      const saveText = saveLabel(view);
      show(saveNote, !!saveText && (view.state === 'ready' || view.state === 'paused' || view.state === 'complete'));
      setText(saveNote, saveText);
      saveNote.classList.toggle('session', view.saveStatus === 'session' || view.saveStatus === 'invalid');
      renderLog(view.log);
      show(logDetails, view.state === 'paused' && view.log.length > 0);

      if (view.state === 'loading') {
        setText(overline, 'DELIVERY / BASTROP');
        setText(headline, 'BASTROP37');
        setText(message, view.message || 'Preparing the road. Jo already has the module.');
      } else if (view.state === 'ready') {
        setText(overline, '01 / DELIVERY');
        setText(headline, 'BASTROP37');
        setText(message, view.message || 'Jo has the module. Mayor Vlad is waiting at municipal intake.');
      } else if (view.state === 'paused') {
        setText(overline, 'RIDE PAUSED');
        setText(headline, 'DELIVERY ON HOLD');
        setText(message, view.message || view.objective);
      } else if (view.state === 'crashed') {
        setText(overline, 'RIDE INTERRUPTED');
        setText(headline, 'TRY THE ROAD AGAIN');
        setText(message, view.message || 'Restart Delivery from the last safe point.');
      } else if (view.state === 'complete') {
        setText(overline, '01 / DELIVERY');
        setText(headline, 'DELIVERY APPROACH REACHED');
        setText(message, view.message || 'Jo reached municipal intake. This playable slice ends here.');
      } else if (view.state === 'error') {
        setText(overline, 'DELIVERY UNAVAILABLE');
        setText(headline, 'ROAD CLOSED');
        setText(message, view.message || 'The ride could not load. Refresh to try again.');
      }
      setText(feedback, view.state === 'playing' ? (view.message || (view.mode === 'drain' ? 'TRAFFIC CLEARING' : '')) : '');
    },
  };
}
