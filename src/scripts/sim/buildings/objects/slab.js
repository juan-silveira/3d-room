import { Building } from '../building.js';
import { BuildingType } from '../buildingType.js';
import * as THREE from 'three';
import { TILE_SCALE, metersToTileUnits } from '../../constants.js';

export class Slab extends Building {
  /**
   * Width of the slab in tiles (fixed at 1)
   * @type {number}
   */
  width = 1;
  
  /**
   * Length of the slab in tiles (1-5)
   * @type {number}
   */
  length = 1;
  
  /**
   * Height of the slab in meters
   * @type {number}
   */
  height = 0.1;
  
  /**
   * Plants contained in this slab (one per tile)
   * @type {Array<Building>}
   */
  plants = [];

  constructor(x, y, length = 1) {
    super(x, y);
    this.type = BuildingType.slab;
    this.width = 1;
    this.length = Math.min(5, Math.max(1, length)); // Restrict length to 1-5 tiles
    this.name = 'Slab';
    this.hideTerrain = false;
    
    // Initialize plants array with null values (one per tile)
    this.plants = new Array(this.length).fill(null);
  }

  refreshView() {
    let mesh = this.createSlab();
    this.setMesh(mesh);
  }

  /**
   * Creates a slab (parallelogram)
   * @returns {THREE.Group}
   */
  createSlab() {
    // Convert dimensions from meters to Three.js units
    const height = metersToTileUnits(this.height);
    
    const geometry = new THREE.BoxGeometry(
      this.width, // Width is always 1 tile
      height,
      this.length // Length can be 1-5 tiles
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0xE0E0E0, // Light gray color for slab
      roughness: 0.3,
      metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2; // Place bottom of slab on the ground
    
    // Adjust position to center slab on the starting tile
    mesh.position.z = (this.length - 1) / 2;
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Create a group and add the mesh to it
    const group = new THREE.Group();
    group.add(mesh);
    
    // Set user data for raycasting
    group.userData = { instance: this };
    
    return group;
  }
  
  /**
   * Add a plant to a specific position on this slab
   * @param {Building} plant The plant to add
   * @param {number} position Position index (0 to length-1)
   */
  setPlant(plant, position) {
    if (position < 0 || position >= this.length) {
      console.error(`Invalid position ${position}. Must be between 0 and ${this.length - 1}`);
      return;
    }
    
    this.plants[position] = plant;
    if (plant) {
      // Add the plant to the slab's scene graph
      this.add(plant);
      
      // Position the plant at the top center of the slab at the correct position
      plant.position.set(0, metersToTileUnits(this.height), position);
    }
  }

  /**
   * Returns HTML representation for the info panel
   * @returns {string}
   */
  toHTML() {
    let html = super.toHTML();
    html += `
      <div class="info-heading">Slab</div>
      <span class="info-label">Width</span>
      <span class="info-value">${this.width} tile(s)</span>
      <br>
      <span class="info-label">Length</span>
      <span class="info-value">${this.length} tile(s)</span>
      <br>
      <span class="info-label">Height</span>
      <span class="info-value">${this.height.toFixed(2)} m</span>
      <br>
      <span class="info-label">Plants</span>
      <span class="info-value">${this.plants.filter(p => p).length} / ${this.length}</span>
      <br>
    `;
    
    // Add details for each plant position
    for (let i = 0; i < this.length; i++) {
      const plant = this.plants[i];
      html += `
        <span class="info-label">Position ${i+1}</span>
        <span class="info-value">${plant ? plant.name : 'Empty'}</span>
        <br>
      `;
    }
    
    return html;
  }
} 