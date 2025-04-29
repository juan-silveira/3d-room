import { Room } from '../../room.js';

export class Module {
  /**
   * Simulates one day passing
   * @param {Room} room 
   */
  simulate(room) {
    // Implement in subclass
  }

  /**
   * Cleans up this module, disposing of any assets and unlinking any references
   */
  dispose() {
    // Implement in subclass
  }

  /**
   * Returns an HTML representation of this object
   * @returns {string}
   */
  toHTML() {
    // Implement in subclass
  }
}