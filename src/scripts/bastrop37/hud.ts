import type { ChapterId, TransmissionEntry, HudActions, HudView, Speaker } from './contracts';
import { ridingGuidance, urgentFeedback } from './hud-presentation';

const speakerName: Record<Speaker, string> = { jo: 'JO', vlad: 'MAYOR VLAD', omega: 'OMEGA' };
function element<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Bastrop HUD missing ${selector}`);
  return node;
}
function text(node: HTMLElement, value: string): void { if (node.textContent !== value) node.textContent = value; }
function show(node: HTMLElement, visible: boolean): void { if (node.hidden === visible) node.hidden = !visible; }
function saveLabel(view: HudView): string {
  if (view.saveStatus === 'session') return 'SESSION ONLY — PROGRESS COULD NOT BE SAVED';
  if (view.saveStatus === 'invalid') return 'SAVED RIDE UNAVAILABLE — START A NEW DELIVERY';
  if (view.saveStatus !== 'saved') return '';
  return view.state === 'complete' ? view.completionSaveLabel || 'SAVED CHECKPOINT' : 'SAVED CHECKPOINT';
}

/** Presentation only. The road owns mission, ability, dialogue and save state. */
export function createHud(actions: HudActions): { render(view: HudView): void } {
  const root = element('#bastrop-game'), canvas = element('#game');
  const overlay = element('#overlay'), riding = element('#riding-hud');
  const guidance = element('#guidance'), nextMove = element('#next-move'), arrow = element('#turn-arrow');
  const feedback = element('#feedback'), taskProgress = element<HTMLMeterElement>('#task-progress');
  const velocity = element('#velocity'), speed = element('#speed');
  const boost = element<HTMLButtonElement>('#turbo-trigger'), boostLabel = element('#boost-label');
  const boostCharge = document.querySelector<SVGCircleElement>('#boost-charge')!;
  const bikeHealth = element('#bike-health'), busHealth = element('#bus-health');
  const recovery = element('#ability-recovery'), spikeRecovery = element('#spike-recovery'), jumpRecovery = element('#jump-recovery');
  const comms = element('#comms'), advance = element<HTMLButtonElement>('#advance');
  const speaker = element('#speaker'), dialogueText = element('#dialogue-text');
  const headline = element('#headline'), overline = element('#overline'), message = element('#message'), saveNote = element('#save-note');
  const start = element<HTMLButtonElement>('#start'), pause = element<HTMLButtonElement>('#pause');
  const continueSave = element<HTMLButtonElement>('#continue-save'), resume = element<HTMLButtonElement>('#resume');
  const retry = element<HTMLButtonElement>('#retry'), newGame = element<HTMLButtonElement>('#new-game');
  const menu = element<HTMLButtonElement>('#menu'), continueChapter = element<HTMLButtonElement>('#continue-chapter');
  const resetConfirm = element('#reset-confirm'), confirmNewGame = element<HTMLButtonElement>('#confirm-new-game'), cancelNewGame = element<HTMLButtonElement>('#cancel-new-game');
  const chapterPicker = element('#chapter-picker');
  const replayButtons = [...chapterPicker.querySelectorAll<HTMLButtonElement>('[data-replay-chapter]')];
  const logDetails = element<HTMLDetailsElement>('#log-details'), logCount = element('#log-count'), logList = element<HTMLOListElement>('#dialogue-log');
  const rideDetails = element('#ride-details'), objective = element('#objective'), routeCue = element('#route-cue'), rideProgress = element('#ride-progress');
  const energy = element('#charge-value'), riderCondition = element('#rider-condition'), overdrive = element('#overdrive-state'), moduleState = element('#module-state'), replayBadge = element('#replay-badge');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let confirmingReset = false, previousState: HudView['state'] | null = null;
  let lastLogKey = '', lastTransmission = '', lastWarning = '';

  function receive(node: HTMLElement): void {
    if (reducedMotion.matches) return;
    node.getAnimations().forEach(animation => animation.cancel());
    node.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
  }
  function title(value: string): void {
    if (headline.textContent === value) return;
    if (value === 'BASTROP37') {
      const number = document.createElement('span'); number.className = 'title-number'; number.textContent = '37';
      headline.replaceChildren(document.createTextNode('BASTROP'), number);
    } else text(headline, value);
  }
  function health(node: HTMLElement, condition: number, name: string): void {
    const value = Math.max(0, Math.min(3, condition));
    node.setAttribute('aria-valuenow', String(value));
    node.setAttribute('aria-valuetext', `${value} of 3`);
    node.setAttribute('aria-label', `${name} condition: ${value} of 3`);
    [...node.querySelectorAll('i')].forEach((pip, index) => pip.classList.toggle('empty', index >= value));
  }
  root.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.code === 'Escape' && confirmingReset) {
      event.preventDefault(); event.stopPropagation(); cancelNewGame.click(); return;
    }
    if (event.key !== 'Tab') return;
    const scope = confirmingReset ? resetConfirm : overlay;
    const targets = [...scope.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary')].filter(node => node.getClientRects().length > 0);
    const first = targets[0], last = targets[targets.length - 1];
    if (!first) { event.preventDefault(); overlay.focus(); return; }
    if (!scope.contains(document.activeElement) || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
  });
  start.addEventListener('click', actions.start);
  pause.addEventListener('click', actions.pause);
  continueSave.addEventListener('click', actions.continue);
  resume.addEventListener('click', actions.resume);
  retry.addEventListener('click', actions.retry);
  menu.addEventListener('click', actions.menu);
  continueChapter.addEventListener('click', actions.continue);
  advance.addEventListener('click', actions.advance);
  replayButtons.forEach(button => button.addEventListener('click', () => actions.replay(button.dataset.replayChapter as ChapterId)));
  newGame.addEventListener('click', () => { confirmingReset = true; show(resetConfirm, true); confirmNewGame.focus(); });
  confirmNewGame.addEventListener('click', () => { confirmingReset = false; show(resetConfirm, false); actions.newGame(); });
  cancelNewGame.addEventListener('click', () => { confirmingReset = false; show(resetConfirm, false); newGame.focus(); });

  function renderLog(entries: TransmissionEntry[]): void {
    const key = JSON.stringify(entries);
    if (key === lastLogKey) return;
    lastLogKey = key; logList.replaceChildren();
    for (const entry of entries) {
      const item = document.createElement('li'), name = document.createElement('strong');
      const record = 'lines' in entry;
      name.textContent = record ? `${entry.title} / ${entry.source}: ` : `${speakerName[entry.speaker]} / `;
      item.append(name, document.createTextNode(record ? entry.lines.join(' · ') : entry.text));
      if (record) item.dataset.kind = 'record';
      logList.append(item);
    }
    text(logCount, String(entries.length));
  }

  return { render(view): void {
    const playing = view.state === 'playing', action = playing && (view.mode === 'action' || view.mode === 'drain');
    const reading = playing && (view.mode === 'story' || view.mode === 'resolve');
    const stateChanged = previousState !== view.state;
    root.dataset.state = view.state; root.dataset.mode = view.mode;
    show(riding, action); show(pause, playing); pause.disabled = !playing;
    const nav = ridingGuidance(view), warning = action ? urgentFeedback(view.message) : '';
    show(guidance, action && !!(nav.text || warning || nav.progress !== undefined || view.escort));
    text(nextMove, nav.text); text(arrow, nav.arrow);
    guidance.dataset.alert = String(!!warning);
    text(feedback, warning); show(feedback, !!warning);
    if (warning && warning !== lastWarning) receive(feedback);
    lastWarning = warning;
    show(taskProgress, action && nav.progress !== undefined);
    if (nav.progress !== undefined) {
      taskProgress.value = Math.max(0, Math.min(1, nav.progress));
      taskProgress.setAttribute('aria-label', view.missionMeter?.label || 'Mission progress');
    }
    show(busHealth, action && !!view.escort && !view.escort.busSafe);
    if (view.escort) health(busHealth, view.escort.condition, 'Bus');

    const kph = Math.max(0, Math.round(view.speed));
    text(speed, String(kph));
    velocity.setAttribute('aria-valuenow', String(Math.min(600, kph)));
    velocity.setAttribute('aria-valuetext', `${kph} kilometers per hour`);
    const odAvailable = view.overdrive?.active || (view.overdrive?.ready && view.turbo !== 'active');
    const boostState = !playing || view.mode !== 'action' ? 'unavailable' : view.overdrive?.active ? 'active' : odAvailable ? 'ready' : view.turbo;
    boost.dataset.state = boostState;
    boost.disabled = boostState !== 'ready';
    const boostName = odAvailable ? 'overdrive' : 'turbo';
    boost.setAttribute('aria-label', boostState === 'ready' ? `Activate ${boostName}` : `${boostName} ${boostState}`);
    boost.title = boostState === 'ready' ? `${odAvailable ? 'Overdrive' : 'Boost'} · Shift` : boostState === 'charging' ? 'Boost recharging' : boostState;
    text(boostLabel, odAvailable ? 'OVERDRIVE' : boostState === 'charging' ? 'CHARGING' : boostState === 'active' ? 'BOOSTING' : 'BOOST');
    show(boostLabel, !!odAvailable);
    boostCharge.style.strokeDashoffset = String(100 * (1 - (odAvailable ? 1 : Math.min(1, Math.max(0, view.energy) / .4))));
    show(bikeHealth, action && !!view.roadCombat && view.roadCombat.condition < 3);
    if (view.roadCombat) health(bikeHealth, view.roadCombat.condition, 'Bike');
    for (const [node, name, ability] of [[spikeRecovery, 'SPIKES', view.abilities?.blades], [jumpRecovery, 'JUMP', view.abilities?.jump]] as const) {
      const cooling = view.mode === 'action' && ability?.state === 'cooldown';
      show(node, cooling);
      if (cooling) text(node, `${name} ${(ability.cooldown || 0).toFixed(1)}`);
    }
    show(recovery, !spikeRecovery.hidden || !jumpRecovery.hidden);

    show(comms, reading && !!(view.record || view.dialogue));
    if (!comms.hidden) {
      const record = view.record, line = view.dialogue;
      comms.dataset.speaker = record ? 'system' : line!.speaker;
      text(speaker, record ? record.title : speakerName[line!.speaker]);
      text(dialogueText, record ? record.lines.join('\n') : line!.text);
      advance.setAttribute('aria-label', record ? 'Acknowledge equipment record' : 'Continue dialogue');
      const transmission = record?.id || line!.id;
      if (transmission !== lastTransmission) receive(dialogueText);
      lastTransmission = transmission;
    } else lastTransmission = '';

    // All nonessential information is available when the rider chooses to stop.
    text(objective, view.objective); text(routeCue, view.routeCue);
    text(rideProgress, view.missionMeter ? `${view.missionMeter.label} · ${view.missionMeter.detail}` : '');
    text(energy, `${Math.round(view.energy * 100)}%`);
    text(riderCondition, view.roadCombat ? `${view.roadCombat.condition} / 3 · ${view.roadCombat.knockouts} riders down` : 'Ready');
    text(overdrive, view.overdrive ? view.overdrive.active ? 'ACTIVE' : view.overdrive.ready ? 'READY · NEXT BOOST' : `${Math.round(view.overdrive.value)}%` : '—');
    text(moduleState, view.omegaReleased ? 'PUBLIC ACCESS ACTIVE' : 'SECURED');
    show(rideDetails, view.state === 'paused' || view.state === 'crashed');
    show(replayBadge, !!view.replay?.active);
    const chapterLabel = view.chapterLabel || 'DELIVERY';
    const chapterNo = (view.chapterId || 'L1').slice(1).padStart(2, '0');
    text(replayBadge, `${chapterNo} / ${chapterLabel} REPLAY`);
    show(overlay, !playing);
    if (stateChanged) { confirmingReset = false; show(resetConfirm, false); }
    show(resetConfirm, confirmingReset && !playing);
    const unlocked = view.replay?.unlocked || [];
    const pickerVisible = (view.state === 'ready' || view.state === 'complete') && unlocked.length > 0 && !confirmingReset;
    show(chapterPicker, pickerVisible);
    replayButtons.forEach(button => show(button, pickerVisible && unlocked.includes(button.dataset.replayChapter as ChapterId)));
    show(start, view.state === 'loading' || (view.state === 'ready' && !view.hasSave) || view.state === 'error');
    show(continueSave, view.state === 'ready' && view.hasSave);
    show(resume, view.state === 'paused');
    show(retry, view.state === 'paused' || view.state === 'crashed' || view.state === 'error');
    show(newGame, view.state === 'ready' && view.hasSave || view.state === 'paused' || view.state === 'crashed' || view.state === 'complete');
    show(menu, view.state === 'paused' || view.state === 'crashed' || view.state === 'complete' || view.state === 'error');
    show(continueChapter, view.state === 'complete' && !view.campaignComplete && !view.replay?.active);
    text(menu, view.state === 'complete' && (view.campaignComplete || view.replay?.active) ? 'RETURN TO TITLE' : 'MAIN MENU');
    text(continueChapter, view.continueLabel || 'CONTINUE TO INTAKE');
    text(retry, view.retryLabel || 'RETRY CHECKPOINT');
    start.disabled = view.state !== 'ready' || view.readyToStart === false;
    text(start, view.state === 'loading' ? 'LOADING…' : view.state === 'error' ? 'ROAD UNAVAILABLE' : 'RIDE');
    const saveText = saveLabel(view);
    show(saveNote, !!saveText && ['ready', 'paused', 'complete'].includes(view.state));
    text(saveNote, saveText); saveNote.classList.toggle('session', view.saveStatus === 'session' || view.saveStatus === 'invalid');
    const history = view.history || view.log;
    if (!playing) renderLog(history);
    show(logDetails, view.state === 'paused' && history.length > 0);
    if (view.state === 'loading' || view.state === 'ready') {
      text(overline, `${chapterNo} / ${chapterLabel}`); title('BASTROP37');
      text(message, view.message || 'Jo has the module. Mayor Vlad is waiting at municipal intake.');
    } else if (view.state === 'paused') {
      text(overline, `${chapterNo} / ${chapterLabel}`); title('RIDE PAUSED'); text(message, view.objective);
    } else if (view.state === 'crashed') {
      text(overline, 'RIDE INTERRUPTED'); title(view.chapterId === 'L4' && view.escort?.condition === 0 ? 'EVACUATION ROUTE LOST' : 'BACK ON THE ROAD');
      text(message, view.message || 'Restart from the last safe point.');
    } else if (view.state === 'complete') {
      text(overline, `${chapterNo} / ${chapterLabel}`); title(view.campaignComplete ? 'BASTROP / PUBLIC ACCESS RESTORED' : view.completionTitle || 'DELIVERY APPROACH REACHED');
      text(message, view.message || 'The road ahead is open.');
    } else if (view.state === 'error') {
      text(overline, `${chapterLabel} UNAVAILABLE`); title('ROAD CLOSED'); text(message, view.message || 'The ride could not load. Refresh to try again.');
    }
    if (stateChanged) {
      if (!playing) {
        const primary = [continueChapter, continueSave, start, retry, menu].find(button => !button.hidden && !button.disabled);
        (view.state === 'paused' ? overlay : primary || overlay).focus({ preventScroll: true });
      } else canvas.focus({ preventScroll: true });
    }
    previousState = view.state;
  } };
}
