import type { BirthdayMemory } from '../data/justyna34';

const root = document.querySelector<HTMLElement>('#birthday')!;
const memories: BirthdayMemory[] = JSON.parse(document.querySelector('#birthday-data')!.textContent!);
const stage = document.querySelector<HTMLElement>('#photo-stage')!;
const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-photo-index]'));
const originals = slots.filter((slot) => !slot.dataset.clone);
const questions = Array.from(document.querySelectorAll<HTMLElement>('[data-question-index]'));
const status = document.querySelector<HTMLElement>('#birthday-status')!;
const dialog = document.querySelector<HTMLDialogElement>('.photo-dialog')!;
const enlarged = document.querySelector<HTMLImageElement>('#enlarged-photo')!;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const storageKey = `justyna34:${root.dataset.revision}`;
const runningAnimations = new Set<Animation>();
let active = 0;
let answers: Record<string, string> = {};
let questionAnimations: Animation[] = [];
let scrollFrame = 0;
let navigating = false;
let navigationTimer: ReturnType<typeof setTimeout>;
let advanceTimer: ReturnType<typeof setTimeout>;

function animate(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
  if (reducedMotion.matches) return undefined;
  const animation = element.animate(frames, options);
  runningAnimations.add(animation);
  const finished = () => runningAnimations.delete(animation);
  animation.finished.then(finished, finished);
  return animation;
}
function cancelAdvance() { clearTimeout(advanceTimer); }
function accepted(memory: BirthdayMemory, option: string) {
  return memory.options.some(({ id }) => id === option) && (!memory.correctOption || memory.correctOption === option);
}
// Optional persistence: private browsing and disabled storage remain usable.
try {
  const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}');
  if (saved && typeof saved === 'object') {
    for (const memory of memories) {
      const option = (saved as Record<string, unknown>)[memory.id];
      if (typeof option === 'string' && accepted(memory, option)) answers[memory.id] = option;
    }
  }
} catch { /* Start with a fresh album. */ }
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(answers)); } catch { /* Optional persistence. */ }
}
function renderAnswers() {
  memories.forEach((memory, index) => {
    questions[index].querySelectorAll<HTMLButtonElement>('.answer').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.option === answers[memory.id]));
    });
  });
  root.classList.toggle('is-complete', Object.keys(answers).length === memories.length);
}

function select(index: number, announce = true) {
  if (index < 0 || index >= memories.length) return;
  const changed = active !== index;
  const direction = index > active ? 1 : -1;
  active = index;
  slots.forEach((slot) => {
    const i = Number(slot.dataset.photoIndex);
    slot.classList.toggle('is-current', i === index);
    slot.querySelector('button')!.setAttribute('aria-label', i === index ? `Enlarge photo ${i + 1}` : `Show photo ${i + 1}`);
  });
  questions.forEach((question, i) => { question.hidden = i !== index; });
  if (changed) {
    questionAnimations.forEach((animation) => animation.cancel());
    questionAnimations = [];
    questions[index].querySelectorAll('h2, .answer').forEach((element, i) => {
      const animation = animate(element, [
        { opacity: 0, transform: `translate(${direction * 8}px, 8px)` },
        { opacity: 1, transform: 'translate(0, 0)' },
      ], { duration: 650, delay: i * 55, fill: 'backwards', easing: 'cubic-bezier(.22, 1, .36, 1)' });
      if (animation) questionAnimations.push(animation);
    });
    if (announce) status.textContent = `Photo ${index + 1} of ${memories.length}. ${memories[index].question}`;
  }
}
function centeredScroll(index: number) {
  return stage.scrollLeft + originals[index].getBoundingClientRect().left - stage.getBoundingClientRect().left - (stage.clientWidth - originals[index].clientWidth) / 2;
}
function goTo(index: number, smooth = true) {
  cancelAdvance();
  index = (index + memories.length) % memories.length;
  clearTimeout(navigationTimer);
  navigating = true;
  select(index);
  stage.scrollTo({ left: centeredScroll(index), behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
  navigationTimer = setTimeout(() => { navigating = false; }, 900);
}
function closestSlot() {
  const middle = stage.getBoundingClientRect().left + stage.clientWidth / 2;
  return slots.reduce((best, slot) => {
    const box = slot.getBoundingClientRect();
    const bestBox = best.getBoundingClientRect();
    return Math.abs(box.left + box.width / 2 - middle) < Math.abs(bestBox.left + bestBox.width / 2 - middle) ? slot : best;
  });
}
stage.addEventListener('scroll', () => {
  if (navigating || scrollFrame) return;
  cancelAdvance();
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    select(Number(closestSlot().dataset.photoIndex));
  });
}, { passive: true });
function settleScroll() {
  navigating = false;
  const closest = closestSlot();
  if (closest.dataset.clone) goTo(Number(closest.dataset.photoIndex), false);
}
stage.addEventListener('scrollend', settleScroll);
let settleTimer: ReturnType<typeof setTimeout>;
stage.addEventListener('scroll', () => {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settleScroll, 180);
}, { passive: true });

// Native touch scrolling preserves vertical scrolling and pinch-to-zoom.
// The same photographs can be picked up and dragged with a mouse.
let drag: { id: number; x: number; scroll: number; moved: boolean } | undefined;
let suppressClick = false;
stage.addEventListener('pointerdown', (event) => {
  cancelAdvance();
  navigating = false;
  clearTimeout(navigationTimer);
  suppressClick = false;
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX, scroll: stage.scrollLeft, moved: false };
});
stage.addEventListener('pointermove', (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  if (!event.buttons) { drag = undefined; return; }
  const delta = event.clientX - drag.x;
  if (!drag.moved && Math.abs(delta) < 7) return;
  drag.moved = true;
  suppressClick = true;
  stage.classList.add('is-dragging');
  if (!stage.hasPointerCapture(event.pointerId)) stage.setPointerCapture(event.pointerId);
  stage.scrollLeft = drag.scroll - delta;
  event.preventDefault();
});
function endDrag(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return;
  const moved = drag.moved;
  drag = undefined;
  stage.classList.remove('is-dragging');
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  if (moved) {
    const nearest = closestSlot();
    goTo(Number(nearest.dataset.photoIndex), !nearest.dataset.clone);
  }
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('click', (event) => {
  if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
}, true);

// A little physical depth follows the pointer; touch gets a light wash and
// press response. No idle JavaScript animation loop or device sensors needed.
slots.forEach((slot) => {
  const button = slot.querySelector<HTMLButtonElement>('button')!;
  const index = Number(slot.dataset.photoIndex);
  let pointerFrame = 0;
  let lightTimer: ReturnType<typeof setTimeout>;
  function neutral() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    button.style.removeProperty('--tilt-x');
    button.style.removeProperty('--tilt-y');
  }
  button.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || !finePointer.matches || drag?.moved || active !== index || event.buttons) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const bounds = slot.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      button.style.setProperty('--tilt-x', `${(y - .5) * -3}deg`);
      button.style.setProperty('--tilt-y', `${(x - .5) * 3}deg`);
      button.style.setProperty('--light-x', `${x * 100}%`);
      button.style.setProperty('--light-y', `${y * 100}%`);
    });
  });
  button.addEventListener('pointerleave', neutral);
  button.addEventListener('pointerdown', (event) => {
    neutral();
    if (reducedMotion.matches) return;
    clearTimeout(lightTimer);
    const bounds = button.getBoundingClientRect();
    button.style.setProperty('--light-x', `${(event.clientX - bounds.left) / bounds.width * 100}%`);
    button.style.setProperty('--light-y', `${(event.clientY - bounds.top) / bounds.height * 100}%`);
    button.classList.add('is-touched');
    lightTimer = setTimeout(() => button.classList.remove('is-touched'), 900);
  });
  button.addEventListener('click', () => {
    cancelAdvance();
    if (active !== index) { goTo(index); return; }
    void openPhoto(button, index);
  });
  button.addEventListener('focus', () => {
    if (button.matches(':focus-visible') && active !== index) goTo(index);
  });
});

let photoSource: HTMLButtonElement | undefined;
let opening = false;
let closing = false;
let dialogAnimation: Animation | undefined;
function photoTransform(source: DOMRect, target: DOMRect) {
  const x = source.x + source.width / 2 - target.x - target.width / 2;
  const y = source.y + source.height / 2 - target.y - target.height / 2;
  return `translate(${x}px, ${y}px) scale(${source.width / target.width})`;
}
async function openPhoto(button: HTMLButtonElement, index: number) {
  if (opening || dialog.open) return;
  opening = true;
  enlarged.src = memories[index].photo;
  enlarged.alt = memories[index].alt;
  try { await enlarged.decode(); } catch { /* Keep the image's alt text available on failure. */ }
  opening = false;
  if (active !== index) return;
  const sourceBounds = button.getBoundingClientRect();
  photoSource = button;
  dialog.showModal();
  const targetBounds = dialog.getBoundingClientRect();
  button.closest('.photo-slot')!.classList.add('is-expanded');
  dialogAnimation = animate(dialog, [
    { transform: photoTransform(sourceBounds, targetBounds), opacity: .3 },
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
  ], { duration: 750, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
async function closePhoto() {
  if (!dialog.open || closing) return;
  closing = true;
  dialogAnimation?.cancel();
  dialog.classList.add('is-closing');
  if (photoSource) {
    const destination = photoSource.getBoundingClientRect();
    dialogAnimation = animate(dialog, [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: photoTransform(destination, dialog.getBoundingClientRect()), opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
    await dialogAnimation?.finished.catch(() => undefined);
  }
  dialog.close();
  dialogAnimation?.cancel();
  dialog.classList.remove('is-closing');
  photoSource?.closest('.photo-slot')!.classList.remove('is-expanded');
  closing = false;
}
document.querySelector('.dialog-close')!.addEventListener('click', () => void closePhoto());
dialog.addEventListener('cancel', (event) => { event.preventDefault(); void closePhoto(); });
dialog.addEventListener('click', (event) => { if (event.target === dialog) void closePhoto(); });
document.addEventListener('keydown', (event) => {
  if (dialog.open || event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const focusedAnswer = document.activeElement?.closest('.answers');
  event.preventDefault();
  goTo(active + (event.key === 'ArrowRight' ? 1 : -1));
  if (focusedAnswer) questions[active].querySelector<HTMLButtonElement>('.answer')!.focus({ preventScroll: true });
});

questions.forEach((question, index) => {
  question.querySelectorAll<HTMLButtonElement>('.answer').forEach((button) => {
    button.addEventListener('click', (event) => {
      cancelAdvance();
      const memory = memories[index];
      const option = button.dataset.option!;
      question.querySelectorAll('.is-retry').forEach((retry) => retry.classList.remove('is-retry'));
      if (!accepted(memory, option)) {
        button.classList.add('is-retry');
        status.textContent = 'Give it another try.';
        animate(button, [{ transform: 'scale(1)' }, { transform: 'scale(.985)' }, { transform: 'scale(1)' }], { duration: 500 });
        return;
      }
      const changed = answers[memory.id] !== option;
      answers[memory.id] = option;
      save();
      renderAnswers();
      const count = Object.keys(answers).length;
      status.textContent = count === memories.length ? 'All memories answered. Happy birthday, Justyna!' : `${memory.correctOption ? 'That’s right.' : 'Answer saved.'} ${count} of ${memories.length} questions answered.`;
      if (changed && !reducedMotion.matches) {
        button.querySelectorAll('.answer-ripple').forEach((ripple) => ripple.remove());
        const ripple = document.createElement('span');
        ripple.className = 'answer-ripple';
        ripple.setAttribute('aria-hidden', 'true');
        const bounds = button.getBoundingClientRect();
        ripple.style.left = `${event.detail ? event.clientX - bounds.x : bounds.width / 2}px`;
        ripple.style.top = `${event.detail ? event.clientY - bounds.y : bounds.height / 2}px`;
        button.append(ripple);
        setTimeout(() => ripple.remove(), 1200);
        if (count === memories.length) {
          animate(document.querySelector('.ambient-light')!, [{ opacity: 1 }, { opacity: .15, offset: .35 }, { opacity: 1 }], { duration: 2200, easing: 'ease-in-out' });
        }
      }
      // A deliberate pause lets the selected answer land before the next memory.
      // Any manual navigation, enlargement, or hidden tab cancels this move.
      if (changed && count < memories.length) {
        advanceTimer = setTimeout(() => {
          if (active !== index || dialog.open || document.hidden) return;
          const next = Array.from({ length: memories.length - 1 }, (_, offset) => (index + offset + 1) % memories.length)
            .find((i) => !answers[memories[i].id]);
          if (next === undefined) return;
          const focusAnswer = question.contains(document.activeElement);
          goTo(next);
          if (focusAnswer) questions[next].querySelector<HTMLButtonElement>('.answer')!.focus({ preventScroll: true });
        }, 1350);
      }
    });
  });
});

let stageVisible = true;
function syncMotion() { document.body.classList.toggle('motion-paused', document.hidden || !stageVisible); }
new IntersectionObserver(([entry]) => { stageVisible = entry.isIntersecting; syncMotion(); }, { rootMargin: '80px' }).observe(stage);
document.addEventListener('visibilitychange', () => { cancelAdvance(); syncMotion(); });
reducedMotion.addEventListener('change', () => {
  if (!reducedMotion.matches) return;
  runningAnimations.forEach((animation) => animation.cancel());
  document.querySelectorAll<HTMLElement>('.photo-surface').forEach((button) => {
    button.style.removeProperty('--tilt-x');
    button.style.removeProperty('--tilt-y');
  });
  document.querySelectorAll('.answer-ripple').forEach((ripple) => ripple.remove());
});
let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => goTo(active, false), 100);
});
renderAnswers();
goTo(0, false);
