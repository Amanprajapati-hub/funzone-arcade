/**
 * FunZone Arcade - Responsive Virtual Joystick
 * Smooth, multi-touch touchstart/touchmove/touchend analog controller.
 */
class VirtualJoystick {
  constructor(baseEl, knobEl, options = {}) {
    this.base = baseEl;
    this.knob = knobEl;
    this.maxRadius = options.maxRadius || 42;
    this.deadzone = options.deadzone || 0.16;
    this.onMove = options.onMove || (() => {});
    this.onEnd = options.onEnd || (() => {});

    this.touchId = null;
    this.isActive = false;
    this.centerX = 0;
    this.centerY = 0;

    this.currentDirections = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.bindEvents();
  }

  bindEvents() {
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);

    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);

    // Touch events on base
    this.base.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    window.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    window.addEventListener('touchcancel', this.boundTouchEnd, { passive: false });

    // Mouse support for responsive testing
    this.base.addEventListener('mousedown', this.boundMouseDown);
    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);
  }

  updateCenter() {
    const rect = this.base.getBoundingClientRect();
    this.centerX = rect.left + rect.width / 2;
    this.centerY = rect.top + rect.height / 2;
  }

  onTouchStart(e) {
    if (this.isActive) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    e.preventDefault();
    e.stopPropagation();

    const touch = e.changedTouches[0];
    this.touchId = touch.identifier;
    this.isActive = true;
    this.updateCenter();
    this.knob.classList.add('active');
    this.processPosition(touch.clientX, touch.clientY);
  }

  onTouchMove(e) {
    if (!this.isActive || this.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.touchId) {
        e.preventDefault();
        e.stopPropagation();
        this.processPosition(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  onTouchEnd(e) {
    if (!this.isActive || this.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        e.preventDefault();
        e.stopPropagation();
        this.reset();
        break;
      }
    }
  }

  onMouseDown(e) {
    if (this.isActive) return;
    e.preventDefault();
    this.isActive = true;
    this.touchId = 'mouse';
    this.updateCenter();
    this.knob.classList.add('active');
    this.processPosition(e.clientX, e.clientY);
  }

  onMouseMove(e) {
    if (!this.isActive || this.touchId !== 'mouse') return;
    e.preventDefault();
    this.processPosition(e.clientX, e.clientY);
  }

  onMouseUp(e) {
    if (!this.isActive || this.touchId !== 'mouse') return;
    this.reset();
  }

  processPosition(clientX, clientY) {
    const dx = clientX - this.centerX;
    const dy = clientY - this.centerY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, this.maxRadius);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    // Smooth transform
    this.knob.style.transform = `translate(calc(-50% + ${knobX.toFixed(1)}px), calc(-50% + ${knobY.toFixed(1)}px))`;

    const power = clampedDist / this.maxRadius;
    let vx = 0;
    let vy = 0;
    let left = false;
    let right = false;
    let up = false;
    let down = false;

    if (power >= this.deadzone) {
      vx = (knobX / this.maxRadius);
      vy = (knobY / this.maxRadius);

      const threshold = 0.32;
      left = vx < -threshold;
      right = vx > threshold;
      up = vy < -threshold;
      down = vy > threshold;
    }

    this.currentDirections = { left, right, up, down };

    this.onMove({
      vx,
      vy,
      angle,
      power,
      left,
      right,
      up,
      down
    });
  }

  reset() {
    this.isActive = false;
    this.touchId = null;
    this.knob.classList.remove('active');
    this.knob.style.transform = 'translate(-50%, -50%)';

    this.currentDirections = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.onEnd();
  }

  destroy() {
    this.reset();
    if (this.base) {
      this.base.removeEventListener('touchstart', this.boundTouchStart);
      this.base.removeEventListener('mousedown', this.boundMouseDown);
    }
    window.removeEventListener('touchmove', this.boundTouchMove);
    window.removeEventListener('touchend', this.boundTouchEnd);
    window.removeEventListener('touchcancel', this.boundTouchEnd);
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);
  }
}

window.VirtualJoystick = VirtualJoystick;
