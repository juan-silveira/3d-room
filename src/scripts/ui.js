import { Game } from './game';
import { Object } from './sim/object';
import { Pot } from './sim/buildings/objects/pot.js';
import { Slab } from './sim/buildings/objects/slab.js';
import { Tray } from './sim/buildings/objects/tray.js';

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
  }

  get gameWindow() {
    return document.getElementById('render-target');
  }

  /**
   * Get the door width from the UI
   * @returns {number} Door width in tiles
   */
  getDoorWidth() {
    const widthInput = document.getElementById('door-width');
    const width = parseInt(widthInput.value, 10);
    return isNaN(width) ? 2 : Math.max(1, Math.min(width, 4));
  }

  /**
   * Get pot configuration from the UI
   * @returns {Object} Pot configuration object
   */
  getPotConfig() {
    // Get pot shape
    const shapeRound = document.getElementById('pot-shape-round');
    const shape = shapeRound.checked ? 'round' : 'square';
    
    // Get dimensions
    const height = parseFloat(document.getElementById('pot-height').value);
    const topDiameter = parseFloat(document.getElementById('pot-top-diameter').value);
    const bottomDiameter = parseFloat(document.getElementById('pot-bottom-diameter').value);
    
    return {
      shape,
      height: isNaN(height) ? 0.3 : Math.max(0.1, Math.min(height, 0.5)),
      topDiameter: isNaN(topDiameter) ? 0.25 : Math.max(0.1, Math.min(topDiameter, 0.3)),
      bottomDiameter: isNaN(bottomDiameter) ? 0.2 : Math.max(0.1, Math.min(bottomDiameter, 0.3))
    };
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
    const width = parseInt(document.getElementById('tray-width').value, 10);
    const length = parseInt(document.getElementById('tray-length').value, 10);
    const legHeight = parseFloat(document.getElementById('tray-leg-height').value);
    const topThickness = parseFloat(document.getElementById('tray-top-thickness').value);
    const edgeHeight = parseFloat(document.getElementById('tray-edge-height').value);
    const edgeThickness = parseFloat(document.getElementById('tray-edge-thickness').value);
    
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
    this.selectedControl = event.target;
    this.selectedControl.classList.add('selected');

    this.activeToolId = this.selectedControl.getAttribute('data-type');
    // Se for mobile, alterna para modo seleção
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      this.navMode = false;
      document.getElementById('button-nav-mode').classList.remove('selected');
      document.getElementById('button-select').classList.add('selected');
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
    pot.topDiameter = config.topDiameter;
    pot.bottomDiameter = config.bottomDiameter;
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
   * Updates the terrain type for all tiles
   * @param {Event} event The click event from the terrain button
   */
  updateTerrain(event) {
    const target = event.target;
    // Se o clique foi em um elemento filho, subimos até encontrar o li
    const liElement = target.closest('li');
    const terrain = liElement.getAttribute('data-type');
    const room = window.game.room;
    
    // Update terrain for all tiles
    for (let x = 0; x < room.width; x++) {
      for (let y = 0; y < room.height; y++) {
        room.setTerrain(terrain, x, y);
      }
    }
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