import * as THREE from 'three';
import { AssetManager } from './assets/assetManager.js';
import { CameraManager } from './camera.js';
import { InputManager } from './input.js';
import { Room } from './sim/room.js';
import { Object } from './sim/object.js';
import { Tile } from './sim/tile.js';
import { Pot } from './sim/buildings/objects/pot.js';
import { Slab } from './sim/buildings/objects/slab.js';
import { Tray } from './sim/buildings/objects/tray.js';
import { CannabisPlant } from './sim/buildings/objects/cannabisPlant.js';
import { TILE_SCALE, metersToTileUnits } from './sim/constants.js';

/** 
 * Manager for the Three.js scene. Handles rendering of a `Room` object
 */
export class Game {
  /**
   * @type {Room}
   */
  room;
  /**
   * Object that currently hs focus
   * @type {Object | null}
   */
  focusedObject = null;
  /**
   * Class for managing user input
   * @type {InputManager}
   */
  inputManager;
  /**
   * Object that is currently selected
   * @type {Object | null}
   */
  selectedObject = null;
  /**
   * Tile that is currently selected
   * @type {Tile | null}
   */
  selectedTile = null;
  _lastTouch = { x: null, y: null, dist: null };
  highlightedTiles = [];

  constructor(room) {
    this.room = room;

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true
    });
    this.scene = new THREE.Scene();

    this.inputManager = new InputManager(window.ui.gameWindow);
    this.cameraManager = new CameraManager(window.ui.gameWindow);

    // Configure the renderer
    this.renderer.setSize(window.ui.gameWindow.clientWidth, window.ui.gameWindow.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Add the renderer to the DOM
    window.ui.gameWindow.appendChild(this.renderer.domElement);

    // Variables for object selection
    this.raycaster = new THREE.Raycaster();

    /**
     * Global instance of the asset manager
     */
    window.assetManager = new AssetManager(() => {
      window.ui.hideLoadingText();

      // Create room with the specified grid size: 36 x 280 tiles
      this.room = new Room(36, 280, 3, 0.2);
      this.initialize(this.room);
      this.start();

      setInterval(this.simulate.bind(this), 1000);
    });

    window.addEventListener('resize', this.onResize.bind(this), false);
  }

  /**
   * Initalizes the scene, clearing all existing assets
   */
  initialize(room) {
    this.scene.clear();
    this.scene.add(room);
    this.#setupLights();
    this.#setupGrid(room);
  }

  #setupGrid(room) {
    // Add the grid
    const gridMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      map: window.assetManager.textures['grid'],
      transparent: true,
      opacity: 0.2
    });
    gridMaterial.map.repeat = new THREE.Vector2(room.width, room.height);
    gridMaterial.map.wrapS = room.width;
    gridMaterial.map.wrapT = room.height;

    const grid = new THREE.Mesh(
      new THREE.BoxGeometry(room.width, 0.1, room.height),
      gridMaterial
    );
    grid.position.set(room.width / 2 - 0.5, -0.04, room.height / 2 - 0.5);
    this.scene.add(grid);
  }

  /**
   * Setup the lights for the scene
   */
  #setupLights() {
    const centerX = this.room.width / 2 - 0.5;
    const centerZ = this.room.height / 2 - 0.5;

    // Luz direcional exatamente acima do centro da sala
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(centerX, 40, centerZ);
    sun.castShadow = true;
    sun.shadow.camera.left = -this.room.width;
    sun.shadow.camera.right = this.room.width;
    sun.shadow.camera.top = this.room.height;
    sun.shadow.camera.bottom = -this.room.height;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.normalBias = 0.01;
    this.scene.add(sun);

    // Luz ambiente para suavizar sombras
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  }
  
  /**
   * Starts the renderer
   */
  start() {
    this.renderer.setAnimationLoop(this.draw.bind(this));
  }

  /**
   * Stops the renderer
   */
  stop() {
    this.renderer.setAnimationLoop(null);
  }

  /**
   * Render the contents of the scene
   */
  draw() {
    // --- TOUCH CAMERA CONTROLS (mobile nav mode) ---
    if (window.ui.navMode && ('ontouchstart' in window)) {
      const im = this.inputManager;
      // ROTATE (1 dedo)
      if (im.isRightMouseDown && !im._touchDeltaDist) {
        if (this._lastTouch.x !== null && this._lastTouch.y !== null) {
          const dx = im.mouse.x - this._lastTouch.x;
          const dy = im.mouse.y - this._lastTouch.y;
          this.cameraManager.cameraAzimuth += -(dx * 0.2); // igual ao AZIMUTH_SENSITIVITY
          this.cameraManager.cameraElevation += (dy * 0.2);
          this.cameraManager.cameraElevation = Math.min(90, Math.max(0, this.cameraManager.cameraElevation));
        }
        this._lastTouch.x = im.mouse.x;
        this._lastTouch.y = im.mouse.y;
      } else if (im.isRightMouseDown && im._touchDeltaDist !== undefined) {
        // PAN/ZOOM (2 dedos)
        if (this._lastTouch.x !== null && this._lastTouch.y !== null) {
          const dx = im.mouse.x - this._lastTouch.x;
          const dy = im.mouse.y - this._lastTouch.y;
          // Pan
          const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraManager.cameraAzimuth * Math.PI/180);
          const left = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0,1,0), this.cameraManager.cameraAzimuth * Math.PI/180);
          this.cameraManager.cameraOrigin.add(forward.multiplyScalar(-0.01 * dy));
          this.cameraManager.cameraOrigin.add(left.multiplyScalar(-0.01 * dx));
        }
        // Zoom
        if (this._lastTouch.dist !== null && im._touchDeltaDist !== undefined) {
          this.cameraManager.cameraRadius *= 1 - (im._touchDeltaDist * 0.002 / 100);
          this.cameraManager.cameraRadius = Math.min(5, Math.max(0.1, this.cameraManager.cameraRadius));
        }
        this._lastTouch.x = im.mouse.x;
        this._lastTouch.y = im.mouse.y;
        this._lastTouch.dist = im._touchStartDist + (im._touchDeltaDist || 0);
      } else {
        this._lastTouch.x = null;
        this._lastTouch.y = null;
        this._lastTouch.dist = null;
      }
      this.cameraManager.updateCameraPosition();
    }
    // --- FIM TOUCH CAMERA CONTROLS ---
    
    // Update wall visibility based on camera angle
    if (this.room.wallGroup) {
      this.room.updateWallVisibility(this.cameraManager.cameraAzimuth, this.cameraManager.cameraElevation);
    }
    
    // Update angle display in UI
    try {
      if (window.ui && typeof window.ui.updateAngleDisplay === 'function') {
        window.ui.updateAngleDisplay(
          this.cameraManager.cameraAzimuth,
          this.cameraManager.cameraElevation,
          0 // Rotação (não temos rotação no eixo z atualmente)
        );
      }
    } catch (error) {
      console.warn('Erro ao atualizar ângulo na interface:', error);
    }

    this.updateFocusedObject();

    if (this.inputManager.isLeftMouseDown) {
      this.useTool();
    }

    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  /**
   * Moves the simulation forward by one step
   */
  simulate() {
    if (window.ui.isPaused) return;

    // Update the room data model first, then update the scene
    this.room.simulate(1);

    // window.ui.updateTitleBar(this);
    window.ui.updateInfoPanel(this.selectedObject);
  }

  /**
   * Sets the object that is currently highlighted
   */
  updateFocusedObject() {  
    this.focusedObject?.setFocused(false);
    
    const newObject = this.#raycast();
    
    // Reset previously highlighted objects for multi-tile objects
    if (this.highlightedTiles) {
      for (const tile of this.highlightedTiles) {
        tile.setFocused(false);
      }
      this.highlightedTiles = [];
    }
    
    // If we're placing a multi-tile object (tray, slab), highlight all affected tiles
    if (newObject && window.ui.activeToolId) {
      if (window.ui.activeToolId === 'tray' && newObject instanceof Tile) {
        const { x, y } = newObject;
        const config = window.ui.getTrayConfig();
        this.highlightedTiles = [];
        
        // Check if all required tiles are available
        let allTilesAvailable = true;
        for (let dx = 0; dx < config.width; dx++) {
          for (let dy = 0; dy < config.length; dy++) {
            const checkX = x + dx;
            const checkY = y + dy;
            const checkTile = this.room.getTile(checkX, checkY);
            
            if (!checkTile || checkTile.building) {
              allTilesAvailable = false;
            } else if (checkTile) {
              this.highlightedTiles.push(checkTile);
            }
          }
        }
        
        // Highlight all tiles with appropriate color
        for (const tile of this.highlightedTiles) {
          tile.setFocused(true, allTilesAvailable ? 0x00FF00 : 0xFF0000);
        }
      } else if (window.ui.activeToolId === 'slab' && 
                 newObject.parent?.userData?.instance?.type === 'tray') {
        // Handle slab highlighting on a tray
        const tray = newObject.parent.userData.instance;
        const trayTile = newObject;
        const config = window.ui.getSlabConfig();
        this.highlightedTiles = [];
        
        // Check if there's enough space for the slab
        let spaceAvailable = true;
        for (let i = 0; i < config.length; i++) {
          const checkY = trayTile.y + i;
          const checkTile = tray.getTile(trayTile.x, checkY);
          if (!checkTile || checkY >= tray.length || checkTile.building) {
            spaceAvailable = false;
            break;
          } else {
            this.highlightedTiles.push(checkTile);
          }
        }
        
        // Highlight all tiles with appropriate color
        for (const tile of this.highlightedTiles) {
          tile.setFocused(true, spaceAvailable ? 0x00FF00 : 0xFF0000);
        }
      }
    }
    
    if (newObject !== this.focusedObject) {
      this.focusedObject = newObject;
    }
    
    // Only set the focused state for individual objects if we're not showing multi-tile highlights
    if (this.focusedObject && (!this.highlightedTiles || this.highlightedTiles.length === 0)) {
      this.focusedObject.setFocused(true);
    }
  }

  /**
   * Uses the currently active tool
   */
  useTool() {
    switch (window.ui.activeToolId) {
      case 'select':
        this.updateSelectedObject();
        window.ui.updateInfoPanel(this.selectedObject);
        break;
      case 'trash':
        if (this.focusedObject) {
          const { x, y } = this.focusedObject;
          this.room.trash(x, y);
        }
        break;
      case 'double-door':
        if (this.focusedObject) {
          const { x, y } = this.focusedObject;
          // Check if the tile is at the edge of the room
          if (x === 0 || x === this.room.width - 1 || y === 0 || y === this.room.height - 1) {
            const doorWidth = window.ui.getDoorWidth();
            this.room.placeDoor(x, y, doorWidth);
          } else {
            console.warn('Doors can only be placed on the edge of the room');
          }
        }
        break;
      case 'pot':
        if (this.focusedObject) {
          // Check if we're placing on a room tile
          if (this.focusedObject instanceof Tile && this.focusedObject.parent === this.room.root) {
            const { x, y } = this.focusedObject;
            // Allow placing pot on empty room tile
            if (!this.focusedObject.building) {
              // Check if this tile is in a tray (not allowed)
              const isTileInTray = false; // We know this is a direct room tile
              
              if (!isTileInTray) {
                this.room.placeBuilding(x, y, 'pot');
                
                // Configure the pot after placing it
                const tile = this.room.getTile(x, y);
                if (tile && tile.building && tile.building.type === 'pot') {
                  window.ui.configurePot(tile.building);
                }
              }
            }
          } 
          // Check if we're placing on a tray tile
          else if (this.focusedObject.parent?.userData?.instance?.type === 'tray') {
            const tray = this.focusedObject.parent.userData.instance;
            const trayTile = this.focusedObject;
            
            // Add pot to the tray tile
            if (!trayTile.building) {
              const pot = new Pot(0, 0);
              window.ui.configurePot(pot);
              tray.placeBuilding(trayTile.x, trayTile.y, pot);
            }
          }
        }
        break;
      case 'slab':
        if (this.focusedObject && this.highlightedTiles && this.highlightedTiles.length > 0) {
          // Only place on tray tiles
          if (this.focusedObject.parent?.userData?.instance?.type === 'tray') {
            const tray = this.focusedObject.parent.userData.instance;
            const trayTile = this.focusedObject;
            
            // Check if there's enough space for the slab (already checked in updateFocusedObject)
            const spaceAvailable = this.highlightedTiles.every(tile => !tile.building);
            
            if (spaceAvailable) {
              const config = window.ui.getSlabConfig();
              const slab = new Slab(0, 0, config.length);
              slab.height = config.height;
              tray.placeBuilding(trayTile.x, trayTile.y, slab);
            }
          }
        }
        break;
      case 'tray':
        if (this.focusedObject && this.highlightedTiles && this.highlightedTiles.length > 0) {
          const { x, y } = this.focusedObject;
          
          // Check if all required tiles are available (already checked in updateFocusedObject)
          const allTilesAvailable = this.highlightedTiles.every(tile => !tile.building);
          
          if (allTilesAvailable) {
            const config = window.ui.getTrayConfig();
            
            // Place the tray
            this.room.placeBuilding(x, y, 'tray');
            
            // Configure the tray after placing it
            const tile = this.room.getTile(x, y);
            if (tile && tile.building && tile.building.type === 'tray') {
              const tray = tile.building;
              tray.width = config.width;
              tray.length = config.length;
              tray.legHeight = config.legHeight;
              tray.topThickness = config.topThickness;
              tray.edgeHeight = config.edgeHeight;
              tray.edgeThickness = config.edgeThickness;
              tray.initializeTiles();
              tray.refreshView();
            }
          } else {
            console.warn('Not enough space for the tray or it would overlap with another object');
          }
        }
        break;
      case 'cannabis-plant':
        if (this.focusedObject) {
          // Check if we're placing directly on a pot
          if (this.focusedObject.building?.type === 'pot') {
            const pot = this.focusedObject.building;
            if (!pot.plant) {
              const plant = new CannabisPlant(0, 0);
              plant.refreshView(); // Ensure plant has its mesh before adding
              pot.setPlant(plant);
            }
          }
          // Check if we're placing on a pot that's on a tray
          else if (this.focusedObject.building?.type === 'pot' && 
                   this.focusedObject.parent?.userData?.instance?.type === 'tray') {
            const pot = this.focusedObject.building;
            if (!pot.plant) {
              const plant = new CannabisPlant(0, 0);
              plant.refreshView(); // Ensure plant has its mesh before adding
              pot.setPlant(plant);
            }
          }
          // Check if we're placing on a slab
          else if (this.focusedObject.building?.type === 'slab') {
            const slab = this.focusedObject.building;
            // Determine position on the slab
            const localY = this.focusedObject.y - slab.y;
            if (localY >= 0 && localY < slab.length && !slab.plants[localY]) {
              const plant = new CannabisPlant(0, 0);
              plant.refreshView(); // Ensure plant has its mesh before adding
              slab.setPlant(plant, localY);
            }
          }
          // Do not allow direct placement on a room tile or a tray
          else if (this.focusedObject instanceof Tile) {
            console.warn('Cannabis plants can only be placed in pots or on slabs');
          }
        }
        break;
      default:
        if (this.focusedObject) {
          const { x, y } = this.focusedObject;
          this.room.placeBuilding(x, y, window.ui.activeToolId);
        }
        break;
    }
  }
  
  /**
   * Sets the currently selected object and highlights it
   */
  updateSelectedObject() {
    this.selectedObject?.setSelected(false);
    this.selectedObject = this.focusedObject;
    this.selectedObject?.setSelected(true);
    
    // Update the selected tile
    if (this.selectedObject instanceof Tile) {
      this.selectedTile = this.selectedObject;
    } else {
      this.selectedTile = null;
    }
  }

  /**
   * Gets the mesh currently under the the mouse cursor. If there is nothing under
   * the the mouse cursor, returns null
   * @param {MouseEvent} event Mouse event
   * @returns {THREE.Mesh | null}
   */
  #raycast() {
    var coords = {
      x: (this.inputManager.mouse.x / this.renderer.domElement.clientWidth) * 2 - 1,
      y: -(this.inputManager.mouse.y / this.renderer.domElement.clientHeight) * 2 + 1
    };

    this.raycaster.setFromCamera(coords, this.cameraManager.camera);

    // Filter out objects marked to skip raycast (hidden walls)
    let targets = [];
    this.room.root.traverse(object => {
      if (object.isMesh && (!object.userData || !object.userData.skipRaycast)) {
        targets.push(object);
      }
    });

    let intersections = this.raycaster.intersectObjects(targets, false);
    if (intersections.length > 0) {
      // Get the first intersection and find its parent Object
      let current = intersections[0].object;
      while (current && (!current.userData || !current.userData.instance)) {
        current = current.parent;
      }
      return current?.userData?.instance || null;
    } else {
      return null;
    }
  }

  /**
   * Resizes the renderer to fit the current game window
   */
  onResize() {
    this.cameraManager.resize(window.ui.gameWindow);
    this.renderer.setSize(window.ui.gameWindow.clientWidth, window.ui.gameWindow.clientHeight);
  }
}

// Create a new game when the window is loaded
window.onload = () => {
  window.game = new Game();
}