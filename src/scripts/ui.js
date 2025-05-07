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
          <div class="instruction-label">ROTATE</div>
          <div class="instruction-value">ONE FINGER</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">PAN</div>
          <div class="instruction-value">TWO FINGERS</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">ZOOM</div>
          <div class="instruction-value">PINCH</div>
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
          <div class="instruction-label">ROTATE</div>
          <div class="instruction-value">Right Mouse</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">PAN</div>
          <div class="instruction-value">Control + Right Mouse</div>
        </div>
        <div class="instruction-item">
          <div class="instruction-label">ZOOM</div>
          <div class="instruction-value">Scroll</div>
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
   * Updates the camera angle display in the title bar
   * @param {number} azimuth Ângulo de azimuth em graus
   * @param {number} elevation Ângulo de elevação em graus
   * @param {number} rotation Ângulo de rotação em graus (opcional)
   */
  updateAngleDisplay(azimuth, elevation, rotation = 0) {
    // Normalize angles to 0-360 and round to whole number
    const normalizedAzimuth = Math.round(((azimuth % 360) + 360) % 360);
    const normalizedElevation = Math.round(((elevation % 360) + 360) % 360);
    const normalizedRotation = Math.round(((rotation % 360) + 360) % 360);
    
    // Atualizar azimuth
    const azimuthElement = document.getElementById('angle-azimuth');
    if (azimuthElement) {
      azimuthElement.textContent = normalizedAzimuth + '°';
    }
    
    // Atualizar elevação
    const elevationElement = document.getElementById('angle-elevation');
    if (elevationElement) {
      elevationElement.textContent = normalizedElevation + '°';
    }
    
    // Atualizar rotação
    const rotationElement = document.getElementById('angle-rotation');
    if (rotationElement) {
      rotationElement.textContent = normalizedRotation + '°';
    }
    
    // Para manter retrocompatibilidade com o código existente
    const legacyAngleElement = document.getElementById('angle');
    if (legacyAngleElement) {
      legacyAngleElement.textContent = normalizedAzimuth + '°';
    }
  }

  showLoadingText() {
    document.getElementById('loading').style.visibility = 'visible';
  }

  hideLoadingText() {
    document.getElementById('loading').style.visibility = 'hidden';
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
    
    // Se for mobile, alterna para modo seleção
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      this.navMode = false;
      document.getElementById('button-nav-mode').classList.remove('selected');
      
      // Find and select all 'select' buttons
      const selectButtons = document.querySelectorAll(`[data-type="select"]`);
      selectButtons.forEach(btn => {
        btn.classList.add('selected');
      });
    }
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
  }

}

window.ui = new GameUI();