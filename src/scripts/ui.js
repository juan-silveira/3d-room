import { Game } from './game';
import { Object } from './sim/object';

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