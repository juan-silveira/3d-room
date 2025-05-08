import { Game } from './game';
import { Object } from './sim/object';
import { Pot } from './sim/buildings/objects/pot.js';
import { Tray } from './sim/buildings/objects/tray.js';

// Add this global function for the HTML onclick event
window.togglePotInputs = function() {
  const roundInputs = document.getElementById('round-pot-inputs');
  const squareInputs = document.getElementById('square-pot-inputs');
  const isRound = document.getElementById('pot-shape-round').checked;
  
  if (isRound) {
    roundInputs.style.display = 'block';
    squareInputs.style.display = 'none';
  } else {
    roundInputs.style.display = 'none';
    squareInputs.style.display = 'block';
  }
};

export class GameUI {
  /**
   * Currently selected tool
   * @type {string}
   */
  activeToolId = 'select';
  /**
   * @type {HTMLElement | null }
   */
  selectedControl = document.getElementById('button-select');
  /**
   * True if the game is currently paused
   * @type {boolean}
   */
  isPaused = false;
  /**
   * Modo de navegação para mobile
   * @type {boolean}
   */
  navMode = false;
  /**
   * Current device orientation
   * @type {string}
   */
  deviceOrientation = 'portrait';
  /**
   * True if the mobile toolbar is open
   * @type {boolean}
   */
  mobileToolbarOpen = false;

  constructor() {
    // Detecta se é mobile/touch
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      const navBtn = document.getElementById('button-nav-mode');
      navBtn.style.display = '';
      navBtn.classList.add('selected');
      this.navMode = true;
      // Desmarca o botão de seleção
      document.getElementById('button-select').classList.remove('selected');
      
    }
    
    // Setup orientation detection
    this.detectOrientation();
    window.addEventListener('resize', () => this.detectOrientation());
    
    // Setup instructions modal events
    this.setupModalEvents();
    
    // Setup configuration modal events
    this.setupConfigModals();
    
    // Initialize instructions content
    this.updateInstructionsContent();
    
    // Setup navigation controls
    this.setupNavigationControls();
  }
  
  /**
   * Sets up modal event handlers
   */
  setupModalEvents() {
    // Get modal element
    const instructionsModal = document.getElementById('instructionsModal');
    if (instructionsModal) {
      // When modal is hidden, refocus on the game
      instructionsModal.addEventListener('hidden.bs.modal', () => {
        // Focus back on the render target to ensure keyboard and mouse events work properly
        document.getElementById('render-target').focus();
      });
      
      // When modal is shown, update the instructions based on device type
      instructionsModal.addEventListener('show.bs.modal', () => {
        this.updateInstructionsContent();
      });
    }
    
    // Setup for all configuration modals
    const configModals = document.querySelectorAll('.modal');
    configModals.forEach(modal => {
      modal.addEventListener('hidden.bs.modal', () => {
        document.getElementById('render-target').focus();
      });
    });
  }
  
  /**
   * Updates the instructions content based on device type
   */
  updateInstructionsContent() {
    const isMobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const instructionsContent = document.querySelector('.instructions-content');
    
    if (!instructionsContent) return;
    
    if (isMobile) {
      // Mobile instructions
      instructionsContent.innerHTML = `
        <div class="instruction-item">
          <div class="instruction-label">INTERACT</div>
          <div class="instruction-value">TOUCH</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">NAVIGATION</div>
          <div class="instruction-value">HAND TOOL</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">ROTATE</div>
          <div class="instruction-value">ANALOG STICK</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">PAN</div>
          <div class="instruction-value">DIRECTION BUTTONS</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">ZOOM</div>
          <div class="instruction-value">+/- BUTTONS</div>
        </div>
      `;
    } else {
      // Desktop instructions
      instructionsContent.innerHTML = `
        <div class="instruction-item">
          <div class="instruction-label">INTERACT</div>
          <div class="instruction-value">Left Mouse</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">NAVIGATION</div>
          <div class="instruction-value">Hand Tool / Right Mouse</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">ROTATE</div>
          <div class="instruction-value">Right Mouse / Analog Stick</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">PAN</div>
          <div class="instruction-value">Control + Right Mouse / Direction Buttons</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">ZOOM</div>
          <div class="instruction-value">Scroll / +/- Buttons</div>
        </div>
      `;
    }
  }
  
  /**
   * Sets up configuration modal event handlers
   */
  setupConfigModals() {
    // Pot shape toggle
    const roundRadio = document.getElementById('modal-pot-shape-round');
    const squareRadio = document.getElementById('modal-pot-shape-square');
    
    if (roundRadio && squareRadio) {
      roundRadio.addEventListener('change', this.toggleModalPotInputs);
      squareRadio.addEventListener('change', this.toggleModalPotInputs);
    }
  }
  
  /**
   * Toggle between round and square pot inputs in the modal
   */
  toggleModalPotInputs() {
    const roundInputs = document.getElementById('modal-round-pot-inputs');
    const squareInputs = document.getElementById('modal-square-pot-inputs');
    const isRound = document.getElementById('modal-pot-shape-round').checked;
    
    if (isRound) {
      roundInputs.style.display = 'block';
      squareInputs.style.display = 'none';
    } else {
      roundInputs.style.display = 'none';
      squareInputs.style.display = 'block';
    }
  }
  
  /**
   * Handle click on a configuration tool button
   * @param {string} toolType - Type of tool (pot, tray, door)
   */
  onConfigToolClicked(toolType) {
    // Show the appropriate configuration modal
    if (toolType === 'pot') {
      const modal = new bootstrap.Modal(document.getElementById('potConfigModal'));
      modal.show();
    } else if (toolType === 'tray') {
      const modal = new bootstrap.Modal(document.getElementById('trayConfigModal'));
      modal.show();
    } else if (toolType === 'door') {
      const modal = new bootstrap.Modal(document.getElementById('doorConfigModal'));
      modal.show();
    }
  }
  
  /**
   * Apply pot configuration and select the pot tool
   */
  applyPotConfig() {
    // Hide the modal
    const modalElement = document.getElementById('potConfigModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();
    
    // Select the pot tool
    const potButton = document.getElementById('button-pot');
    this.activeToolId = 'pot';
    
    // Update tool selection visually
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    this.selectedControl = potButton;
    this.selectedControl.classList.add('selected');
    
    // Update all related buttons to show selection
    const allButtons = document.querySelectorAll('[data-type="pot"]');
    allButtons.forEach(btn => {
      btn.classList.add('selected');
    });
  }
  
  /**
   * Apply tray configuration and select the tray tool
   */
  applyTrayConfig() {
    // Hide the modal
    const modalElement = document.getElementById('trayConfigModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();
    
    // Select the tray tool
    const trayButton = document.getElementById('button-tray');
    this.activeToolId = 'tray';
    
    // Update tool selection visually
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    this.selectedControl = trayButton;
    this.selectedControl.classList.add('selected');
    
    // Update all related buttons to show selection
    const allButtons = document.querySelectorAll('[data-type="tray"]');
    allButtons.forEach(btn => {
      btn.classList.add('selected');
    });
  }
  
  /**
   * Apply door configuration and select the door tool
   */
  applyDoorConfig() {
    // Hide the modal
    const modalElement = document.getElementById('doorConfigModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();
    
    // Select the door tool
    const doorButton = document.getElementById('button-double-door');
    this.activeToolId = 'double-door';
    
    // Update tool selection visually
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    this.selectedControl = doorButton;
    this.selectedControl.classList.add('selected');
    
    // Update all related buttons to show selection
    const allButtons = document.querySelectorAll('[data-type="double-door"]');
    allButtons.forEach(btn => {
      btn.classList.add('selected');
    });
  }
  
  /**
   * Populates the mobile toolbar with tools from the desktop toolbar
   */
  populateMobileToolbar() {
    const mobileToolbar = document.getElementById('mobile-toolbar');
    mobileToolbar.innerHTML = ''; // Clear existing content
    
    // Apply appropriate layout based on orientation
    mobileToolbar.className = this.deviceOrientation === 'landscape' 
      ? 'horizontal-layout' 
      : 'vertical-layout';
    
    // Get all buttons from the desktop toolbar
    const buttons = document.querySelectorAll('#ui-toolbar .ui-button');
    
    // Clone each button and add to mobile toolbar
    buttons.forEach(button => {
      const clone = button.cloneNode(true);
      clone.style.display = 'flex';
      clone.addEventListener('click', (event) => {
        // Use the same handler as desktop buttons
        this.onToolSelected(event);
        
      });
      mobileToolbar.appendChild(clone);
    });
    
    // Add configuration options if in portrait mode
    if (this.deviceOrientation === 'portrait') {
      // Simple config options for mobile
      const configSection = document.createElement('div');
      configSection.className = 'mobile-config-section';
      configSection.innerHTML = `
        <div style="margin-top: 10px; color: white; text-align: center;">Quick Settings</div>
        <div class="mobile-config-item">
          <span>Pot Shape:</span>
          <select id="mobile-pot-shape" class="form-select form-select-sm mt-1">
            <option value="round">Round</option>
            <option value="square">Square</option>
          </select>
        </div>
        <div class="mobile-config-item">
          <span>Tray Size:</span>
          <select id="mobile-tray-size" class="form-select form-select-sm mt-1">
            <option value="small">Small (2x2)</option>
            <option value="medium" selected>Medium (4x4)</option>
            <option value="large">Large (8x8)</option>
          </select>
        </div>
      `;
      mobileToolbar.appendChild(configSection);
      
      // Set up event listeners for mobile config
      setTimeout(() => {
        document.getElementById('mobile-pot-shape')?.addEventListener('change', (e) => {
          const isRound = e.target.value === 'round';
          document.getElementById('pot-shape-round').checked = isRound;
          document.getElementById('pot-shape-square').checked = !isRound;
          if (typeof window.togglePotInputs === 'function') {
            window.togglePotInputs();
          }
        });
        
        document.getElementById('mobile-tray-size')?.addEventListener('change', (e) => {
          const size = e.target.value;
          const widthInput = document.getElementById('tray-width');
          const lengthInput = document.getElementById('tray-length');
          
          if (size === 'small') {
            widthInput.value = 2;
            lengthInput.value = 2;
          } else if (size === 'medium') {
            widthInput.value = 4;
            lengthInput.value = 4;
          } else if (size === 'large') {
            widthInput.value = 8;
            lengthInput.value = 8;
          }
        });
      }, 0);
    }
  }
  
  /**
   * Detects the current device orientation
   */
  detectOrientation() {
    const isLandscape = window.innerWidth > window.innerHeight;
    this.deviceOrientation = isLandscape ? 'landscape' : 'portrait';
    
    // Update mobile toolbar layout if it's open
    if (this.mobileToolbarOpen) {
      this.populateMobileToolbar();
    }
  }

  get gameWindow() {
    return document.getElementById('render-target');
  }

  /**
   * Get the door width from the UI
   * @returns {number} Door width in tiles
   */
  getDoorWidth() {
    const widthInput = document.getElementById('modal-door-width');
    const width = parseInt(widthInput.value, 10);
    return isNaN(width) ? 4 : Math.max(3, Math.min(width, 8));
  }

  /**
   * Get pot configuration from the UI
   * @returns {Object} Pot configuration object
   */
  getPotConfig() {
    // Get pot shape
    const shapeRound = document.getElementById('modal-pot-shape-round');
    const shape = shapeRound.checked ? 'round' : 'square';
    
    // Get dimensions
    const height = parseFloat(document.getElementById('modal-pot-height').value);
    
    // Get shape-specific dimensions
    if (shape === 'round') {
      const topDiameter = parseFloat(document.getElementById('modal-pot-top-diameter').value);
      const bottomDiameter = parseFloat(document.getElementById('modal-pot-bottom-diameter').value);
      
      return {
        shape,
        height: isNaN(height) ? 0.3 : Math.max(0.1, Math.min(height, 0.5)),
        topDiameter: isNaN(topDiameter) ? 0.25 : Math.max(0.1, Math.min(topDiameter, 0.3)),
        bottomDiameter: isNaN(bottomDiameter) ? 0.2 : Math.max(0.1, Math.min(bottomDiameter, 0.3))
      };
    } else {
      const topSide = parseFloat(document.getElementById('modal-pot-top-side').value);
      const bottomSide = parseFloat(document.getElementById('modal-pot-bottom-side').value);
      
      return {
        shape,
        height: isNaN(height) ? 0.3 : Math.max(0.1, Math.min(height, 0.5)),
        topSide: isNaN(topSide) ? 0.3 : Math.max(0.1, Math.min(topSide, 0.5)),
        bottomSide: isNaN(bottomSide) ? 0.3 : Math.max(0.1, Math.min(bottomSide, 0.5))
      };
    }
  }

  /**
   * Get slab configuration from the UI
   * @returns {Object} Slab configuration object
   */
  getSlabConfig() {
    // Get dimensions
    const length = parseInt(document.getElementById('slab-length').value, 10);
    const height = parseFloat(document.getElementById('slab-height').value);
    
    return {
      length: isNaN(length) ? 1 : Math.max(1, Math.min(length, 5)),
      height: isNaN(height) ? 0.1 : Math.max(0.05, Math.min(height, 0.2))
    };
  }

  /**
   * Get tray configuration from the UI
   * @returns {Object} Tray configuration object
   */
  getTrayConfig() {
    // Get dimensions
    const width = parseInt(document.getElementById('modal-tray-width').value, 10);
    const length = parseInt(document.getElementById('modal-tray-length').value, 10);
    const legHeight = parseFloat(document.getElementById('modal-tray-leg-height').value);
    const topThickness = parseFloat(document.getElementById('modal-tray-top-thickness').value);
    const edgeHeight = parseFloat(document.getElementById('modal-tray-edge-height').value);
    const edgeThickness = parseFloat(document.getElementById('modal-tray-edge-thickness').value);
    
    return {
      width: isNaN(width) ? 4 : Math.max(2, Math.min(width, 20)),
      length: isNaN(length) ? 4 : Math.max(2, Math.min(length, 100)),
      legHeight: isNaN(legHeight) ? 0.8 : Math.max(0.5, Math.min(legHeight, 1.5)),
      topThickness: isNaN(topThickness) ? 0.05 : Math.max(0.01, Math.min(topThickness, 0.1)),
      edgeHeight: isNaN(edgeHeight) ? 0.1 : Math.max(0.05, Math.min(edgeHeight, 0.2)),
      edgeThickness: isNaN(edgeThickness) ? 0.03 : Math.max(0.01, Math.min(edgeThickness, 0.05))
    };
  }

  /**
   * Updates the angle display in the title bar
   * @param {number} azimuth Azimuth angle in degrees
   * @param {number} elevation Elevation angle in degrees
   * @param {number} rotation Rotation angle in degrees
   */
  updateAngleDisplay(azimuth, elevation, rotation = 0) {
    try {
      // Round to 1 decimal place
      const aziEl = document.getElementById('angle-azimuth');
      const elevEl = document.getElementById('angle-elevation');
      // const rotEl = document.getElementById('angle-rotation');
      
      if (aziEl && elevEl) {
        aziEl.innerHTML = Math.round(azimuth) + '°';
        elevEl.innerHTML = Math.round(elevation) + '°';
        // rotEl.innerHTML = Math.round(rotation) + '°';
      }
    } catch (error) {
      console.warn('Error updating angle display:', error);
    }
  }

  showLoadingText() {
    document.getElementById('loading').style.visibility = 'visible';
  }

  hideLoadingText() {
    document.getElementById('loading').style.visibility = 'hidden';
  }
  
  /**
   * Sets up navigation control buttons
   */
  setupNavigationControls() {
    // Get navigation buttons
    const analogStick = document.getElementById('analog-stick');
    const analogKnob = document.getElementById('analog-knob');
    const upBtn = document.getElementById('up-button');
    const downBtn = document.getElementById('down-button');
    const leftBtn = document.getElementById('left-button');
    const rightBtn = document.getElementById('right-button');
    const zoomInBtn = document.getElementById('zoom-in-button');
    const zoomOutBtn = document.getElementById('zoom-out-button');
    
    // Common function to prevent default touch behavior
    const preventTouchDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Add event listeners for analog stick
    if (analogStick && analogKnob) {
      let isAnalogActive = false;
      let initialX = 0;
      let initialY = 0;
      
      // Mouse/Touch movement handling for analog stick
      const moveAnalog = (e) => {
        if (!isAnalogActive) return;
        
        let clientX, clientY;
        
        // Handle both mouse and touch events
        if (e.touches) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        
        const analogRect = analogStick.getBoundingClientRect();
        const centerX = analogRect.left + analogRect.width / 2;
        const centerY = analogRect.top + analogRect.height / 2;
        
        // Calculate distance from center
        let deltaX = clientX - centerX;
        let deltaY = clientY - centerY;
        
        // Limit to circular bounds
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = analogRect.width / 2 - analogKnob.offsetWidth / 2;
        
        if (distance > maxDistance) {
          const angle = Math.atan2(deltaY, deltaX);
          deltaX = Math.cos(angle) * maxDistance;
          deltaY = Math.sin(angle) * maxDistance;
        }
        
        // Update analog knob position
        analogKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
        
        // Apply camera rotation based on analog stick position
        if (window.game) {
          // Convert delta to rotation amounts
          const rotationX = deltaX / maxDistance; // -1 to 1
          const rotationY = deltaY / maxDistance; // -1 to 1
          
          // Apply camera rotation adjustments
          window.game.cameraManager.cameraAzimuth += -rotationX * 2; // Adjust sensitivity as needed
          window.game.cameraManager.cameraElevation += rotationY * 2;
          window.game.cameraManager.cameraElevation = Math.min(90, Math.max(0, window.game.cameraManager.cameraElevation));
          window.game.cameraManager.updateCameraPosition();
        }
      };
      
      // Start analog movement
      const startAnalog = (e) => {
        isAnalogActive = true;
        
        // Set initial position
        if (e.touches) {
          initialX = e.touches[0].clientX;
          initialY = e.touches[0].clientY;
        } else {
          initialX = e.clientX;
          initialY = e.clientY;
        }
        
        // Add movement listeners
        document.addEventListener('mousemove', moveAnalog);
        document.addEventListener('touchmove', moveAnalog, { passive: false });
        
        // Prevent default behavior
        if (e.preventDefault) {
          e.preventDefault();
        }
      };
      
      // End analog movement
      const endAnalog = () => {
        if (!isAnalogActive) return;
        
        isAnalogActive = false;
        
        // Reset analog knob position
        analogKnob.style.transform = 'translate(-50%, -50%)';
        
        // Remove movement listeners
        document.removeEventListener('mousemove', moveAnalog);
        document.removeEventListener('touchmove', moveAnalog);
      };
      
      // Add mouse event listeners
      analogStick.addEventListener('mousedown', startAnalog);
      document.addEventListener('mouseup', endAnalog);
      
      // Add touch event listeners
      analogStick.addEventListener('touchstart', startAnalog, { passive: false });
      document.addEventListener('touchend', endAnalog);
      document.addEventListener('touchcancel', endAnalog);
    }
    
    // Add event listeners for direction buttons (swapping up/down functionality)
    if (upBtn) {
      upBtn.addEventListener('click', () => {
        if (window.game) {
          window.game.cameraManager.moveCamera(0, -1); // Changed from 1 to -1
        }
      });
      
      upBtn.addEventListener('touchstart', (e) => {
        preventTouchDefault(e);
        if (window.game) {
          window.game.cameraManager.moveCamera(0, -1); // Changed from 1 to -1
        }
      }, { passive: false });
    }
    
    if (downBtn) {
      downBtn.addEventListener('click', () => {
        if (window.game) {
          window.game.cameraManager.moveCamera(0, 1); // Changed from -1 to 1
        }
      });
      
      downBtn.addEventListener('touchstart', (e) => {
        preventTouchDefault(e);
        if (window.game) {
          window.game.cameraManager.moveCamera(0, 1); // Changed from -1 to 1
        }
      }, { passive: false });
    }
    
    if (leftBtn) {
      leftBtn.addEventListener('click', () => {
        if (window.game) {
          window.game.cameraManager.moveCamera(-1, 0);
        }
      });
      
      leftBtn.addEventListener('touchstart', (e) => {
        preventTouchDefault(e);
        if (window.game) {
          window.game.cameraManager.moveCamera(-1, 0);
        }
      }, { passive: false });
    }
    
    if (rightBtn) {
      rightBtn.addEventListener('click', () => {
        if (window.game) {
          window.game.cameraManager.moveCamera(1, 0);
        }
      });
      
      rightBtn.addEventListener('touchstart', (e) => {
        preventTouchDefault(e);
        if (window.game) {
          window.game.cameraManager.moveCamera(1, 0);
        }
      }, { passive: false });
    }
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        if (window.game) {
          window.game.cameraManager.zoomCamera(-1);
        }
      });
      
      zoomInBtn.addEventListener('touchstart', (e) => {
        preventTouchDefault(e);
        if (window.game) {
          window.game.cameraManager.zoomCamera(-1);
        }
      }, { passive: false });
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        if (window.game) {
          window.game.cameraManager.zoomCamera(1);
        }
      });
      
      zoomOutBtn.addEventListener('touchstart', (e) => {
        preventTouchDefault(e);
        if (window.game) {
          window.game.cameraManager.zoomCamera(1);
        }
      }, { passive: false });
    }
  }
  
  /**
   * Shows the navigation controls
   */
  showNavigationControls() {
    const navControls = document.getElementById('nav-controls');
    const analogContainer = document.getElementById('analog-container');
    const directionContainer = document.getElementById('direction-container');
    const zoomContainer = document.getElementById('zoom-container');
    
    if (navControls) {
      navControls.style.display = 'block';
    }
    
    if (analogContainer) {
      analogContainer.style.display = 'block';
    }
    
    if (directionContainer) {
      directionContainer.style.display = 'block';
    }
    
    if (zoomContainer) {
      zoomContainer.style.display = 'block';
    }
  }
  
  /**
   * Hides the navigation controls
   */
  hideNavigationControls() {
    const navControls = document.getElementById('nav-controls');
    const analogContainer = document.getElementById('analog-container');
    const directionContainer = document.getElementById('direction-container');
    const zoomContainer = document.getElementById('zoom-container');
    
    if (navControls) {
      navControls.style.display = 'none';
    }
    
    if (analogContainer) {
      analogContainer.style.display = 'none';
    }
    
    if (directionContainer) {
      directionContainer.style.display = 'none';
    }
    
    if (zoomContainer) {
      zoomContainer.style.display = 'none';
    }
  }

  /**
   * 
   * @param {*} event 
   */
  onToolSelected(event) {
    // Deselect previously selected button and selected this one
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    
    // Get the button that was clicked (could be the image inside the button)
    this.selectedControl = event.target.closest('.ui-button') || event.target;
    this.selectedControl.classList.add('selected');

    this.activeToolId = this.selectedControl.getAttribute('data-type');
    
    // Update all related buttons (both desktop and mobile) to show selection
    const allButtons = document.querySelectorAll(`[data-type="${this.activeToolId}"]`);
    allButtons.forEach(btn => {
      btn.classList.add('selected');
    });
    
    // Hide navigation controls when any tool besides nav-mode is selected
    this.hideNavigationControls();
    
    // Se for mobile, alterna para modo seleção
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      this.navMode = false;
      document.getElementById('button-nav-mode').classList.remove('selected');
      
      // Find and select all 'select' buttons
      const selectButtons = document.querySelectorAll(`[data-type="select"]`);
      selectButtons.forEach(btn => {
        btn.classList.add('selected');
      });
      
      // Se selecionou a ferramenta 'select', verificar se há objeto selecionado
      // para mostrar o painel de informações
      if (this.activeToolId === 'select' && window.game && window.game.selectedObject) {
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
          infoPanel.style.visibility = 'visible';
        }
      }
    }
  }
  
  /**
   * Define uma ferramenta como ativa programaticamente
   * @param {string} toolId - ID da ferramenta a ser ativada ('select', 'trash', etc.)
   */
  setActiveTool(toolId) {
    // Verificar se a ferramenta existe
    const toolButton = document.querySelector(`[data-type="${toolId}"]`);
    if (!toolButton) {
      console.error(`Ferramenta ${toolId} não encontrada`);
      return;
    }
    
    // Desativar ferramenta anterior
    if (this.selectedControl) {
      this.selectedControl.classList.remove('selected');
    }
    
    // Atualizar a ferramenta ativa
    this.activeToolId = toolId;
    this.selectedControl = toolButton;
    this.selectedControl.classList.add('selected');
    
    // Atualizar todos os botões relacionados (desktop e mobile)
    const allButtons = document.querySelectorAll(`[data-type="${toolId}"]`);
    allButtons.forEach(btn => {
      btn.classList.add('selected');
    });
    
    // Hide navigation controls when any tool besides nav-mode is selected
    if (toolId !== 'nav-mode') {
      this.hideNavigationControls();
    } else {
      this.showNavigationControls();
    }
    
    // Se for mobile, desativar modo de navegação exceto se for a ferramenta de navegação
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      this.navMode = (toolId === 'nav-mode');
      
      // Desativar botão de modo de navegação se não for a ferramenta selecionada
      const navButton = document.getElementById('button-nav-mode');
      if (navButton) {
        if (toolId === 'nav-mode') {
          navButton.classList.add('selected');
        } else {
          navButton.classList.remove('selected');
        }
      }
      
      // Se estiver selecionando a ferramenta 'select', verificar se há objeto selecionado
      // para mostrar o painel de informações
      if (toolId === 'select' && window.game && window.game.selectedObject) {
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
          infoPanel.style.visibility = 'visible';
        }
      }
    }
    
    console.log(`Ferramenta alterada para: ${toolId}`);
  }

  /**
   * Updates the values in the title bar
   * @param {Game} game 
   */
  updateTitleBar(game) {
    document.getElementById('room-name').innerHTML = game.room.name;
    document.getElementById('population-counter').innerHTML = game.room.population;

    const date = new Date('1/1/2023');
    date.setDate(date.getDate() + game.room.simTime);
    document.getElementById('sim-time').innerHTML = date.toLocaleDateString();
    
    // Update angle display
    this.updateAngleDisplay(game.cameraManager.cameraAzimuth, game.cameraManager.cameraElevation);
  }

  /**
   * Configures a pot object based on UI settings
   * @param {Pot} pot The pot object to configure
   */
  configurePot(pot) {
    const config = this.getPotConfig();
    pot.shape = config.shape;
    pot.height = config.height;
    
    if (pot.shape === 'round') {
      pot.topDiameter = config.topDiameter;
      pot.bottomDiameter = config.bottomDiameter;
    } else {
      pot.topSide = config.topSide;
      pot.bottomSide = config.bottomSide;
    }
    
    pot.refreshView();
  }

  /**
   * Configures a slab object based on UI settings
   * @param {Slab} slab The slab object to configure
   */
  configureSlab(slab) {
    const config = this.getSlabConfig();
    slab.length = config.length;
    slab.height = config.height;
    slab.refreshView();
  }

  /**
   * Configures a tray object based on UI settings
   * @param {Tray} tray The tray object to configure
   */
  configureTray(tray) {
    const config = this.getTrayConfig();
    tray.width = config.width;
    tray.length = config.length;
    tray.legHeight = config.legHeight;
    tray.topThickness = config.topThickness;
    tray.edgeHeight = config.edgeHeight;
    tray.edgeThickness = config.edgeThickness;
    tray.initializeTiles(); // Recreate tiles grid with new dimensions
    tray.refreshView();
  }

  /**
   * Updates the info panel with the information in the object
   * @param {Object} object 
   */
  updateInfoPanel(object) {
    const infoElement = document.getElementById('info-panel')
    if (object) {
      infoElement.style.visibility = 'visible';
      infoElement.innerHTML = object.toHTML();
    } else {
      infoElement.style.visibility = 'hidden';
      infoElement.innerHTML = '';
    }
  }

  /**
   * Alterna o modo de navegação no mobile
   */
  onNavModeSelected(event) {
    this.navMode = true;
    document.getElementById('button-nav-mode').classList.add('selected');
    document.getElementById('button-select').classList.remove('selected');
    
    // Show navigation controls when nav mode is selected
    this.showNavigationControls();
    
    // Esconder o painel de informações quando entrar no modo de navegação
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.style.visibility = 'hidden';
    }
  }

}

window.ui = new GameUI();