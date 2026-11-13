import type { BirthdayMemory } from '../data/justyna34';

const root = document.querySelector<HTMLElement>('#birthday')!;
const memories: BirthdayMemory[] = JSON.parse(document.querySelector('#birthday-data')!.textContent!);
const stage = document.querySelector<HTMLElement>('#photo-stage')!;
const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-photo-index]'));
const originals = slots.filter((slot) => !slot.dataset.clone);
const questions = Array.from(document.querySelectorAll<HTMLElement>('[data-question-index]'));
const thumbnails = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-memory-index]'));
const previous = document.querySelector<HTMLButtonElement>('.previous')!;
const next = document.querySelector<HTMLButtonElement>('.next')!;
const reset = document.querySelector<HTMLButtonElement>('.reset')!;
const status = document.querySelector<HTMLElement>('#birthday-status')!;
const dialog = document.querySelector<HTMLDialogElement>('.photo-dialog')!;
const enlarged = document.querySelector<HTMLImageElement>('#enlarged-photo')!;
const particleLayer = document.querySelector<HTMLElement>('.love-particles')!;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const storageKey = `justyna34:${root.dataset.revision}`;
let active = 0;
let answers: Record<string, string> = {};
let motion: Animation | undefined;
let scrollFrame = 0;
let navigating = false;
let navigationTimer: ReturnType<typeof setTimeout>;

function accepted(memory: BirthdayMemory, option: string) {
  return memory.options.some(({ id }) => id === option) && (!memory.correctOption || memory.correctOption === option);
}

// Storage can be unavailable in private browsing; the whole experience still works.
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

function burst(x: number, y: number, count = 7) {
  if (reducedMotion.matches) return;
  const available = Math.max(0, 45 - particleLayer.childElementCount);
  for (let i = 0; i < Math.min(count, available); i++) {
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    particle.setAttribute('viewBox', '0 0 24 24');
    particle.classList.add('love-particle');
    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    heart.setAttribute('href', '#heart');
    particle.append(heart);
    particle.style.cssText = `left:${x - 7}px;top:${y - 7}px;--drift:${(Math.random() - .5) * 170}px;--rise:${-65 - Math.random() * 130}px;--size:${.6 + Math.random() * .7};--turn:${(Math.random() - .5) * 100}deg;--duration:${900 + Math.random() * 650}ms;--delay:${i * 24}ms`;
    particleLayer.append(particle);
    particle.addEventListener('animationend', () => particle.remove(), { once: true });
    // Also clean up if the reduced-motion preference changes during a burst.
    setTimeout(() => particle.remove(), 2400);
  }
}

function burstFrom(element: Element, count?: number) {
  const bounds = element.getBoundingClientRect();
  burst(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, count);
}

function renderAnswers() {
  let completed = 0;
  memories.forEach((memory, index) => {
    const answer = answers[memory.id];
    if (answer) completed++;
    questions[index].querySelectorAll<HTMLButtonElement>('.answer').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.option === answer));
    });
    thumbnails[index].classList.toggle('is-answered', Boolean(answer));
    thumbnails[index].setAttribute('aria-label', `Photo ${index + 1}${answer ? ', answered' : ''}`);
    document.querySelector(`[data-progress-index="${index}"]`)!.classList.toggle('is-filled', Boolean(answer));
  });
  const complete = completed === memories.length;
  const wasComplete = root.classList.contains('is-complete');
  document.querySelector('.progress-hearts')!.setAttribute('aria-label', `${completed} of ${memories.length} questions answered`);
  root.classList.toggle('is-complete', complete);
  reset.hidden = !complete;
  if (complete && !wasComplete) burstFrom(document.querySelector('.progress-hearts')!, 22);
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
  memories.forEach((_, i) => {
    questions[i].hidden = i !== index;
    thumbnails[i].classList.toggle('is-current', i === index);
    if (i === index) thumbnails[i].setAttribute('aria-current', 'true');
    else thumbnails[i].removeAttribute('aria-current');
  });
  previous.disabled = memories.length <= 1;
  next.disabled = memories.length <= 1;
  document.querySelector('#current-number')!.textContent = String(index + 1).padStart(2, '0');
  if (changed && !reducedMotion.matches) {
    motion?.cancel();
    motion = questions[index].animate([
      { opacity: 0, transform: `translate(${direction * 12}px, 5px)` },
      { opacity: 1, transform: 'translate(0, 0)' },
    ], { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' });
  }
  if (changed && announce) status.textContent = `Photo ${index + 1} of ${memories.length}. ${memories[index].question}`;
}

function centeredScroll(index: number) {
  return stage.scrollLeft + originals[index].getBoundingClientRect().left - stage.getBoundingClientRect().left - (stage.clientWidth - originals[index].clientWidth) / 2;
}

function goTo(index: number, smooth = true) {
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
// Older Safari versions do not emit scrollend.
let settleTimer: ReturnType<typeof setTimeout>;
stage.addEventListener('scroll', () => {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settleScroll, 160);
}, { passive: true });
previous.addEventListener('click', () => goTo(active - 1));
next.addEventListener('click', () => goTo(active + 1));
thumbnails.forEach((button, index) => button.addEventListener('click', () => goTo(index)));

// Native touch scrolling preserves vertical page scrolling and pinch-to-zoom.
// Mouse users can also pick up and drag the prints.
let drag: { id: number; x: number; y: number; scroll: number; moved: boolean } | undefined;
let suppressClick = false;
stage.addEventListener('pointerdown', (event) => {
  navigating = false;
  clearTimeout(navigationTimer);
  suppressClick = false;
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: stage.scrollLeft, moved: false };
});
stage.addEventListener('pointermove', (event) => {
  if (!drag || drag.id !== event.pointerId) return;
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

slots.forEach((slot) => {
  const index = Number(slot.dataset.photoIndex);
  const button = slot.querySelector<HTMLButtonElement>('button')!;
  button.addEventListener('click', () => {
    if (active !== index) { goTo(index); return; }
    enlarged.src = memories[index].photo;
    enlarged.alt = memories[index].alt;
    dialog.showModal();
  });
  button.addEventListener('focus', () => {
    if (button.matches(':focus-visible') && active !== index) goTo(index);
  });
});
document.querySelector('.dialog-close')!.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
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
    button.addEventListener('click', () => {
      const memory = memories[index];
      const option = button.dataset.option!;
      question.querySelectorAll('.is-retry').forEach((retry) => retry.classList.remove('is-retry'));
      if (!accepted(memory, option)) {
        button.classList.add('is-retry');
        status.textContent = 'Give it another try.';
        if (!reducedMotion.matches) button.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 });
        return;
      }
      const changed = answers[memory.id] !== option;
      answers[memory.id] = option;
      save();
      renderAnswers();
      const count = Object.keys(answers).length;
      status.textContent = count === memories.length ? 'All memories answered. Happy birthday, Justyna!' : `${memory.correctOption ? 'That’s right.' : 'Answer saved.'} ${count} of ${memories.length} questions answered.`;
      if (changed) burstFrom(button);
    });
  });
});

const love = document.querySelector<HTMLButtonElement>('[data-love]')!;
let loveTimer: ReturnType<typeof setTimeout>;
love.addEventListener('click', () => {
  clearTimeout(loveTimer);
  love.classList.add('is-loved');
  burstFrom(love, 9);
  loveTimer = setTimeout(() => love.classList.remove('is-loved'), 1200);
});
reset.addEventListener('click', () => {
  answers = {};
  save();
  questions.forEach((question) => question.querySelectorAll('.is-retry').forEach((button) => button.classList.remove('is-retry')));
  renderAnswers();
  goTo(0);
  questions[0].querySelector<HTMLButtonElement>('.answer')!.focus({ preventScroll: true });
  status.textContent = 'Ready to start again.';
});

let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => goTo(active, false), 100);
});
renderAnswers();
goTo(0, false);
