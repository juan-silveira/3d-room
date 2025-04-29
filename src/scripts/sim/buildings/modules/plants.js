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
    for (let x = 0; x < this.#room.width; x++) {
      for (let y = 0; y < this.#room.height; y++) {
        const tile = this.#room.getTile(x, y);
        if (tile && tile.building && tile.building.type === 'cannabis-plant') {
          count++;
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