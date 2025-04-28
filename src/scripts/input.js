/** 
 * Manages mouse and keyboard input
 */
export class InputManager {
  /**
   * Last mouse position
   * @type {x: number, y: number}
   */
  mouse = { x: 0, y: 0 };
  /**
   * True if left mouse button is currently down
   * @type {boolean}
   */
  isLeftMouseDown = false;
  /**
   * True if the middle mouse button is currently down
   * @type {boolean}
   */
  isMiddleMouseDown = false;
  /**
   * True if the right mouse button is currently down
   * @type {boolean}
   */
  isRightMouseDown = false;

  constructor() {
    window.ui.gameWindow.addEventListener('mousedown', this.#onMouseDown.bind(this), false);
    window.ui.gameWindow.addEventListener('mouseup', this.#onMouseUp.bind(this), false);
    window.ui.gameWindow.addEventListener('mousemove', this.#onMouseMove.bind(this), false);
    window.ui.gameWindow.addEventListener('contextmenu', (event) => event.preventDefault(), false);

    // Touch events
    window.ui.gameWindow.addEventListener('touchstart', this.#onTouchStart.bind(this), false);
    window.ui.gameWindow.addEventListener('touchmove', this.#onTouchMove.bind(this), false);
    window.ui.gameWindow.addEventListener('touchend', this.#onTouchEnd.bind(this), false);
  }

  /**
   * Event handler for `mousedown` event
   * @param {MouseEvent} event 
   */
  #onMouseDown(event) {
    if (event.button === 0) {
      this.isLeftMouseDown = true;
    }
    if (event.button === 1) {
      this.isMiddleMouseDown = true;
    }
    if (event.button === 2) {
      this.isRightMouseDown = true;
    }
  }

  /**
   * Event handler for `mouseup` event
   * @param {MouseEvent} event 
   */
  #onMouseUp(event) {
    if (event.button === 0) {
      this.isLeftMouseDown = false;
    }
    if (event.button === 1) {
      this.isMiddleMouseDown = false;
    }
    if (event.button === 2) {
      this.isRightMouseDown = false;
    }
  }

  /**
   * Event handler for 'mousemove' event
   * @param {MouseEvent} event 
   */
  #onMouseMove(event) {
    this.isLeftMouseDown = event.buttons & 1;
    this.isRightMouseDown = event.buttons & 2;
    this.isMiddleMouseDown = event.buttons & 4;
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  #onTouchStart(event) {
    if (window.ui.navMode) {
      // Modo navegação: 1 dedo = rotate, 2 dedos = pan/zoom
      if (event.touches.length === 1) {
        this.isLeftMouseDown = false;
        this.isRightMouseDown = true; // rotate
        this.mouse.x = event.touches[0].clientX;
        this.mouse.y = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        this.isLeftMouseDown = false;
        this.isRightMouseDown = true; // pan/zoom
        this._touchStartDist = this.#getTouchDistance(event);
        this._touchStartMid = this.#getTouchMidpoint(event);
      }
    } else {
      // Modo seleção: 1 dedo = clique
      if (event.touches.length === 1) {
        this.isLeftMouseDown = true;
        this.isRightMouseDown = false;
        this.mouse.x = event.touches[0].clientX;
        this.mouse.y = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        this.isLeftMouseDown = false;
        this.isRightMouseDown = true;
        this._touchStartDist = this.#getTouchDistance(event);
        this._touchStartMid = this.#getTouchMidpoint(event);
      }
    }
  }

  #onTouchMove(event) {
    if (window.ui.navMode) {
      if (event.touches.length === 1) {
        // rotate
        this.mouse.x = event.touches[0].clientX;
        this.mouse.y = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        // pan/zoom
        const mid = this.#getTouchMidpoint(event);
        this.mouse.x = mid.x;
        this.mouse.y = mid.y;
        const dist = this.#getTouchDistance(event);
        this._touchDeltaDist = dist - (this._touchStartDist || dist);
      }
    } else {
      if (event.touches.length === 1) {
        this.mouse.x = event.touches[0].clientX;
        this.mouse.y = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        const mid = this.#getTouchMidpoint(event);
        this.mouse.x = mid.x;
        this.mouse.y = mid.y;
        const dist = this.#getTouchDistance(event);
        this._touchDeltaDist = dist - (this._touchStartDist || dist);
      }
    }
  }

  #onTouchEnd(event) {
    if (event.touches.length === 0) {
      this.isLeftMouseDown = false;
      this.isRightMouseDown = false;
    } else if (event.touches.length === 1) {
      if (window.ui.navMode) {
        this.isLeftMouseDown = false;
        this.isRightMouseDown = true;
      } else {
        this.isLeftMouseDown = true;
        this.isRightMouseDown = false;
      }
    }
  }

  #getTouchDistance(event) {
    if (event.touches.length < 2) return 0;
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  #getTouchMidpoint(event) {
    if (event.touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
      y: (event.touches[0].clientY + event.touches[1].clientY) / 2
    };
  }
}