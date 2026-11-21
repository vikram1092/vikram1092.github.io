type Gesture = {
  x: number;
  y: number;
  steering: number;
  axis: 'pending' | 'horizontal' | 'vertical';
  flipped: boolean;
};

// Touch input stays separate from the keyboard, including each held finger.
export class TouchControls {
  enabled = false;
  private gestures = new Map<number, Gesture>();
  private brakePointers = new Set<number>();
  private brakeKeys = new Set<string>();

  constructor(
    private canvas: HTMLCanvasElement,
    private brakeButton: HTMLButtonElement,
    onInteract: () => void,
    onKickflip: () => void,
  ) {
    if (matchMedia('(pointer: coarse)').matches) this.enable();

    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      event.preventDefault();
      this.enable();
      this.gestures.set(event.pointerId, {
        x: event.clientX, y: event.clientY, steering: 0, axis: 'pending', flipped: false,
      });
      canvas.setPointerCapture(event.pointerId);
      onInteract();
    });
    canvas.addEventListener('pointermove', event => {
      const gesture = this.gestures.get(event.pointerId);
      if (!gesture) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (gesture.axis === 'pending' && Math.max(Math.abs(dx), Math.abs(dy)) >= 10) {
        gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
      if (gesture.axis === 'horizontal') {
        // Swipe, then hold to keep turning; lift to straighten. Short swipes
        // leave enough steering precision for the existing high-speed physics.
        gesture.steering = -Math.max(-1, Math.min(1, dx / 80));
      } else if (gesture.axis === 'vertical' && dy <= -40 && !gesture.flipped) {
        gesture.flipped = true;
        onKickflip();
      }
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      canvas.addEventListener(type, event => this.gestures.delete((event as PointerEvent).pointerId));
    }
    canvas.addEventListener('contextmenu', event => { if (this.enabled) event.preventDefault(); });

    brakeButton.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      this.brakePointers.add(event.pointerId);
      brakeButton.setPointerCapture(event.pointerId);
      this.updateBrake();
      onInteract();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      brakeButton.addEventListener(type, event => {
        this.brakePointers.delete((event as PointerEvent).pointerId);
        this.updateBrake();
      });
    }
    for (const type of ['keydown', 'keyup'] as const) {
      brakeButton.addEventListener(type, event => {
        if (event.code !== 'Space' && event.code !== 'Enter') return;
        event.preventDefault();
        event.stopPropagation();
        if (type === 'keydown') { this.brakeKeys.add(event.code); onInteract(); }
        else this.brakeKeys.delete(event.code);
        this.updateBrake();
      });
    }
    brakeButton.addEventListener('blur', () => { this.brakeKeys.clear(); this.updateBrake(); });
    brakeButton.addEventListener('contextmenu', event => event.preventDefault());
  }

  private enable() {
    if (this.enabled) return;
    this.enabled = true;
    document.body.dataset.touchControls = 'true';
    this.canvas.setAttribute('aria-label', 'Roadster night driving game. Auto accelerates. Hold to thrust, swipe left or right and hold to turn, swipe up to kickflip. Hold the bottom-left brake to stop.');
  }

  private updateBrake() {
    this.brakeButton.setAttribute('aria-pressed', String(this.braking));
  }

  get braking() { return this.brakePointers.size > 0 || this.brakeKeys.size > 0; }
  get boosting() { return this.gestures.size > 0 && !this.braking; }
  get steering() {
    let steering = 0;
    for (const gesture of this.gestures.values()) steering += gesture.steering;
    return Math.max(-1, Math.min(1, steering));
  }

  clear() {
    // Release captures too: an interrupted gesture must never resume on focus.
    const canvasPointers = [...this.gestures.keys()], brakePointers = [...this.brakePointers];
    this.gestures.clear();
    this.brakePointers.clear();
    this.brakeKeys.clear();
    for (const id of canvasPointers) if (this.canvas.hasPointerCapture(id)) this.canvas.releasePointerCapture(id);
    for (const id of brakePointers) if (this.brakeButton.hasPointerCapture(id)) this.brakeButton.releasePointerCapture(id);
    this.updateBrake();
  }
}
