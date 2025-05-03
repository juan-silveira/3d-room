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
   * Top diameter/width of the pot in meters
   * @type {number}
   */
  topDiameter = 0.25;
  
  /**
   * Bottom diameter/width of the pot in meters
   * @type {number}
   */
  bottomDiameter = 0.2;
  
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
    const topWidth = metersToTileUnits(this.topDiameter);
    const bottomWidth = metersToTileUnits(this.bottomDiameter);
    
    // Create a truncated pyramid (custom geometry)
    const shape = new THREE.Shape();
    shape.moveTo(-bottomWidth/2, -bottomWidth/2);
    shape.lineTo(bottomWidth/2, -bottomWidth/2);
    shape.lineTo(bottomWidth/2, bottomWidth/2);
    shape.lineTo(-bottomWidth/2, bottomWidth/2);
    shape.closePath();
    
    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false
    };
    
    // Create custom extrusion for the truncated pyramid
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Adjust scale to create the tapered effect
    const topScale = topWidth / bottomWidth;
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const y = geometry.attributes.position.getY(i);
      if (Math.abs(y - height) < 0.001) {
        const x = geometry.attributes.position.getX(i);
        const z = geometry.attributes.position.getZ(i);
        geometry.attributes.position.setX(i, x * topScale);
        geometry.attributes.position.setZ(i, z * topScale);
      }
    }
    
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown color for pot
      roughness: 0.7,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2; // Rotate to stand upright
    mesh.position.y = 0; // Place on the ground
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
      plant.position.set(0, metersToTileUnits(this.height), 0);
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
      <br>
      <span class="info-label">Top Diameter</span>
      <span class="info-value">${this.topDiameter.toFixed(2)} m</span>
      <br>
      <span class="info-label">Bottom Diameter</span>
      <span class="info-value">${this.bottomDiameter.toFixed(2)} m</span>
      <br>
      <span class="info-label">Plant</span>
      <span class="info-value">${this.plant ? this.plant.name : 'None'}</span>
      <br>
    `;
    return html;
  }
} 