import * as THREE from 'three';
import { BuildingType } from './buildings/buildingType.js';
import { createBuilding } from './buildings/buildingObjects.js';
import { Tile } from './tile.js';
import { Service } from './services/service.js';
import { PlantsModule } from './buildings/modules/plants.js';
import { TraysModule } from './buildings/modules/trays.js';
import { PotsModule } from './buildings/modules/pots.js';
import { TILE_SCALE, metersToTileUnits } from './constants.js';

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
   * @type {Service}
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
   * Wall height in meters
   * @type {number}
   */
  wallHeight = 3;
  /**
   * Wall thickness in meters
   * @type {number}
   */
  wallThickness = 0.2;
  /**
   * Walls of the room
   * @type {THREE.Mesh[]}
   */
  walls = [];
  /**
   * Double door in the wall
   * @type {THREE.Group}
   */
  door = null;
  /**
   * Width of the door in tiles
   * @type {number}
   */
  doorWidth = 2;
  /**
   * Position of the door (starting tile)
   * @type {{x: number, y: number}}
   */
  doorPosition = null;
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
   * @type {PlantsModule}
   */
  #plantsModule;
  /**
   * @type {TraysModule}
   */
  #traysModule;
  /**
   * @type {PotsModule}
   */
  #potsModule;
  /**
   * @type {THREE.Group}
   */
  wallGroup;
  /**
   * @type {Object}
   */
  vehicleGraph;
  /**
   * @type {Object}
   */
  lastService;

  constructor(width, height, wallHeight = 3, wallThickness = 0.2, name = 'My Room') {
    super();

    this.name = name;
    this.width = width;
    this.height = height;
    // Convert meters to tile units
    this.wallHeight = metersToTileUnits(wallHeight);
    this.wallThickness = metersToTileUnits(wallThickness);
    
    // Add userData to identify this as a Room
    this.userData = {
      isRoom: true,
      instance: this
    };
    
    this.add(this.debugMeshes);
    this.add(this.root);

    this.tiles = [];
    for (let x = 0; x < this.width; x++) {
      const column = [];
      for (let y = 0; y < this.height; y++) {
        const tile = new Tile(x, y);
        tile.setBuilding(null); // Don't initialize with plants
        tile.refreshView(this);
        this.root.add(tile);
        column.push(tile);
      }
      this.tiles.push(column);
    }

    this.services = [];
    this.#plantsModule = new PlantsModule(this);
    this.#traysModule = new TraysModule(this);
    this.#potsModule = new PotsModule(this);
    
    // Create walls after tiles
    this.createWalls();

    // Create the vehicle graph
    this.vehicleGraph = {
      updateTile: (x, y, building) => { }
    };
  }

  /**
   * Creates walls around the room
   */
  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1
    });

    // Create group for wall elements
    this.wallGroup = new THREE.Group();
    this.root.add(this.wallGroup);
    
    // Create north wall
    // Adjust width to include thickness of side walls
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.width + this.wallThickness * 2, this.wallHeight, this.wallThickness),
      wallMaterial
    );
    // Position exactly on north edge, expanded to cover east and west walls
    northWall.position.set(this.width / 2 - 0.5, this.wallHeight / 2, - this.wallThickness / 2 - 0.5);
    northWall.userData.isWall = true;
    northWall.userData.wallSide = 'north';
    this.wallGroup.add(northWall);
    this.walls.push(northWall);
    
    // Add label for north wall
    this.addWallLabel(northWall, 'NORTH', 0xaa0000);

    // Create south wall
    // Adjust width to include thickness of side walls
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.width + this.wallThickness * 2, this.wallHeight, this.wallThickness),
      wallMaterial
    );
    // Position exactly on south edge, expanded to cover east and west walls
    southWall.position.set(this.width / 2 - 0.5, this.wallHeight / 2, this.height + this.wallThickness / 2 - 0.5);
    southWall.userData.isWall = true;
    southWall.userData.wallSide = 'south';
    this.wallGroup.add(southWall);
    this.walls.push(southWall);
    
    // Add label for south wall
    this.addWallLabel(southWall, 'SOUTH', 0x00aa00);

    // Create east wall
    // Adjust length to consider space between north and south walls
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.wallThickness, this.wallHeight, this.height + this.wallThickness * 2),
      wallMaterial
    );
    // Position exactly on east edge
    eastWall.position.set(this.width + this.wallThickness / 2 - 0.5, this.wallHeight / 2, this.height / 2 - 0.5);
    eastWall.userData.isWall = true;
    eastWall.userData.wallSide = 'east';
    this.wallGroup.add(eastWall);
    this.walls.push(eastWall);
    
    // Add label for east wall
    this.addWallLabel(eastWall, 'EAST', 0x0000aa);

    // Create west wall
    // Adjust length to consider space between north and south walls
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(this.wallThickness, this.wallHeight, this.height + this.wallThickness * 2),
      wallMaterial
    );
    // Position exactly on west edge
    westWall.position.set(-this.wallThickness / 2 - 0.5, this.wallHeight / 2, this.height / 2 - 0.5);
    westWall.userData.isWall = true;
    westWall.userData.wallSide = 'west';
    this.wallGroup.add(westWall);
    this.walls.push(westWall);
    
    // Add label for west wall
    this.addWallLabel(westWall, 'WEST', 0xaa00aa);
  }
  
  /**
   * Adiciona um rótulo de texto à parede
   * @param {THREE.Mesh} wall A parede a ser rotulada
   * @param {string} text O texto do rótulo
   * @param {number} color A cor do texto em formato hexadecimal
   */
  addWallLabel(wall, text, color) {
    // Criar canvas para o texto
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // Configurar estilo do texto
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 60px Arial';
    context.fillStyle = '#' + color.toString(16).padStart(6, '0');
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Criar textura a partir do canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Criar plano com o texto
    const labelGeometry = new THREE.PlaneGeometry(1.5, 0.75);
    const label = new THREE.Mesh(labelGeometry, material);
    
    // Posicionar o rótulo de acordo com a parede
    const side = wall.userData.wallSide;
    if (side === 'north') {
      label.position.set(0, this.wallHeight / 2 + 0.5, 0.01);
      label.rotation.y = Math.PI * 2;
    } else if (side === 'south') {
      label.position.set(0, this.wallHeight / 2 + 0.5, 0.01);
      label.rotation.y = Math.PI;
    } else if (side === 'east') {
      label.position.set(0.01, this.wallHeight / 2 + 0.5, 0);
      label.rotation.y = -Math.PI / 2;
    } else if (side === 'west') {
      label.position.set(-0.01, this.wallHeight / 2 + 0.5, 0);
      label.rotation.y = Math.PI / 2;
    }
    
    wall.add(label);
    wall.userData.label = label;
  }

  /**
   * Places a double door in the wall at the specified position with the specified width
   * @param {number} x Starting X coordinate
   * @param {number} y Starting Y coordinate
   * @param {number} width Width of the door in tiles
   */
  placeDoor(x, y, width = 2) {
    // Remove any existing door
    if (this.door) {
      this.door.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.wallGroup.remove(this.door);
      this.door = null;
    }

    this.doorPosition = { x, y };
    this.doorWidth = width;
    this.door = new THREE.Group();
    
    // Determine which wall to place the door on
    let wallSide;
    
    if (y === 0) {
      wallSide = 'north';
    } else if (y === this.height - 1) {
      wallSide = 'south';
    } else if (x === 0) {
      wallSide = 'west';
    } else if (x === this.width - 1) {
      wallSide = 'east';
    } else {
      console.error('Door must be placed on the edge of the room');
      return;
    }
    
    // Create materials
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xd5d5d5,  // Light gray for the door
      roughness: 0.5,
      metalness: 0.3
    });
    
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,  // Darker metal for push bars
      roughness: 0.2,
      metalness: 0.8
    });
    
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.6
    });
    
    // Door dimensions
    let doorHeight;
    if (this.wallHeight < 2.3) {
      doorHeight = this.wallHeight * 0.9;  // Make doors shorter than wall
    } else {
      doorHeight = metersToTileUnits(2.2);  // Standard door height converted to tile units
    }
    
    // Determina se teremos uma ou duas portas
    const useSingleDoor = width === 3;
    
    // Quando width = 1, a porta única ocupa todo o espaço
    // Quando width >= 2, dividimos o espaço entre duas portas
    const doorUnitWidth = useSingleDoor ? width : width / 2;
    
    const doorThickness = this.wallThickness;  // Same thickness as wall for better visibility
    
    // Create a single door panel
    const createDoorPanel = (isLeft = true, isSingleDoor = false) => {
      const doorGroup = new THREE.Group();
      
      // Calculate panel width - if it's a single door, it has width of 1 tile
      // Otherwise, each panel has width of (total width/2)
      const panelWidth = isSingleDoor ? 3 : doorUnitWidth;
      
      // Main door panel
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(
          wallSide === 'north' || wallSide === 'south' ? panelWidth : doorThickness,
          doorHeight,
          wallSide === 'north' || wallSide === 'south' ? doorThickness : panelWidth
        ),
        doorMaterial
      );
      doorGroup.add(doorPanel);
      
      // Commercial push bar parameters (horizontal panic bar)
      const barWidth = (wallSide === 'north' || wallSide === 'south' ? panelWidth : panelWidth) * 0.7;
      const barHeight = metersToTileUnits(0.05);
      const barThickness = metersToTileUnits(0.05);
      const barY = doorHeight * (-0.1); // Position at about 10% of door height
      const barOffset = doorThickness * 0.7;
      
      // Adicionar barra antipânico no lado externo
      const createPushBar = (isExterior) => {
        const pushBar = new THREE.Mesh(
          new THREE.BoxGeometry(
            wallSide === 'north' || wallSide === 'south' ? barWidth : barThickness,
            barHeight,
            wallSide === 'north' || wallSide === 'south' ? barThickness : barWidth
          ),
          metalMaterial
        );
        
        // Position the bar slightly outside the door, on appropriate side
        if (wallSide === 'north') {
          pushBar.position.set(0, barY, isExterior ? barOffset : -barOffset);
        } else if (wallSide === 'south') {
          pushBar.position.set(0, barY, isExterior ? -barOffset : barOffset);
        } else if (wallSide === 'east') {
          pushBar.position.set(isExterior ? -barOffset : barOffset, barY, 0);
        } else if (wallSide === 'west') {
          pushBar.position.set(isExterior ? barOffset : -barOffset, barY, 0);
        }
        
        doorGroup.add(pushBar);
        
        // Bar supports (vertical pieces) for each side
        const supportWidth = metersToTileUnits(0.04);
        const supportHeight = metersToTileUnits(0.2);
        const supportThickness = metersToTileUnits(0.04);
        const supportDistance = barWidth * 0.4;
        
        // Left vertical support
        const leftSupport = new THREE.Mesh(
          new THREE.BoxGeometry(
            wallSide === 'north' || wallSide === 'south' ? supportWidth : supportThickness,
            supportHeight,
            wallSide === 'north' || wallSide === 'south' ? supportThickness : supportWidth
          ),
          metalMaterial
        );
        
        // Right vertical support
        const rightSupport = leftSupport.clone();
        
        // Position the supports
        if (wallSide === 'north' || wallSide === 'south') {
          leftSupport.position.set(-supportDistance, barY, isExterior ? barOffset/2 : -barOffset/2);
          rightSupport.position.set(supportDistance, barY, isExterior ? barOffset/2 : -barOffset/2);
        } else {
          leftSupport.position.set(isExterior ? barOffset/2 : -barOffset/2, barY, -supportDistance);
          rightSupport.position.set(isExterior ? barOffset/2 : -barOffset/2, barY, supportDistance);
        }
        
        doorGroup.add(leftSupport);
        doorGroup.add(rightSupport);
      };
      
      // Criar barras antipânico em ambos os lados da porta
      createPushBar(true);  // barra no lado externo
      createPushBar(false); // barra no lado interno
      
      // Window in door
      const windowWidth = (wallSide === 'north' || wallSide === 'south' ? panelWidth : panelWidth) * 0.7;
      const windowHeight = doorHeight * 0.4;
      const windowThickness = doorThickness * 1.1;
      const windowY = doorHeight * 0.2; // Window position 
      
      const doorWindow = new THREE.Mesh(
        new THREE.BoxGeometry(
          wallSide === 'north' || wallSide === 'south' ? windowWidth : windowThickness,
          windowHeight,
          wallSide === 'north' || wallSide === 'south' ? windowThickness : windowWidth
        ),
        glassMaterial
      );
      
      doorWindow.position.set(0, windowY, 0);
      doorGroup.add(doorWindow);
      
      // Door frame (outline)
      const frameThickness = metersToTileUnits(0.03);
      const frameDepth = metersToTileUnits(0.02);
      
      // Create door frame edges
      if (wallSide === 'north' || wallSide === 'south') {
        // Top frame
        const topFrame = new THREE.Mesh(
          new THREE.BoxGeometry(panelWidth + frameThickness*2, frameThickness, doorThickness + frameDepth*2),
          metalMaterial
        );
        topFrame.position.set(0, doorHeight/2 + frameThickness/2, 0);
        doorGroup.add(topFrame);
        
        // Bottom frame
        const bottomFrame = new THREE.Mesh(
          new THREE.BoxGeometry(panelWidth + frameThickness*2, frameThickness, doorThickness + frameDepth*2),
          metalMaterial
        );
        bottomFrame.position.set(0, -doorHeight/2 - frameThickness/2, 0);
        doorGroup.add(bottomFrame);
        
        // Left side frame
        const leftFrame = new THREE.Mesh(
          new THREE.BoxGeometry(frameThickness, doorHeight + frameThickness*2, doorThickness + frameDepth*2),
          metalMaterial
        );
        leftFrame.position.set(-panelWidth/2 - frameThickness/2, 0, 0);
        doorGroup.add(leftFrame);
        
        // Right side frame
        const rightFrame = new THREE.Mesh(
          new THREE.BoxGeometry(frameThickness, doorHeight + frameThickness*2, doorThickness + frameDepth*2),
          metalMaterial
        );
        rightFrame.position.set(panelWidth/2 + frameThickness/2, 0, 0);
        doorGroup.add(rightFrame);
      } else {
        // Top frame
        const topFrame = new THREE.Mesh(
          new THREE.BoxGeometry(doorThickness + frameDepth*2, frameThickness, panelWidth + frameThickness*2),
          metalMaterial
        );
        topFrame.position.set(0, doorHeight/2 + frameThickness/2, 0);
        doorGroup.add(topFrame);
        
        // Bottom frame
        const bottomFrame = new THREE.Mesh(
          new THREE.BoxGeometry(doorThickness + frameDepth*2, frameThickness, panelWidth + frameThickness*2),
          metalMaterial
        );
        bottomFrame.position.set(0, -doorHeight/2 - frameThickness/2, 0);
        doorGroup.add(bottomFrame);
        
        // Left side frame
        const leftFrame = new THREE.Mesh(
          new THREE.BoxGeometry(doorThickness + frameDepth*2, doorHeight + frameThickness*2, frameThickness),
          metalMaterial
        );
        leftFrame.position.set(0, 0, -panelWidth/2 - frameThickness/2);
        doorGroup.add(leftFrame);
        
        // Right side frame
        const rightFrame = new THREE.Mesh(
          new THREE.BoxGeometry(doorThickness + frameDepth*2, doorHeight + frameThickness*2, frameThickness),
          metalMaterial
        );
        rightFrame.position.set(0, 0, panelWidth/2 + frameThickness/2);
        doorGroup.add(rightFrame);
      }
      
      return doorGroup;
    };
    
    // Get correct wall position from the existing walls
    let doorWallX, doorWallZ;
    
    for (const wall of this.walls) {
      if (wall.userData.wallSide === wallSide) {
        if (wallSide === 'north' || wallSide === 'south') {
          doorWallZ = wall.position.z;
        } else if (wallSide === 'east' || wallSide === 'west') {
          doorWallX = wall.position.x;
        }
        break;
      }
    }
    
    const doorPositionY = doorHeight / 2;
    
    // Se width = 1, criamos apenas uma porta
    if (useSingleDoor) {
      const singleDoor = createDoorPanel(true, true);
      
      // Posicionar a porta única exatamente no tile selecionado
      switch (wallSide) {
        case 'north':
        case 'south':
          // Para norte/sul, centralizamos a porta no meio do tile X
          singleDoor.position.set(x + 1, doorPositionY, doorWallZ);
          break;
        case 'east':
        case 'west':
          // Para leste/oeste, centralizamos a porta no meio do tile Y
          singleDoor.position.set(doorWallX, doorPositionY, y + 1);
          break;
      }
      
      singleDoor.userData.isDoor = true;
      this.door.add(singleDoor);
    }
    // Se width >= 2, criamos duas portas
    else {
      const leftDoor = createDoorPanel(true);
      const rightDoor = createDoorPanel(false);
      
      switch (wallSide) {
        case 'north':
        case 'south':
          // Para norte/sul, posicionamos as duas portas lado a lado ao longo do eixo X
          // A porta esquerda começa exatamente na coordenada X selecionada
          leftDoor.position.set(x + doorUnitWidth/2 - 0.5, doorPositionY, doorWallZ);
          rightDoor.position.set(x + doorUnitWidth + doorUnitWidth/2 - 0.5, doorPositionY, doorWallZ);
          break;
        case 'east':
        case 'west':
          // Para leste/oeste, posicionamos as duas portas lado a lado ao longo do eixo Z
          // A porta esquerda começa exatamente na coordenada Y selecionada
          leftDoor.position.set(doorWallX, doorPositionY, y + doorUnitWidth/2 - 0.5);
          rightDoor.position.set(doorWallX, doorPositionY, y + doorUnitWidth + doorUnitWidth/2 - 0.5);
          break;
      }
      
      leftDoor.userData.isDoor = true;
      rightDoor.userData.isDoor = true;
      this.door.add(leftDoor);
      this.door.add(rightDoor);
    }
    
    // Add door to wall group (but don't modify walls)
    this.wallGroup.add(this.door);
  }

  /**
   * Updates the visibility of walls based on camera azimuth
   * @param {number} cameraAzimuth Camera rotation in degrees
   * @param {number} cameraElevation Camera elevation in degrees
   */
  updateWallVisibility(cameraAzimuth, cameraElevation) {
    // If elevation is above 60°, show all walls
    if (cameraElevation > 60) {
      this.wallGroup.traverse((obj) => {
        if (obj.userData && obj.userData.isWall) {
          obj.visible = true;
          obj.userData.skipRaycast = false;
        }
      });
      
      // Also show the door if it exists
      if (this.door) {
        this.door.visible = true;
        this.door.traverse(obj => {
          obj.userData.skipRaycast = false;
        });
      }
      
      return;
    }
    
    // Normalize angle to 0-360
    const angle = ((cameraAzimuth % 360) + 360) % 360;
    
    // Default to all walls visible
    this.wallGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isWall) {
        obj.visible = true;
        obj.userData.skipRaycast = false;
      }
    });
    
    // Identify which walls should be hidden based on angle
    let hiddenWalls = [];
    
    // Rules for exact angles - hide only one specific wall
    if (Math.abs(angle - 0) < 0.1 || Math.abs(angle - 360) < 0.1) {
      hiddenWalls = ['south'];
    } else if (Math.abs(angle - 90) < 0.1) {
      hiddenWalls = ['east'];
    } else if (Math.abs(angle - 180) < 0.1) {
      hiddenWalls = ['north'];
    } else if (Math.abs(angle - 270) < 0.1) {
      hiddenWalls = ['west'];
    }
    // Rules for angle ranges - hide specific combinations of two walls
    else if (angle > 0 && angle < 90) {
      hiddenWalls = ['south', 'east'];
    } else if (angle > 90 && angle < 180) {
      hiddenWalls = ['north', 'east'];
    } else if (angle > 180 && angle < 270) {
      hiddenWalls = ['north', 'west'];
    } else if (angle > 270 && angle < 360) {
      hiddenWalls = ['south', 'west'];
    }
    
    // Apply visibility to walls
    this.wallGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isWall) {
        const side = obj.userData.wallSide;
        if (hiddenWalls.includes(side)) {
          obj.visible = false;
          obj.userData.skipRaycast = true;
        }
      }
    });
    
    // Door visibility should match wall visibility
    if (this.door) {
      const doorSide = this.doorPosition.y === 0 ? 'north' :
                     this.doorPosition.y === this.height - 1 ? 'south' :
                     this.doorPosition.x === 0 ? 'west' : 'east';
      
      const doorVisible = !hiddenWalls.includes(doorSide);
      
      this.door.visible = doorVisible;
      this.door.traverse(obj => {
        obj.userData.skipRaycast = !doorVisible;
      });
    }
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
   * @returns {boolean} True if building was placed, false otherwise
   */
  placeBuilding(x, y, buildingType) {
    const tile = this.getTile(x, y);

    // If the tile doesn't already have a building, place one there
    if (tile && !tile.building) {
      // Special rule: if trays exist and buildingType is pot, pots can only be placed on trays
      if (buildingType === 'pot' && this.#traysModule.hasTrays()) {
        console.warn('Pots can only be placed on trays when trays are present in the room');
        return false;
      }
      
      // Special rule: if buildingType is cannabis-plant, it can only be placed on pots
      if (buildingType === 'cannabis-plant') {
        console.warn('Cannabis plants can only be placed in pots');
        return false;
      }
      
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

      // Update counters based on building type
      if (buildingType === 'cannabis-plant') {
        this.#plantsModule.updatePlantCount();
      } else if (buildingType === 'tray') {
        this.#traysModule.updateTrayCount();
      } else if (buildingType === 'pot') {
        this.#potsModule.updatePotCount();
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Trashes the building at the specified coordinates
   * @param {number} x 
   * @param {number} y
   */
  trash(x, y) {
    const tile = this.getTile(x, y);
    
    // Return if tile doesn't exist
    if (!tile) return;
    
    // Return if there's no building on the tile
    if (!tile.building) return;

    const buildingType = tile.building.type;
    const wasPlant = buildingType === 'cannabis-plant';
    const wasTray = buildingType === 'tray';
    const wasPot = buildingType === 'pot';

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

    // Atualiza a contagem de plantas se uma planta foi removida
    if (wasPlant) {
      this.#plantsModule.updatePlantCount();
    }
    if (wasTray) {
      this.#traysModule.updateTrayCount();
      // When a tray is removed, we need to update pot counts too
      // since they may have contained pots
      this.#potsModule.updatePotCount();
      this.#plantsModule.updatePlantCount(); // Also update plants as they may have been on pots
    }
    if (wasPot) {
      this.#potsModule.updatePotCount();
      // If a pot had a plant, update the plant count too
      this.#plantsModule.updatePlantCount();
    }
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
   * Gets the plants module for the room
   * @returns {PlantsModule}
   */
  getPlantsModule() {
    return this.#plantsModule;
  }

  /**
   * Gets the trays module for the room
   * @returns {TraysModule}
   */
  getTraysModule() {
    return this.#traysModule;
  }

  /**
   * Gets the pots module for the room
   * @returns {PotsModule}
   */
  getPotsModule() {
    return this.#potsModule;
  }
}