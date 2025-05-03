/**
 * Constants for the simulation system
 */

/**
 * Scale of one tile in meters
 * 1 tile = 30.48 cm (1 foot)
 */
export const TILE_SCALE = 0.3048;

/**
 * Converts a measurement from meters to tile units
 * @param {number} meters Value in meters
 * @returns {number} Value in tile units
 */
export function metersToTileUnits(meters) {
  return meters / TILE_SCALE;
}

/**
 * Converts a measurement from tile units to meters
 * @param {number} tileUnits Value in tile units
 * @returns {number} Value in meters
 */
export function tileUnitsToMeters(tileUnits) {
  return tileUnits * TILE_SCALE;
} 