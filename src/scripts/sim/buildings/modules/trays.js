import { Module } from './module.js';
import { Room } from '../../room.js';

/**
 * Logic for managing trays in the room
 */
export class TraysModule extends Module {
  /**
   * @type {Room}
   */
  #room;

  /**
   * @param {Room} room 
   */
  constructor(room) {
    super();
    this.#room = room;
    this.updateTrayCount();
  }

  /**
   * Updates the tray count in the title bar
   */
  updateTrayCount() {
    let count = 0;
    
    // Loop through all tiles in the room
    for (let x = 0; x < this.#room.width; x++) {
      for (let y = 0; y < this.#room.height; y++) {
        const tile = this.#room.getTile(x, y);
        if (!tile) continue;
        
        // Count trays in the room
        if (tile.building && tile.building.type === 'tray') {
          count++;
        }
      }
    }
    
    document.getElementById('tray-counter').innerHTML = count;
  }

  /**
   * @returns {boolean} Whether the room has any trays
   */
  hasTrays() {
    for (let x = 0; x < this.#room.width; x++) {
      for (let y = 0; y < this.#room.height; y++) {
        const tile = this.#room.getTile(x, y);
        if (tile && tile.building && tile.building.type === 'tray') {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @param {Room} room 
   */
  simulate(room) {
    // The count is updated when trays are added or removed
    // through the placeBuilding and trash methods of Room
  }

  /**
   * Handles any clean up needed before the module is removed
   */
  dispose() {
    // Nothing to clean up
  }
} 