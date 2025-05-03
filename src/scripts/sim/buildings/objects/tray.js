import { Building } from '../building.js';
import { BuildingType } from '../buildingType.js';
import * as THREE from 'three';
import { Tile } from '../../../sim/tile.js';
import { TILE_SCALE, metersToTileUnits } from '../../constants.js';

export class Tray extends Building {
  /**
   * Width of the tray in tiles
   * @type {number}
   */
  width = 2;
  
  /**
   * Length of the tray in tiles
   * @type {number}
   */
  length = 2;
  
  /**
   * Height of the legs in meters
   * @type {number}
   */
  legHeight = 0.8;
  
  /**
   * Thickness of the table top in meters
   * @type {number}
   */
  topThickness = 0.05;
  
  /**
   * Height of the edges in meters
   * @type {number}
   */
  edgeHeight = 0.1;
  
  /**
   * Thickness of the edges in meters
   * @type {number}
   */
  edgeThickness = 0.03;
  
  /**
   * 2D grid of tiles that make up the tray surface
   * @type {Tile[][]}
   */
  tiles = [];

  constructor(x, y, width = 2, length = 2) {
    super(x, y);
    this.type = BuildingType.tray;
    this.width = Math.min(20, Math.max(2, width)); // Restrict width to 2-20 tiles
    this.length = Math.min(100, Math.max(2, length)); // Restrict length to 2-100 tiles
    this.name = 'Tray';
    this.hideTerrain = false;
    
    // Initialize the grid of tiles on the tray surface
    this.initializeTiles();
  }
  
  /**
   * Initialize the grid of tiles on the tray surface
   */
  initializeTiles() {
    this.tiles = [];
    for (let x = 0; x < this.width; x++) {
      const column = [];
      for (let y = 0; y < this.length; y++) {
        const tile = new Tile(x, y);
        // Position tile relative to the tray
        tile.position.set(
          x - this.width / 2 + 0.5, 
          metersToTileUnits(this.legHeight + this.topThickness), 
          y - this.length / 2 + 0.5
        );
        column.push(tile);
      }
      this.tiles.push(column);
    }
  }

  refreshView() {
    let mesh = this.createTray();
    this.setMesh(mesh);
    
    // Refresh all tiles in the tray
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        this.tiles[x][y].refreshView();
      }
    }
  }

  /**
   * Creates a tray (table with edges)
   * @returns {THREE.Group}
   */
  createTray() {
    // Convert dimensions from meters to Three.js units
    const legHeight = metersToTileUnits(this.legHeight);
    const topThickness = metersToTileUnits(this.topThickness);
    const edgeHeight = metersToTileUnits(this.edgeHeight);
    const edgeThickness = metersToTileUnits(this.edgeThickness);
    
    // Create a group for all the tray parts
    const group = new THREE.Group();
    
    // Create table top
    const topGeometry = new THREE.BoxGeometry(
      this.width,
      topThickness,
      this.length
    );
    
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xA0A0A0, // Medium gray color for table top
      roughness: 0.5,
      metalness: 0.3
    });
    
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.y = legHeight + topThickness / 2;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);
    
    // Create table legs (four corners)
    const legGeometry = new THREE.BoxGeometry(0.1, legHeight, 0.1);
    
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Darker gray for legs
      roughness: 0.5,
      metalness: 0.5
    });
    
    // Positions for the four legs
    const legPositions = [
      {x: -this.width/2 + 0.1, z: -this.length/2 + 0.1},
      {x: this.width/2 - 0.1, z: -this.length/2 + 0.1},
      {x: -this.width/2 + 0.1, z: this.length/2 - 0.1},
      {x: this.width/2 - 0.1, z: this.length/2 - 0.1},
    ];
    
    legPositions.forEach(pos => {
      const legMesh = new THREE.Mesh(legGeometry, legMaterial);
      legMesh.position.set(pos.x, legHeight/2, pos.z);
      legMesh.castShadow = true;
      legMesh.receiveShadow = true;
      group.add(legMesh);
    });
    
    // Create the edges (walls)
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x909090, // Medium gray for edges
      roughness: 0.5,
      metalness: 0.3
    });
    
    // North edge (negative Z)
    const northEdgeGeometry = new THREE.BoxGeometry(
      this.width + edgeThickness * 2,
      edgeHeight,
      edgeThickness
    );
    const northEdge = new THREE.Mesh(northEdgeGeometry, edgeMaterial);
    northEdge.position.set(
      0,
      legHeight + topThickness + edgeHeight/2,
      -this.length/2 - edgeThickness/2
    );
    northEdge.castShadow = true;
    northEdge.receiveShadow = true;
    group.add(northEdge);
    
    // South edge (positive Z)
    const southEdgeGeometry = new THREE.BoxGeometry(
      this.width + edgeThickness * 2,
      edgeHeight,
      edgeThickness
    );
    const southEdge = new THREE.Mesh(southEdgeGeometry, edgeMaterial);
    southEdge.position.set(
      0,
      legHeight + topThickness + edgeHeight/2,
      this.length/2 + edgeThickness/2
    );
    southEdge.castShadow = true;
    southEdge.receiveShadow = true;
    group.add(southEdge);
    
    // East edge (positive X)
    const eastEdgeGeometry = new THREE.BoxGeometry(
      edgeThickness,
      edgeHeight,
      this.length
    );
    const eastEdge = new THREE.Mesh(eastEdgeGeometry, edgeMaterial);
    eastEdge.position.set(
      this.width/2 + edgeThickness/2,
      legHeight + topThickness + edgeHeight/2,
      0
    );
    eastEdge.castShadow = true;
    eastEdge.receiveShadow = true;
    group.add(eastEdge);
    
    // West edge (negative X)
    const westEdgeGeometry = new THREE.BoxGeometry(
      edgeThickness,
      edgeHeight,
      this.length
    );
    const westEdge = new THREE.Mesh(westEdgeGeometry, edgeMaterial);
    westEdge.position.set(
      -this.width/2 - edgeThickness/2,
      legHeight + topThickness + edgeHeight/2,
      0
    );
    westEdge.castShadow = true;
    westEdge.receiveShadow = true;
    group.add(westEdge);
    
    // Add all the tiles to the group
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        group.add(this.tiles[x][y]);
      }
    }
    
    // Set user data for raycasting
    group.userData = { instance: this };
    
    return group;
  }
  
  /**
   * Get a tile at the specified coordinates on the tray
   * @param {number} x X coordinate on the tray grid
   * @param {number} y Y coordinate on the tray grid
   * @returns {Tile|null} The tile at the specified position, or null if out of bounds
   */
  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.length) {
      return null;
    }
    return this.tiles[x][y];
  }
  
  /**
   * Place a building on a specific tile of the tray
   * @param {number} x X coordinate on the tray grid
   * @param {number} y Y coordinate on the tray grid
   * @param {Building} building The building to place
   */
  placeBuilding(x, y, building) {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.setBuilding(building);
      // Position the building correctly on the tile
      if (building) {
        building.position.set(0, 0, 0); // Reset position relative to the tile
      }
    }
  }

  /**
   * Returns HTML representation for the info panel
   * @returns {string}
   */
  toHTML() {
    let html = super.toHTML();
    html += `
      <div class="info-heading">Tray</div>
      <span class="info-label">Width</span>
      <span class="info-value">${this.width} tile(s)</span>
      <br>
      <span class="info-label">Length</span>
      <span class="info-value">${this.length} tile(s)</span>
      <br>
      <span class="info-label">Leg Height</span>
      <span class="info-value">${this.legHeight.toFixed(2)} m</span>
      <br>
      <span class="info-label">Top Thickness</span>
      <span class="info-value">${this.topThickness.toFixed(2)} m</span>
      <br>
      <span class="info-label">Edge Height</span>
      <span class="info-value">${this.edgeHeight.toFixed(2)} m</span>
      <br>
      <span class="info-label">Edge Thickness</span>
      <span class="info-value">${this.edgeThickness.toFixed(2)} m</span>
      <br>
    `;
    
    // Count occupied tiles
    let occupiedTiles = 0;
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        if (this.tiles[x][y].building) {
          occupiedTiles++;
        }
      }
    }
    
    html += `
      <span class="info-label">Occupied Tiles</span>
      <span class="info-value">${occupiedTiles} / ${this.width * this.length}</span>
      <br>
    `;
    
    return html;
  }
} 