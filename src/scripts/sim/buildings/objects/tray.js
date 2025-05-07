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
    
    // Calculate the tray top position in tile units
    const legHeight = metersToTileUnits(this.legHeight);
    const topThickness = metersToTileUnits(this.topThickness);
    const trayTopPosition = legHeight + topThickness;
    
    // Position calculation needs to start from the origin corner (x,y)
    // and extend the grid in the positive direction
    for (let x = 0; x < this.width; x++) {
      const column = [];
      for (let y = 0; y < this.length; y++) {
        const tile = new Tile(x, y);
        // Position tile relative to the tray's origin point, at the top of the tray
        tile.position.set(
          x, 
          trayTopPosition, 
          y
        );
        tile.refreshView();
        
        // Adicionar atributos personalizados para facilitar o posicionamento
        tile.localX = x;  // Coordenada local X na tray
        tile.localY = y;  // Coordenada local Y na tray
        
        // Importante: Garantir que cada tile tenha um link para a tray pai
        if (tile.mesh) {
          tile.mesh.userData = {
            instance: tile,
            parentTray: this,
            localX: x,  // Adicionar coordenadas locais em userData
            localY: y,  // para facilitar o acesso
            id: Math.random().toString(36).substr(2, 9)
          };
        }
        
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
        const tile = this.tiles[x][y];
        tile.refreshView();
        
        // Importante: Garantir que cada tile tenha um link para a tray pai
        if (tile.mesh) {
          tile.mesh.userData = {
            instance: tile,
            parentTray: this,
            localX: x,
            localY: y,
            id: Math.random().toString(36).substr(2, 9)
          };
        }
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
    
    // Create a semi-transparent table top (greatly reduced opacity)
    const topGeometry = new THREE.BoxGeometry(
      this.width,
      topThickness,
      this.length
    );
    
    const topMaterial = new THREE.MeshStandardMaterial({
      color: 0xA0A0A0, // Medium gray color for table top
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.2  // Make it very transparent
    });
    
    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.position.set(
      this.width / 2 - 0.5,
      legHeight + topThickness / 2,
      this.length / 2 - 0.5
    );
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);
    
    // Add grid overlay on top surface
    if (window.assetManager && window.assetManager.textures && window.assetManager.textures['grid']) {
      // Create a separate material for the tray grid that doesn't affect the room's grid
      const trayGridMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        map: window.assetManager.textures['grid'].clone(), // Clone to avoid affecting room's texture
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      
      // Configure the grid texture to repeat properly for this tray only
      trayGridMaterial.map.repeat.set(this.width, this.length);
      trayGridMaterial.map.wrapS = THREE.RepeatWrapping;
      trayGridMaterial.map.wrapT = THREE.RepeatWrapping;
      
      // Create a plane for the grid just slightly above the table surface
      const gridGeometry = new THREE.PlaneGeometry(this.width, this.length);
      const gridPlane = new THREE.Mesh(gridGeometry, trayGridMaterial);
      
      // Position the grid just above the table surface (to prevent z-fighting)
      gridPlane.position.set(
        this.width / 2 - 0.5,
        legHeight + topThickness + 0.001,
        this.length / 2 - 0.5
      );
      
      // Rotate the grid plane to be horizontal (face up)
      gridPlane.rotation.x = -Math.PI / 2;
      
      // IMPORTANT: Make the grid ignore raycast so we can interact with tiles beneath it
      gridPlane.raycast = () => null;
      
      group.add(gridPlane);
    }
    
    // Create table legs (four corners)
    const legGeometry = new THREE.BoxGeometry(0.1, legHeight, 0.1);
    
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Darker gray for legs
      roughness: 0.5,
      metalness: 0.5
    });
    
    // Positions for the four legs
    const legPositions = [
      {x: 0.1, z: 0.1},                       // Near left
      {x: this.width - 0.1, z: 0.1},          // Near right
      {x: 0.1, z: this.length - 0.1},         // Far left
      {x: this.width - 0.1, z: this.length - 0.1}, // Far right
    ];
    
    legPositions.forEach(pos => {
      const legMesh = new THREE.Mesh(legGeometry, legMaterial);
      legMesh.position.set(
        pos.x - 0.5, 
        legHeight/2, 
        pos.z - 0.5
      );
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
      this.width / 2 - 0.5,
      legHeight + topThickness + edgeHeight/2,
      0 - edgeThickness/2 - 0.5
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
      this.width / 2 - 0.5,
      legHeight + topThickness + edgeHeight/2,
      this.length - 0.5 + edgeThickness/2
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
      this.width - 0.5 + edgeThickness/2,
      legHeight + topThickness + edgeHeight/2,
      this.length / 2 - 0.5
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
      0 - 0.5 - edgeThickness/2,
      legHeight + topThickness + edgeHeight/2,
      this.length / 2 - 0.5
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
    // Convert global coordinates to local tray coordinates if needed
    let localX = x;
    let localY = y;
    
    // Use raw local coordinates if we're working with a tray tile
    if (typeof x === 'number' && typeof y === 'number') {
      // Check if the tile at x,y belongs to this tray
      const foundTile = this.getTile(x, y);
      if (foundTile) {
        // These are already local coordinates
        console.log(`Using local tray coordinates: (${x}, ${y})`);
        localX = x;
        localY = y;
      } else {
        // These might be room coordinates; convert to local tray coordinates
        localX = x - this.x;
        localY = y - this.y;
        console.log(`Converting room coordinates (${x}, ${y}) to local tray coordinates: (${localX}, ${localY})`);
      }
    }
    
    // Ensure coordinates are within tray bounds
    if (localX < 0 || localX >= this.width || localY < 0 || localY >= this.length) {
      console.error(`Local coordinates (${localX}, ${localY}) are outside the tray bounds (${this.width}x${this.length})`);
      return;
    }
    
    const tile = this.getTile(localX, localY);
    if (tile) {
      // Log para debugging
      console.log(`Tray: Placing building on tray tile at local (${localX}, ${localY})`, building);
      
      // Certifique-se de que o building existe antes de prosseguir
      if (!building) {
        console.error("Null building provided to placeBuilding");
        return;
      }
      
      // Remova qualquer construção existente na tile antes de adicionar a nova
      if (tile.building) {
        tile.building.dispose();
        tile.remove(tile.building);
      }
      
      // Adicione o building à tile
      tile.setBuilding(building);
      
      // Certifique-se de que o building está na posição correta
      // dentro da hierarquia da cena Three.js
      if (building) {
        // Adicione o building diretamente à tray para melhor visibilidade
        this.add(building);
        
        // Calcule a altura da superfície da tray
        const legHeight = metersToTileUnits(this.legHeight);
        const topThickness = metersToTileUnits(this.topThickness);
        const trayTopPosition = legHeight + topThickness;
        
        // Posicione o building corretamente em relação à tile, incluindo a altura da tray
        building.position.set(localX, trayTopPosition, localY);
        console.log(`Positioning building at height ${trayTopPosition} on tray`);
        
        // Certifique-se de que o userData está configurado corretamente
        if (building.mesh) {
          building.mesh.traverse((obj) => {
            if (obj.isMesh) {
              obj.userData = {
                instance: building,
                parentTile: tile,
                id: Math.random().toString(36).substr(2, 9)
              };
              
              // Certifique-se de que o mesh está visível e com sombras adequadas
              obj.visible = true;
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });
        }
        
        // Atualize a visualização do building para garantir que seja renderizado corretamente
        building.refreshView();
        
        // Atualize a visualização da tile
        tile.refreshView();
        
        // Forçar uma atualização da tray inteira
        this.refreshView();
        
        console.log("Building placed successfully", building);
      }
    } else {
      console.error(`No tile found at local coordinates (${localX}, ${localY}) on tray`);
    }
  }

  /**
   * Removes a building from the tray at the specified coordinates
   * @param {number} x The x-coordinate on the tray
   * @param {number} y The y-coordinate on the tray 
   * @param {Function} [showAlert] Optional callback to display alerts
   * @returns {boolean} True if the building was successfully removed, false otherwise
   */
  trash(x, y, showAlert) {
    console.log(`Tray.trash called with coordinates: (${x}, ${y})`);
    const tile = this.getTile(x, y);
    
    if (!tile) {
      console.error(`No tile found at (${x}, ${y}) in tray`);
      return false;
    }
    
    if (!tile.building) {
      console.error(`No building found at tile (${x}, ${y}) in tray`);
      return false;
    }
    
    console.log(`Found building at (${x}, ${y}):`, tile.building.type);
    
    const wasPlant = tile.building.type === 'cannabis-plant';
    const wasPot = tile.building.type === 'pot';
    
    // Caso especial: se for uma planta diretamente na tray (improvável, mas possível)
    if (wasPlant) {
      console.log("Removing plant from tray directly");
      tile.building.dispose();
      tile.setBuilding(null);
      tile.refreshView();
      
      // Atualizar contagem de plantas
      const room = this.getRoom();
      if (room) {
        room.getPlantsModule().updatePlantCount();
      }
      return true;
    }
    
    // Caso especial: se for um pot com planta
    if (wasPot) {
      if (tile.building.plant) {
        console.log("Pot has a plant, showing warning");
        // Usar callback se fornecida, ou alert diretamente
        const alertMessage = 'O vaso não está vazio. Remova a planta primeiro antes de excluir o vaso.';
        if (typeof showAlert === 'function') {
          showAlert(alertMessage);
        } else {
          alert(alertMessage);
        }
        return false;
      } else {
        console.log("Removing empty pot from tray");
      }
    }
    
    // Remover o objeto (pot vazio ou outro)
    try {
      console.log("Disposing building:", tile.building);
      const building = tile.building;
      
      // Primeiro limpar a referência no tile
      tile.setBuilding(null);
      
      // Depois limpar recursos
      if (building.mesh) {
        if (building.parent) {
          building.parent.remove(building);
        }
        building.dispose();
      }
      
      // Atualizar a visualização
      tile.refreshView();
      this.refreshView();
      
      // Atualizar contadores apropriados
      const room = this.getRoom();
      if (room) {
        if (wasPot) {
          room.getPotsModule().updatePotCount();
        }
      }
      
      console.log("Building successfully removed from tray");
      return true;
    } catch (error) {
      console.error("Error removing building from tray:", error);
      return false;
    }
  }

  /**
   * Gets the room this tray is in
   * @returns {Room|null} The room or null if not found
   */
  getRoom() {
    // Walk up the parent chain until we find the Room
    let parent = this.parent;
    while (parent) {
      if (parent.userData && parent.userData.isRoom) {
        return parent.userData.instance;
      }
      parent = parent.parent;
    }
    
    // Alternative approach: get from the window
    if (window.game && window.game.room) {
      return window.game.room;
    }
    
    return null;
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

  /**
   * Verifica se a tray está vazia (não possui nenhum objeto em cima)
   * @returns {boolean} true se a tray estiver vazia, false caso contrário
   */
  isEmpty() {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        const tile = this.getTile(x, y);
        if (tile && tile.building) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Encontra as coordenadas locais de um Tile dentro desta Tray
   * @param {Tile} tile O tile para encontrar
   * @returns {{x: number, y: number}|null} Coordenadas locais ou null se não encontrado
   */
  findTileLocalCoordinates(tile) {
    // Primeiro verificar os atributos personalizados
    if (tile.localX !== undefined && tile.localY !== undefined) {
      return { x: tile.localX, y: tile.localY };
    }
    
    // Verificar o userData
    if (tile.mesh && tile.mesh.userData && 
        tile.mesh.userData.localX !== undefined && 
        tile.mesh.userData.localY !== undefined) {
      return { 
        x: tile.mesh.userData.localX, 
        y: tile.mesh.userData.localY 
      };
    }
    
    // Busca exaustiva
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.length; y++) {
        if (this.getTile(x, y) === tile) {
          return { x, y };
        }
      }
    }
    
    // Última tentativa: tentar converter de coordenadas globais
    if (tile.x !== undefined && tile.y !== undefined && 
        this.x !== undefined && this.y !== undefined) {
      const localX = tile.x - this.x;
      const localY = tile.y - this.y;
      
      // Verificar se as coordenadas locais calculadas estão dentro dos limites da tray
      if (localX >= 0 && localX < this.width && 
          localY >= 0 && localY < this.length) {
        return { x: localX, y: localY };
      }
    }
    
    return null;
  }
} 