import { Module } from './module.js';
import { Room } from '../../room.js';

/**
 * Logic for managing cannabis plants in the room
 */
export class PlantsModule extends Module {
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
    this.updatePlantCount();
  }

  /**
   * Updates the plant count in the title bar
   */
  updatePlantCount() {
    let count = 0;
    
    // Loop through all tiles in the room
    for (let x = 0; x < this.#room.width; x++) {
      for (let y = 0; y < this.#room.height; y++) {
        const tile = this.#room.getTile(x, y);
        if (!tile) continue;
        
        // Count cannabis plants directly on the room
        if (tile.building && tile.building.type === 'cannabis-plant') {
          count++;
        }
        
        // Count plants in pots
        if (tile.building && tile.building.type === 'pot') {
          if (tile.building.plant) {
            count++;
          }
        }
        
        // Count plants in slabs
        if (tile.building && tile.building.type === 'slab') {
          if (tile.building.plants) {
            // Slabs can have multiple plants
            for (const plant of tile.building.plants) {
              if (plant) {
                count++;
              }
            }
          }
        }
        
        // Check if this tile contains a tray
        if (tile.building && tile.building.type === 'tray') {
          const tray = tile.building;
          
          // Loop through all tiles in the tray
          for (let tx = 0; tx < tray.width; tx++) {
            for (let ty = 0; ty < tray.length; ty++) {
              const trayTile = tray.getTile(tx, ty);
              if (!trayTile) continue;
              
              // Count plants in pots on trays
              if (trayTile.building && trayTile.building.type === 'pot') {
                if (trayTile.building.plant) {
                  count++;
                }
              }
              
              // Count plants in slabs on trays
              if (trayTile.building && trayTile.building.type === 'slab') {
                if (trayTile.building.plants) {
                  // Slabs can have multiple plants
                  for (const plant of trayTile.building.plants) {
                    if (plant) {
                      count++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    document.getElementById('plants-counter').innerHTML = count;
  }

  /**
   * @param {Room} room 
   */
  simulate(room) {
    // A contagem é atualizada quando plantas são adicionadas ou removidas
    // através dos métodos placeBuilding e trash da Room
  }

  /**
   * Handles any clean up needed before the module is removed
   */
  dispose() {
    // Nada para limpar
  }
} 