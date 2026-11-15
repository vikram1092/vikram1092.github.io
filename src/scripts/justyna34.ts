import type { BirthdayMemory } from '../data/justyna34';

const root = document.querySelector<HTMLElement>('#birthday')!;
const memories: BirthdayMemory[] = JSON.parse(document.querySelector('#birthday-data')!.textContent!);
const stage = document.querySelector<HTMLElement>('#photo-stage')!;
const album = document.querySelector<HTMLElement>('.album')!;
const intro = document.querySelector<HTMLElement>('.birthday-heading')!;
const introNext = document.querySelector<HTMLButtonElement>('.intro-next')!;
const slots = Array.from(document.querySelectorAll<HTMLElement>('[data-photo-index]'));
const questionCount = memories.filter((memory) => memory.options.length > 0).length;
const questions = Array.from(document.querySelectorAll<HTMLElement>('[data-question-index]'));
const status = document.querySelector<HTMLElement>('#birthday-status')!;
const dialog = document.querySelector<HTMLDialogElement>('.photo-dialog')!;
const enlarged = document.querySelector<HTMLImageElement>('#enlarged-photo')!;
const enlargedVideo = document.querySelector<HTMLVideoElement>('#enlarged-video')!;
const albumVideos = Array.from(stage.querySelectorAll<HTMLVideoElement>('video'));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const storageKey = `justyna34:${root.dataset.revision}`;
const runningAnimations = new Set<Animation>();
let active = 0;
let started = false;
let stageVisible = true;
let resumeDialogVideo = false;
let answers: Record<string, string> = {};
let questionAnimations: Animation[] = [];
let scrollFrame = 0;
let navigating = false;
let resizing = false;
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
function validOption(memory: BirthdayMemory, option: string) {
  return memory.options.some(({ id }) => id === option);
}
// Optional persistence: private browsing and disabled storage remain usable.
try {
  const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}');
  if (saved && typeof saved === 'object') {
    for (const memory of memories) {
      const option = (saved as Record<string, unknown>)[memory.id];
      if (typeof option === 'string' && validOption(memory, option)) answers[memory.id] = option;
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
  root.classList.toggle('is-complete', questionCount > 0 && Object.keys(answers).length === questionCount);
}

function playSilently(video: HTMLVideoElement) {
  video.muted = true;
  void video.play().catch(() => { /* A tap opens native playback controls if autoplay is unavailable. */ });
}
function videoIsVisible(video: HTMLVideoElement) {
  // Read the current clipped rectangle: a fast swipe or a track-height change
  // can reach a video before IntersectionObserver delivers its next entry.
  const bounds = video.getBoundingClientRect();
  const track = stage.getBoundingClientRect();
  const width = Math.max(0, Math.min(bounds.right, track.right, innerWidth) - Math.max(bounds.left, track.left, 0));
  const height = Math.max(0, Math.min(bounds.bottom, track.bottom, innerHeight) - Math.max(bounds.top, track.top, 0));
  return bounds.width * bounds.height > 0 && width * height >= bounds.width * bounds.height * .05;
}
function syncPlayback() {
  albumVideos.forEach((video) => {
    const slot = video.closest<HTMLElement>('.photo-slot')!;
    const shouldPlay = started && !document.hidden && !dialog.open && Number(slot.dataset.photoIndex) === active && videoIsVisible(video);
    if (shouldPlay) {
      if (!video.getAttribute('src')) video.src = video.dataset.src!;
      if (video.paused) playSilently(video);
    } else video.pause();
  });
  if (document.hidden) {
    resumeDialogVideo = resumeDialogVideo || !enlargedVideo.paused;
    enlargedVideo.pause();
  } else if (dialog.open && !enlargedVideo.hidden && resumeDialogVideo) {
    resumeDialogVideo = false;
    playSilently(enlargedVideo);
  }
}

function fitPhotos() {
  const style = getComputedStyle(stage);
  const frame = parseFloat(getComputedStyle(slots[0].querySelector('button')!).borderTopWidth);
  const height = Math.max(1, stage.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - frame * 2);
  stage.style.setProperty('--photo-height', `${height}px`);
}

function select(index: number, announce = true) {
  if (index < 0 || index >= memories.length) return;
  const changed = active !== index;
  const direction = index > active ? 1 : -1;
  active = index;
  slots.forEach((slot) => {
    const i = Number(slot.dataset.photoIndex);
    slot.classList.toggle('is-current', i === index);
    const kind = memories[i].video ? 'video' : 'photo';
    slot.querySelector('button')!.setAttribute('aria-label', `${i === index ? 'Enlarge' : 'Show'} ${kind} ${i + 1}`);
  });
  questions.forEach((question, i) => { question.hidden = i !== index; });
  syncPlayback();
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
    if (announce) status.textContent = `${memories[index].video ? 'Video' : 'Photo'} ${index + 1} of ${memories.length}. ${memories[index].question}`;
  }
}
function centeredScroll(index: number) {
  return stage.scrollLeft + slots[index].getBoundingClientRect().left - stage.getBoundingClientRect().left - (stage.clientWidth - slots[index].clientWidth) / 2;
}
// Visual emphasis follows the actual scroll position, not the selected index.
// Selection, hover, and pointer presses must never compete over frame size.
function updatePhotoFocus() {
  const middle = stage.getBoundingClientRect().left + stage.clientWidth / 2;
  const boxes = slots.map((slot) => slot.getBoundingClientRect());
  slots.forEach((slot, index) => {
    const center = boxes[index].left + boxes[index].width / 2;
    // Portrait and landscape frames have different widths. Use the neighboring
    // center in the direction of travel, keeping emphasis continuous for both.
    const neighbor = boxes[index + (center < middle ? 1 : -1)];
    const stride = neighbor ? Math.abs(neighbor.left + neighbor.width / 2 - center) : boxes[index].width;
    const distance = Math.min(1, Math.abs(center - middle) / Math.max(1, stride));
    const focus = (1 + Math.cos(Math.PI * distance)) / 2;
    slot.style.setProperty('--photo-focus', focus.toFixed(5));
  });
}
function goTo(index: number, smooth = true) {
  cancelAdvance();
  index = Math.max(0, Math.min(memories.length - 1, index));
  clearTimeout(navigationTimer);
  navigating = true;
  select(index);
  stage.scrollTo({ left: centeredScroll(index), behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
  updatePhotoFocus();
  syncPlayback();
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
  if (scrollFrame) return;
  if (!navigating) cancelAdvance();
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updatePhotoFocus();
    if (!navigating) select(Number(closestSlot().dataset.photoIndex));
    else syncPlayback();
  });
}, { passive: true });
function settleScroll() {
  if (resizing) return;
  navigating = false;
  const closest = closestSlot();
  select(Number(closest.dataset.photoIndex));
  updatePhotoFocus();
}
stage.addEventListener('scrollend', settleScroll);
let settleTimer: ReturnType<typeof setTimeout>;
stage.addEventListener('scroll', () => {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settleScroll, 180);
}, { passive: true });

// Native touch scrolling preserves horizontal swipes and pinch-to-zoom.
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
    goTo(Number(nearest.dataset.photoIndex));
  }
}
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
stage.addEventListener('click', (event) => {
  if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
}, true);

// Pointer and touch feedback stays in the light overlay, leaving the frame's
// position-based scale untouched as it crosses under the pointer.
slots.forEach((slot) => {
  const button = slot.querySelector<HTMLButtonElement>('button')!;
  const index = Number(slot.dataset.photoIndex);
  let pointerFrame = 0;
  let lightTimer: ReturnType<typeof setTimeout>;
  function neutral() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
  }
  button.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || !finePointer.matches || drag?.moved || active !== index || event.buttons) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const bounds = slot.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
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
  return `translate(${x}px, ${y}px) scale(${source.width / target.width}, ${source.height / target.height})`;
}
async function openPhoto(button: HTMLButtonElement, index: number) {
  if (opening || dialog.open) return;
  opening = true;
  const memory = memories[index];
  const video = button.querySelector('video');
  dialog.dataset.frame = button.dataset.frame;
  enlarged.hidden = !!memory.video;
  enlargedVideo.hidden = !memory.video;
  dialog.style.setProperty('--media-ratio', String(memory.width / memory.height));
  dialog.setAttribute('aria-label', `Enlarged birthday ${memory.video ? 'video' : 'photo'}`);
  document.querySelector('.dialog-close')!.setAttribute('aria-label', `Close enlarged ${memory.video ? 'video' : 'photo'}`);
  if (memory.video) {
    enlargedVideo.src = memory.video;
    enlargedVideo.poster = memory.photo;
    enlargedVideo.width = memory.width;
    enlargedVideo.height = memory.height;
    enlargedVideo.setAttribute('aria-label', memory.alt);
    const time = video?.currentTime ?? 0;
    enlargedVideo.addEventListener('loadedmetadata', () => { enlargedVideo.currentTime = time; }, { once: true });
  } else {
    enlarged.src = memory.photo;
    enlarged.alt = memory.alt;
    enlarged.width = memory.width;
    enlarged.height = memory.height;
    try { await enlarged.decode(); } catch { /* Keep alt text available on failure. */ }
  }
  opening = false;
  if (active !== index) return;
  // Hold the source still while the modal is borrowing its visible position.
  button.closest('.photo-slot')!.classList.add('is-expanded');
  const sourceBounds = button.getBoundingClientRect();
  photoSource = button;
  dialog.showModal();
  syncPlayback();
  if (memory.video) playSilently(enlargedVideo);
  const targetBounds = dialog.getBoundingClientRect();
  dialogAnimation = animate(dialog, [
    { transform: photoTransform(sourceBounds, targetBounds), opacity: .3 },
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
  ], { duration: 750, easing: 'cubic-bezier(.22, 1, .36, 1)' });
}
async function closePhoto() {
  if (!dialog.open || closing) return;
  closing = true;
  enlargedVideo.pause();
  resumeDialogVideo = false;
  const sourceVideo = photoSource?.querySelector('video');
  if (sourceVideo && Number.isFinite(enlargedVideo.currentTime)) sourceVideo.currentTime = enlargedVideo.currentTime;
  // Escape can arrive mid-opening. Start the return from the currently drawn
  // frame, rather than snapping to the fully enlarged rectangle first.
  const currentTransform = getComputedStyle(dialog).transform;
  const currentOpacity = getComputedStyle(dialog).opacity;
  dialogAnimation?.cancel();
  dialog.classList.add('is-closing');
  if (photoSource) {
    const destination = photoSource.getBoundingClientRect();
    dialogAnimation = animate(dialog, [
      { transform: currentTransform, opacity: currentOpacity },
      { transform: photoTransform(destination, dialog.getBoundingClientRect()), opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' });
    await dialogAnimation?.finished.catch(() => undefined);
  }
  dialog.close();
  dialogAnimation?.cancel();
  dialog.classList.remove('is-closing');
  photoSource?.closest('.photo-slot')!.classList.remove('is-expanded');
  closing = false;
  syncPlayback();
}
document.querySelector('.dialog-close')!.addEventListener('click', () => void closePhoto());
dialog.addEventListener('cancel', (event) => { event.preventDefault(); void closePhoto(); });
dialog.addEventListener('click', (event) => { if (event.target === dialog) void closePhoto(); });
function focusMemory(index: number) {
  const target = questions[index].querySelector<HTMLButtonElement>('.answer') ?? slots[index].querySelector<HTMLButtonElement>('.photo-surface')!;
  target.focus({ preventScroll: true });
}
document.addEventListener('keydown', (event) => {
  if (!started || dialog.open || event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const focusedAnswer = document.activeElement?.closest('.answers');
  event.preventDefault();
  goTo(active + (event.key === 'ArrowRight' ? 1 : -1));
  if (focusedAnswer) focusMemory(active);
});

questions.forEach((question, index) => {
  question.querySelectorAll<HTMLButtonElement>('.answer').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (!started || active !== index || dialog.open) return;
      cancelAdvance();
      const memory = memories[index];
      const option = button.dataset.option!;
      if (!validOption(memory, option)) return;
      const changed = answers[memory.id] !== option;
      answers[memory.id] = option;
      save();
      renderAnswers();
      const count = Object.keys(answers).length;
      status.textContent = count === questionCount ? 'All questions answered. Happy birthday, Justyna!' : `Answer saved. ${count} of ${questionCount} questions answered.`;
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
        if (count === questionCount) {
          document.querySelectorAll('.ambient-light').forEach((light) => {
            animate(light, [{ opacity: 1 }, { opacity: .15, offset: .35 }, { opacity: 1 }], { duration: 2200, easing: 'ease-in-out' });
          });
        }
      }
      // Briefly show the selection, then advance on every tap, including repeats.
      // Any manual navigation, enlargement, or hidden tab cancels this move.
      if (index < memories.length - 1) {
        advanceTimer = setTimeout(() => {
          if (active !== index || dialog.open || document.hidden) return;
          const next = index + 1;
          const focusAnswer = question.contains(document.activeElement);
          goTo(next);
          if (focusAnswer) focusMemory(next);
        }, 250);
      }
    });
  });
});

function syncMotion() {
  document.body.classList.toggle('motion-paused', document.hidden || (started && !stageVisible));
  syncPlayback();
}
new IntersectionObserver(([entry]) => { stageVisible = entry.isIntersecting; syncMotion(); }).observe(stage);
const videoVisibility = new IntersectionObserver(syncPlayback, { threshold: [0, .05] });
albumVideos.forEach((video) => videoVisibility.observe(video));
window.addEventListener('scroll', syncPlayback, { passive: true });
document.addEventListener('visibilitychange', () => { cancelAdvance(); syncMotion(); });
reducedMotion.addEventListener('change', () => {
  if (!reducedMotion.matches) return;
  runningAnimations.forEach((animation) => animation.cancel());
  document.querySelectorAll('.answer-ripple').forEach((ripple) => ripple.remove());
});
let resizeFrame = 0;
function resizeAlbum() {
  // Layout itself can emit scroll events. Keep the user's photo selected while
  // the carousel adapts, then center that same photo at the new width.
  navigating = true;
  resizing = true;
  cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
  clearTimeout(settleTimer);
  clearTimeout(navigationTimer);
  cancelAnimationFrame(resizeFrame);
  fitPhotos();
  goTo(active, false);
  resizeFrame = requestAnimationFrame(() => {
    goTo(active, false);
    resizing = false;
  });
}
window.addEventListener('resize', resizeAlbum);
new ResizeObserver(resizeAlbum).observe(stage);
introNext.addEventListener('click', () => {
  if (started) return;
  started = true;
  root.classList.add('is-started');
  intro.inert = true;
  album.inert = false;
  goTo(0, false);
  slots[0].querySelector<HTMLButtonElement>('button')!.focus({ preventScroll: true });
  status.textContent = `Photo 1 of ${memories.length}. ${memories[0].question}`;
  syncMotion();
});
renderAnswers();
fitPhotos();
goTo(0, false);

// Align the visible ink, rather than the unequal line boxes of the large
// italic numerals and small words. Recalculate after the local font loads.
const heading = document.querySelector<HTMLElement>('.birthday-heading h1')!;
const age = heading.querySelector<HTMLElement>('.title-age')!;
const textMeasure = document.createElement('canvas').getContext('2d');
function centerAge() {
  if (!textMeasure) return;
  function inkOffset(element: HTMLElement) {
    const style = getComputedStyle(element);
    textMeasure!.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const metrics = textMeasure!.measureText(element.textContent!.trim());
    return (metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent + metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2;
  }
  const wordOffset = (inkOffset(heading.querySelector<HTMLElement>('.title-happy')!) + inkOffset(heading.querySelector<HTMLElement>('.title-birthday')!)) / 2;
  const offset = wordOffset - inkOffset(age);
  if (Number.isFinite(offset)) age.style.setProperty('--age-offset', `${offset.toFixed(2)}px`);
}
document.fonts.ready.then(centerAge);
new ResizeObserver(centerAge).observe(heading);

// The album stays usable while the optional 3D scene loads. Reduced-motion
// visitors start with the static, matching SVG illustration and no WebGL.
const balloons = document.querySelector<HTMLElement>('#birthday-balloons')!;
let loadingBalloons = false;
async function startBalloons() {
  if (reducedMotion.matches || loadingBalloons) return;
  loadingBalloons = true;
  try {
    const { mountBalloons } = await import('./justyna34-balloons');
    if (!reducedMotion.matches) mountBalloons(balloons);
    else loadingBalloons = false;
  } catch {
    balloons.dataset.renderer = 'fallback';
  }
}
balloons.dataset.renderer = 'fallback';
reducedMotion.addEventListener('change', startBalloons);
startBalloons();
