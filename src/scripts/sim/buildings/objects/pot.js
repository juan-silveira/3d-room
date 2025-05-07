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
 * Creates a round pot (truncated cone) with hollow interior and soil
 * @returns {THREE.Group}
 */
createRoundPot() {
  // Convert dimensions from meters to Three.js units
  const height = metersToTileUnits(this.height);
  const radiusTop = metersToTileUnits(this.topDiameter / 2);
  const radiusBottom = metersToTileUnits(this.bottomDiameter / 2);
  
  // Wall thickness (adjust as needed)
  const wallThickness = metersToTileUnits(0.01); // 1cm thickness
  
  // Create pot group
  const group = new THREE.Group();
  
  // Create pot walls using CylinderGeometry with open top
  const potWallsGeometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    32, // radial segments
    1,  // height segments
    true // open-ended cylinder (no top/bottom)
  );
  
  const potMaterial = new THREE.MeshStandardMaterial({
    color: 0xCC7F3D, // Terracotta color
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide // Render both sides of faces
  });
  
  const potWalls = new THREE.Mesh(potWallsGeometry, potMaterial);
  potWalls.castShadow = true;
  potWalls.receiveShadow = true;
  
  // Create pot bottom (circular disc)
  const bottomGeometry = new THREE.CircleGeometry(radiusBottom, 32);
  const bottom = new THREE.Mesh(bottomGeometry, potMaterial);
  bottom.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  bottom.position.y = -height / 2; // Position at the bottom of the walls
  
  // Create inner bottom (for visual depth)
  const innerBottomGeometry = new THREE.CircleGeometry(radiusBottom - wallThickness, 32);
  const innerBottomMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B, // Darker interior color
    roughness: 0.8,
    metalness: 0.0
  });
  const innerBottom = new THREE.Mesh(innerBottomGeometry, innerBottomMaterial);
  innerBottom.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  innerBottom.position.y = -height / 2 + wallThickness * 0.1; // Slightly above the bottom
  
  // Create soil (slightly smaller than inner pot)
  const soilHeight = height - wallThickness * 1.5; // Soil doesn't completely fill the pot
  const soilTopRadius = radiusTop - wallThickness * 1.2;
  const soilBottomRadius = Math.min(radiusBottom - wallThickness * 1.2, soilTopRadius);
  
  const soilGeometry = new THREE.CylinderGeometry(
    soilTopRadius,
    soilBottomRadius,
    soilHeight,
    32 // segments
  );
  
  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x3D2817, // Dark brown soil color
    roughness: 0.9,
    metalness: 0.0
  });
  
  const soilMesh = new THREE.Mesh(soilGeometry, soilMaterial);
  soilMesh.position.y = -height/2 + soilHeight/2 + wallThickness * 0.5; // Position soil inside pot
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  
  // Add all components to the group
  group.add(potWalls);
  group.add(bottom);
  group.add(innerBottom);
  group.add(soilMesh);
  
  // Position the entire group
  group.position.y = height / 2; // Place bottom of pot on the ground
  
  // Set user data for raycasting
  group.userData = { instance: this };
  
  return group;
}

/**
 * Creates a square pot (truncated pyramid) with hollow interior and soil
 * @returns {THREE.Group}
 */
createSquarePot() {
  // Convert dimensions from meters to Three.js units
  const height = metersToTileUnits(this.height);
  const topWidth = metersToTileUnits(this.topSide);
  const bottomWidth = metersToTileUnits(this.bottomSide);
  
  // Wall thickness (adjust as needed)
  const wallThickness = metersToTileUnits(0.01); // 1cm thickness
  
  // Create pot group
  const group = new THREE.Group();
  
  // Create hollow walls using separate faces
  // We'll create 4 side faces and a bottom face
  
  // Parameters
  const halfTopWidth = topWidth / 2;
  const halfBottomWidth = bottomWidth / 2;
  
  // 1. Create side walls
  const walls = new THREE.Group();
  
  // Helper function to create a wall face
  const createWallFace = (x1, z1, x2, z2, x3, z3, x4, z4) => {
    const geometry = new THREE.BufferGeometry();
    
    // Define vertices for a wall panel
    const vertices = new Float32Array([
      // Bottom edge
      x1, 0, z1,
      x2, 0, z2,
      
      // Top edge
      x3, height, z3,
      x4, height, z4
    ]);
    
    // Define faces (triangles)
    const indices = [
      0, 1, 2,  // First triangle
      2, 1, 3   // Second triangle
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    
    const wallMesh = new THREE.Mesh(geometry, potMaterial);
    return wallMesh;
  };
  
  // Material for the pot
  const potMaterial = new THREE.MeshStandardMaterial({
    color: 0xCC7F3D, // Terracotta color
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide // Render both sides of faces
  });
  
  // Create four walls
  // Front wall
  walls.add(createWallFace(
    -halfBottomWidth, -halfBottomWidth, // Bottom left
    halfBottomWidth, -halfBottomWidth,  // Bottom right
    -halfTopWidth, -halfTopWidth,       // Top left
    halfTopWidth, -halfTopWidth         // Top right
  ));
  
  // Right wall
  walls.add(createWallFace(
    halfBottomWidth, -halfBottomWidth,  // Bottom left
    halfBottomWidth, halfBottomWidth,   // Bottom right
    halfTopWidth, -halfTopWidth,        // Top left
    halfTopWidth, halfTopWidth          // Top right
  ));
  
  // Back wall
  walls.add(createWallFace(
    halfBottomWidth, halfBottomWidth,   // Bottom left
    -halfBottomWidth, halfBottomWidth,  // Bottom right
    halfTopWidth, halfTopWidth,         // Top left
    -halfTopWidth, halfTopWidth         // Top right
  ));
  
  // Left wall
  walls.add(createWallFace(
    -halfBottomWidth, halfBottomWidth,  // Bottom left
    -halfBottomWidth, -halfBottomWidth, // Bottom right
    -halfTopWidth, halfTopWidth,        // Top left
    -halfTopWidth, -halfTopWidth        // Top right
  ));
  
  // Make walls cast shadows
  walls.children.forEach(wall => {
    wall.castShadow = true;
    wall.receiveShadow = true;
  });
  
  // 2. Create bottom face
  const bottomGeometry = new THREE.PlaneGeometry(bottomWidth, bottomWidth);
  const bottom = new THREE.Mesh(bottomGeometry, potMaterial);
  bottom.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  bottom.position.y = 0; // At the bottom of the pot
  
  // 3. Create inner bottom (for visual depth)
  const innerBottomGeometry = new THREE.PlaneGeometry(
    bottomWidth - wallThickness * 2, 
    bottomWidth - wallThickness * 2
  );
  const innerBottomMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B, // Darker interior color
    roughness: 0.8,
    metalness: 0.0
  });
  const innerBottom = new THREE.Mesh(innerBottomGeometry, innerBottomMaterial);
  innerBottom.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  innerBottom.position.y = wallThickness * 0.1; // Slightly above the bottom
  
  // 4. Create soil
  const soilHeight = height - wallThickness * 1.5;
  const soilTopWidth = topWidth - wallThickness * 2.4;
  const soilBottomWidth = bottomWidth - wallThickness * 2.4;
  
  const soilGeometry = this.createTruncatedPyramidGeometry(
    soilBottomWidth, soilTopWidth, soilHeight
  );
  
  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x3D2817, // Dark brown soil color
    roughness: 0.9,
    metalness: 0.0
  });
  
  const soilMesh = new THREE.Mesh(soilGeometry, soilMaterial);
  soilMesh.position.y = height/2 - soilHeight/2 - wallThickness * 0.5; // Position soil below pot top
  soilMesh.castShadow = true;
  soilMesh.receiveShadow = true;
  
  // Add all components to the group
  group.add(walls);
  group.add(bottom);
  group.add(innerBottom);
  group.add(soilMesh);
  
  // Set user data for raycasting
  group.userData = { instance: this };
  
  return group;
}

/**
 * Helper method to create a truncated pyramid geometry
 * @param {number} bottomWidth - Width of the bottom face
 * @param {number} topWidth - Width of the top face
 * @param {number} height - Height of the pyramid
 * @returns {THREE.BufferGeometry}
 */
createTruncatedPyramidGeometry(bottomWidth, topWidth, height) {
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
  
  return geometry;
}

/**
 * Helper method to create a truncated pyramid geometry
 * @param {number} bottomWidth - Width of the bottom face
 * @param {number} topWidth - Width of the top face
 * @param {number} height - Height of the pyramid
 * @returns {THREE.BufferGeometry}
 */
createTruncatedPyramidGeometry(bottomWidth, topWidth, height) {
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
  
  return geometry;
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
      plant.position.set(0, potHeight - 0.05, 0);
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