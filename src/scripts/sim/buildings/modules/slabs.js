import { Module } from './module.js';
import { Room } from '../../room.js';

/**
 * Logic for managing slabs in the room
 */
export class SlabsModule extends Module {
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
    this.updateSlabCount();
  }

  /**
   * Updates the slab count in the title bar
   */
  updateSlabCount() {
    let count = 0;
    
    // Loop through all tiles in the room
    for (let x = 0; x < this.#room.width; x++) {
      for (let y = 0; y < this.#room.height; y++) {
        const tile = this.#room.getTile(x, y);
        if (!tile) continue;
        
        // Count slabs directly on the room
        if (tile.building && tile.building.type === 'slab') {
          count++;
        }
        
        // Check if this tile contains a tray
        if (tile.building && tile.building.type === 'tray') {
          const tray = tile.building;
          
          // Loop through all tiles in the tray
          for (let tx = 0; tx < tray.width; tx++) {
            for (let ty = 0; ty < tray.length; ty++) {
              const trayTile = tray.getTile(tx, ty);
              if (!trayTile) continue;
              
              // Count slabs on trays
              if (trayTile.building && trayTile.building.type === 'slab') {
                count++;
              }
            }
          }
        }
      }
    }
    
    document.getElementById('slab-counter').innerHTML = count;
  }

  /**
   * @param {Room} room 
   */
  simulate(room) {
    // The count is updated when slabs are added or removed
    // through the placeBuilding and trash methods of Room
  }

  /**
   * Handles any clean up needed before the module is removed
   */
  dispose() {
    // Nothing to clean up
  }
} 