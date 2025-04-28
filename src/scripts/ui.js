import { Game } from './game';
import { SimObject } from './sim/simObject';
import playIconUrl from '/icons/play-color.png';
import pauseIconUrl from '/icons/pause-color.png';

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
   * Toggles the pause state of the game
   */
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      document.getElementById('pause-button-icon').src = playIconUrl;
      document.getElementById('paused-text').style.visibility = 'visible';
    } else {
      document.getElementById('pause-button-icon').src = pauseIconUrl;
      document.getElementById('paused-text').style.visibility = 'hidden';
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
  }

  /**
   * Updates the terrain type for all tiles
   * @param {Event} event The click event from the terrain button
   */
  updateTerrain(event) {
    const terrain = event.target.getAttribute('data-type');
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
   * @param {SimObject} object 
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