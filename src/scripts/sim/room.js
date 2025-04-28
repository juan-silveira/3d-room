import * as THREE from 'three';
import { BuildingType } from './buildings/buildingType.js';
import { createBuilding } from './buildings/buildingFactory.js';
import { Tile } from './tile.js';
import { VehicleGraph } from './vehicles/vehicleGraph.js';
import { PowerService } from './services/power.js';
import { SimService } from './services/simService.js';

export class Room extends THREE.Group {
  /**
   * Separate group for organizing debug meshes so they aren't included
   * in raycasting checks
   * @type {THREE.Group}
   */
  debugMeshes = new THREE.Group();
  /**
   * Root node for all scene objects 
   * @type {THREE.Group}
   */
  root = new THREE.Group();
  /**
   * List of services for the room
   * @type {SimService}
   */
  services = [];
  /**
   * The width of the room in tiles
   * @type {number}
   */
  width = 16;
  /**
   * The height of the room in tiles
   * @type {number}
   */
  height = 16;
  /**
   * The current simulation time
   */
  simTime = 0;
  /**
   * 2D array of tiles that make up the room
   * @type {Tile[][]}
   */
  tiles = [];
  /**
   * 
   * @param {VehicleGraph} size 
   */
  vehicleGraph;

  constructor(width, height, name = 'My Room') {
    super();

    this.name = name;
    this.width = width;
    this.height = height;
    
    this.add(this.debugMeshes);
    this.add(this.root);

    this.tiles = [];
    for (let x = 0; x < this.width; x++) {
      const column = [];
      for (let y = 0; y < this.height; y++) {
        const tile = new Tile(x, y);
        tile.setBuilding(createBuilding(x, y, 'cannabis-plant'));
        tile.refreshView(this);
        this.root.add(tile);
        column.push(tile);
      }
      this.tiles.push(column);
    }

    this.services = [];
    this.services.push(new PowerService());
    
    this.vehicleGraph = new VehicleGraph(this.width, this.height);
    this.debugMeshes.add(this.vehicleGraph);
  }

  /**
   * The total population of the room
   * @type {number}
   */
  get population() {
    let population = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const tile = this.getTile(x, y);
        population += tile.building?.residents?.count ?? 0;
      }
    }
    return population;
  }

  /** Returns the title at the coordinates. If the coordinates
   * are out of bounds, then `null` is returned.
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   * @returns {Tile | null}
   */
  getTile(x, y) {
    if (x === undefined || y === undefined ||
      x < 0 || y < 0 ||
      x >= this.width || y >= this.height) {
      return null;
    } else {
      return this.tiles[x][y];
    }
  }

  /**
   * Step the simulation forward by one step
   * @type {number} steps Number of steps to simulate forward in time
   */
  simulate(steps = 1) {
    let count = 0;
    while (count++ < steps) {
      // Update services
      this.services.forEach((service) => service.simulate(this));

      // Update each building
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          this.getTile(x, y).simulate(this);
        }
      }
    }
    this.simTime++;
  }

  /**
   * Places a building at the specified coordinates if the
   * tile does not already have a building on it
   * @param {number} x 
   * @param {number} y 
   * @param {string} buildingType 
   */
  placeBuilding(x, y, buildingType) {
    const tile = this.getTile(x, y);

    // If the tile doesnt' already have a building, place one there
    if (tile && !tile.building) {
      tile.setBuilding(createBuilding(x, y, buildingType));
      tile.refreshView(this);
      
      // Update buildings on adjacent tile in case they need to
      // change their mesh (e.g. roads)
      this.getTile(x - 1, y)?.refreshView(this);
      this.getTile(x + 1, y)?.refreshView(this);
      this.getTile(x, y - 1)?.refreshView(this);
      this.getTile(x, y + 1)?.refreshView(this);

      if (tile.building.type === BuildingType.road) {
        this.vehicleGraph.updateTile(x, y, tile.building);
      }
    }
  }

  /**
   * Trashes the building at the specified coordinates
   * @param {number} x 
   * @param {number} y
   */
  trash(x, y) {
    const tile = this.getTile(x, y);

    if (tile.building) {
      if (tile.building.type === BuildingType.road) {
        this.vehicleGraph.updateTile(x, y, null);
      }

      tile.building.dispose();
      tile.setBuilding(null);
      tile.refreshView(this);

      // Update neighboring tiles in case they need to change their mesh (e.g. roads)
      this.getTile(x - 1, y)?.refreshView(this);
      this.getTile(x + 1, y)?.refreshView(this);
      this.getTile(x, y - 1)?.refreshView(this);
      this.getTile(x, y + 1)?.refreshView(this);
    }
  }

  draw() {
    this.vehicleGraph.updateVehicles();
  }

  /**
   * Finds the first tile where the criteria are true
   * @param {{x: number, y: number}} start The starting coordinates of the search
   * @param {(Tile) => (boolean)} filter This function is called on each
   * tile in the search field until `filter` returns true, or there are
   * no more tiles left to search.
   * @param {number} maxDistance The maximum distance to search from the starting tile
   * @returns {Tile | null} The first tile matching `criteria`, otherwiser `null`
   */
  findTile(start, filter, maxDistance) {
    const startTile = this.getTile(start.x, start.y);
    const visited = new Set();
    const tilesToSearch = [];

    // Initialze our search with the starting tile
    tilesToSearch.push(startTile);

    while (tilesToSearch.length > 0) {
      const tile = tilesToSearch.shift();

      // Has this tile been visited? If so, ignore it and move on
      if (visited.has(tile.id)) {
        continue;
      } else {
        visited.add(tile.id);
      }

      // Check if tile is outside the search bounds
      const distance = startTile.distanceTo(tile);
      if (distance > maxDistance) continue;

      // Add this tiles neighbor's to the search list
      tilesToSearch.push(...this.getTileNeighbors(tile.x, tile.y));

      // If this tile passes the criteria 
      if (filter(tile)) {
        return tile;
      }
    }

    return null;
  }

  /**
   * Finds and returns the neighbors of this tile
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   */
  getTileNeighbors(x, y) {
    const neighbors = [];

    if (x > 0) {
      neighbors.push(this.getTile(x - 1, y));
    }
    if (x < this.width - 1) {
      neighbors.push(this.getTile(x + 1, y));
    }
    if (y > 0) {
      neighbors.push(this.getTile(x, y - 1));
    }
    if (y < this.height - 1) {
      neighbors.push(this.getTile(x, y + 1));
    }

    return neighbors;
  }

  /**
   * Sets the terrain type for the selected tile
   * @param {string} terrainType The type of terrain to set
   * @param {number} x The x-coordinate of the tile
   * @param {number} y The y-coordinate of the tile
   */
  setTerrain(terrainType, x, y) {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.terrain = terrainType;
      tile.refreshView(this);
    }
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
}