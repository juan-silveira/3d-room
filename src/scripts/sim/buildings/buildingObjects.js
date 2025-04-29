import { BuildingType } from './buildingType.js';
import { Building } from './building.js';
import { CannabisPlant } from './objects/cannabisPlant.js';

/**
 * Creates a new building object
 * @param {number} x The x-coordinate of the building
 * @param {number} y The y-coordinate of the building
 * @param {string} type The building type
 * @returns {Building} A new building object
 */
export function createBuilding(x, y, type) {
  switch (type) {
    case BuildingType.cannabisPlant:
      return new CannabisPlant(x, y);
    default:
      console.error(`${type} is not a recognized building type.`);
  }
}