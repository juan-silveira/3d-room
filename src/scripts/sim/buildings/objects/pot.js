import { Building } from '../building.js';
import { BuildingType } from '../buildingType.js';
import * as THREE from 'three';
import { TILE_SCALE, metersToTileUnits } from '../../constants.js';

export class Pot extends Building {
  /**
   * The shape of the pot (round or square)
   * @type {string}
   */
  shape = 'round';
  
  /**
   * Height of the pot in meters
   * @type {number}
   */
  height = 0.3;
  
  /**
   * Top diameter of the pot in meters (for round pots)
   * @type {number}
   */
  topDiameter = 0.25;
  
  /**
   * Bottom diameter of the pot in meters (for round pots)
   * @type {number}
   */
  bottomDiameter = 0.2;
  
  /**
   * Top side length of the pot in meters (for square pots)
   * @type {number}
   */
  topSide = 0.3;
  
  /**
   * Bottom side length of the pot in meters (for square pots)
   * @type {number}
   */
  bottomSide = 0.3;
  
  /**
   * The plant contained in this pot
   * @type {Building}
   */
  plant = null;

  constructor(x, y, shape = 'round') {
    super(x, y);
    this.type = BuildingType.pot;
    this.shape = shape;
    this.name = 'Pot';
    this.hideTerrain = false;
  }

  refreshView() {
    let mesh;
    if (this.shape === 'round') {
      mesh = this.createRoundPot();
    } else {
      mesh = this.createSquarePot();
    }
    this.setMesh(mesh);
  }

  /**
   * Creates a round pot (truncated cone)
   * @returns {THREE.Mesh}
   */
  createRoundPot() {
    // Convert dimensions from meters to Three.js units
    const height = metersToTileUnits(this.height);
    const radiusTop = metersToTileUnits(this.topDiameter / 2);
    const radiusBottom = metersToTileUnits(this.bottomDiameter / 2);
    
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      32 // segments
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown color for pot
      roughness: 0.7,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height / 2; // Place bottom of pot on the ground
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
   * Creates a square pot (truncated pyramid)
   * @returns {THREE.Mesh}
   */
  createSquarePot() {
    // Convert dimensions from meters to Three.js units
    const height = metersToTileUnits(this.height);
    const topWidth = metersToTileUnits(this.topSide);
    const bottomWidth = metersToTileUnits(this.bottomSide);
    
    // Create a custom geometry for a tapered box (truncated pyramid)
    const geometry = new THREE.BufferGeometry();
    
    // Define the 8 corners of the truncated pyramid
    const halfBottomWidth = bottomWidth / 2;
    const halfTopWidth = topWidth / 2;
    
    // Define vertices (bottom 4 corners, then top 4 corners)
    const vertices = new Float32Array([
      // Bottom layer (y = 0)
      -halfBottomWidth, 0, -halfBottomWidth,
      halfBottomWidth, 0, -halfBottomWidth,
      halfBottomWidth, 0, halfBottomWidth,
      -halfBottomWidth, 0, halfBottomWidth,
      
      // Top layer (y = height)
      -halfTopWidth, height, -halfTopWidth,
      halfTopWidth, height, -halfTopWidth,
      halfTopWidth, height, halfTopWidth,
      -halfTopWidth, height, halfTopWidth
    ]);
    
    // Define faces (triangles) using indices
    const indices = [
      // Bottom face
      0, 1, 2,
      0, 2, 3,
      
      // Top face
      4, 6, 5,
      4, 7, 6,
      
      // Side faces
      0, 4, 1,
      1, 4, 5,
      
      1, 5, 2,
      2, 5, 6,
      
      2, 6, 3,
      3, 6, 7,
      
      3, 7, 0,
      0, 7, 4
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown color for pot
      roughness: 0.7,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    // Position the mesh at the right height
    mesh.position.y = 0; // Bottom of pot is already at y=0 in geometry
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
   * Add a plant to this pot
   * @param {Building} plant The plant to add
   */
  setPlant(plant) {
    this.plant = plant;
    if (plant) {
      // Add the plant to the pot's scene graph
      this.add(plant);
      
      // Position the plant at the top center of the pot
      const potHeight = metersToTileUnits(this.height);
      plant.position.set(0, potHeight, 0);
    }
  }

  /**
   * Returns HTML representation for the info panel
   * @returns {string}
   */
  toHTML() {
    let html = super.toHTML();
    html += `
      <div class="info-heading">Pot</div>
      <span class="info-label">Shape</span>
      <span class="info-value">${this.shape}</span>
      <br>
      <span class="info-label">Height</span>
      <span class="info-value">${this.height.toFixed(2)} m</span>
      <br>`;
      
    if (this.shape === 'round') {
      html += `
        <span class="info-label">Top Diameter</span>
        <span class="info-value">${this.topDiameter.toFixed(2)} m</span>
        <br>
        <span class="info-label">Bottom Diameter</span>
        <span class="info-value">${this.bottomDiameter.toFixed(2)} m</span>
        <br>`;
    } else {
      html += `
        <span class="info-label">Top Side</span>
        <span class="info-value">${this.topSide.toFixed(2)} m</span>
        <br>
        <span class="info-label">Bottom Side</span>
        <span class="info-value">${this.bottomSide.toFixed(2)} m</span>
        <br>`;
    }
    
    html += `
      <span class="info-label">Plant</span>
      <span class="info-value">${this.plant ? this.plant.name : 'None'}</span>
      <br>
    `;
    return html;
  }
} 