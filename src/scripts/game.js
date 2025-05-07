import * as THREE from 'three';
import { AssetManager } from './assets/assetManager.js';
import { CameraManager } from './camera.js';
import { InputManager } from './input.js';
import { Room } from './sim/room.js';
import { Object } from './sim/object.js';
import { Tile } from './sim/tile.js';
import { Pot } from './sim/buildings/objects/pot.js';
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
      this.room = new Room(36, 280, 3, 0.06);
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
    // Important: First check if the focused object has the setFocused method
    if (this.focusedObject && typeof this.focusedObject.setFocused === 'function') {
      this.focusedObject.setFocused(false);
    }
    
    const newObject = this.#raycast();
    
    // Reset previously highlighted objects for multi-tile objects
    if (this.highlightedTiles && this.highlightedTiles.length > 0) {
      for (const tile of this.highlightedTiles) {
        if (tile && typeof tile.setFocused === 'function') {
          tile.setFocused(false);
        }
      }
      this.highlightedTiles = [];
    }
    
    // If we're placing a multi-tile object (tray), highlight all affected tiles
    if (newObject && window.ui.activeToolId) {
      if (window.ui.activeToolId === 'tray' && newObject instanceof Tile) {
        const { x, y } = newObject;
        const config = window.ui.getTrayConfig();
        this.highlightedTiles = [];
        
        // Check if all required tiles are available and don't overlap with existing trays
        let allTilesAvailable = true;
        let trayOverlap = false;
        
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
            
            // Check for overlap with existing trays
            for (let sx = Math.max(0, checkX - 20); sx <= Math.min(this.room.width - 1, checkX + 20); sx++) {
              for (let sy = Math.max(0, checkY - 20); sy <= Math.min(this.room.height - 1, checkY + 20); sy++) {
                const surroundingTile = this.room.getTile(sx, sy);
                
                if (surroundingTile && surroundingTile.building && surroundingTile.building.type === 'tray') {
                  const existingTray = surroundingTile.building;
                  
                  // Check if the existing tray extends to the current position
                  if (checkX >= sx && checkX < sx + existingTray.width &&
                      checkY >= sy && checkY < sy + existingTray.length) {
                    trayOverlap = true;
                    break;
                  }
                }
              }
              if (trayOverlap) break;
            }
            if (trayOverlap) break;
          }
          if (trayOverlap) break;
        }
        
        // Highlight all tiles with appropriate color
        for (const tile of this.highlightedTiles) {
          if (tile && typeof tile.setFocused === 'function') {
            tile.setFocused(true, (allTilesAvailable && !trayOverlap) ? 0x00FF00 : 0xFF0000);
          }
        }
      } 
    }
    
    if (newObject !== this.focusedObject) {
      this.focusedObject = newObject;
    }
    
    // Only set the focused state for individual objects if we're not showing multi-tile highlights
    if (this.focusedObject && (!this.highlightedTiles || this.highlightedTiles.length === 0)) {
      if (typeof this.focusedObject.setFocused === 'function') {
        this.focusedObject.setFocused(true);
      }
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
            // Allow placing pot on empty room tile only if no trays exist
            if (!this.focusedObject.building) {
              const placementResult = this.room.placeBuilding(x, y, 'pot');
              
              // Configure the pot after placing it
              if (placementResult) {
                const tile = this.room.getTile(x, y);
                if (tile && tile.building && tile.building.type === 'pot') {
                  window.ui.configurePot(tile.building);
                }
              }
            }
          } 
          // Check if we're placing on a tray tile
          else if (this.focusedObject instanceof Tile) {
            // If it's a tile and not from the room, it must be from a tray
            // Find the parent tray by looking at the userData or parent chain
            let tray = null;
            
            // Check if parentTray is directly available in userData
            if (this.focusedObject.mesh && this.focusedObject.mesh.userData && this.focusedObject.mesh.userData.parentTray) {
              tray = this.focusedObject.mesh.userData.parentTray;
            } 
            // Check each tray in the room to see if it contains this tile
            else {
              this.room.root.traverse(object => {
                if (!tray && object.userData && object.userData.instance && object.userData.instance.type === 'tray') {
                  const checkTray = object.userData.instance;
                  // Check if this tile belongs to this tray
                  for (let x = 0; x < checkTray.width; x++) {
                    for (let y = 0; y < checkTray.length; y++) {
                      if (checkTray.getTile(x, y) === this.focusedObject) {
                        tray = checkTray;
                        break;
                      }
                    }
                    if (tray) break;
                  }
                }
              });
            }
            
            // If we found the parent tray, place the pot
            if (tray) {
              const trayTile = this.focusedObject;
              
              // Only add pot if the tile is empty
              if (!trayTile.building) {
                console.log("Placing pot on tray tile at", trayTile.x, trayTile.y);
                const pot = new Pot(0, 0);
                window.ui.configurePot(pot);
                
                // Use tray's local coordinates for placement
                const localX = trayTile.x;
                const localY = trayTile.y;
                
                // Let's add more logging to debug
                console.log(`Pot placement - Tray position: (${tray.x}, ${tray.y}), Local tile: (${localX}, ${localY})`);
                
                try {
                  // Place the pot using local coordinates
                  tray.placeBuilding(localX, localY, pot);
                  
                  // Update the pot counter when placing on a tray
                  this.room.getPotsModule().updatePotCount();
                } catch (error) {
                  console.error("Error placing pot on tray:", error);
                }
              }
            } else {
              console.error("No parent tray found for this tile");
            }
          } else if (this.focusedObject.type === 'pot') {
            // Direct pot selection - handle the case where a pot is already selected
            console.log("Pot directly selected - skipping placement");
          }
        }
        break;
      case 'tray':
        if (this.focusedObject && this.highlightedTiles && this.highlightedTiles.length > 0) {
          const { x, y } = this.focusedObject;
          
          // Check if all required tiles are available (already checked in updateFocusedObject)
          const allTilesAvailable = this.highlightedTiles.every(tile => !tile.building);
          
          // Additional check for tray overlap
          let trayOverlap = false;
          const config = window.ui.getTrayConfig();
          
          // Check if any of the tiles would overlap with an existing tray
          for (let dx = 0; dx < config.width; dx++) {
            for (let dy = 0; dy < config.length; dy++) {
              const checkX = x + dx;
              const checkY = y + dy;
              
              // Check surrounding tiles for trays that extend into this position
              for (let sx = Math.max(0, checkX - 20); sx <= Math.min(this.room.width - 1, checkX + 20); sx++) {
                for (let sy = Math.max(0, checkY - 20); sy <= Math.min(this.room.height - 1, checkY + 20); sy++) {
                  const surroundingTile = this.room.getTile(sx, sy);
                  
                  if (surroundingTile && surroundingTile.building && surroundingTile.building.type === 'tray') {
                    const existingTray = surroundingTile.building;
                    
                    // Check if the existing tray extends to the current position
                    if (checkX >= sx && checkX < sx + existingTray.width &&
                        checkY >= sy && checkY < sy + existingTray.length) {
                      trayOverlap = true;
                      break;
                    }
                  }
                }
                if (trayOverlap) break;
              }
              if (trayOverlap) break;
            }
            if (trayOverlap) break;
          }
          
          if (allTilesAvailable && !trayOverlap) {
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
          console.log('Cannabis plant placement attempt on:', this.focusedObject);
          
          // Different cases based on what is selected
          
          // Case 1: Direct pot selection (either via userData or as the object itself)
          if (this.focusedObject.type === 'pot') {
            // Direct reference to a pot object
            const pot = this.focusedObject;
            if (!pot.plant) {
              console.log('Placing plant directly on pot object');
              const plant = new CannabisPlant(0, 0);
              plant.refreshView();
              pot.setPlant(plant);
              this.room.getPlantsModule().updatePlantCount();
            }
          }
          // Case 2: Pot selected via mesh
          else if (this.focusedObject.userData?.instance?.type === 'pot') {
            const pot = this.focusedObject.userData.instance;
            if (!pot.plant) {
              console.log('Placing plant on pot (via mesh userData)');
              const plant = new CannabisPlant(0, 0);
              plant.refreshView();
              pot.setPlant(plant);
              this.room.getPlantsModule().updatePlantCount();
            }
          }
          // Case 3: Tile with pot building
          else if (this.focusedObject instanceof Tile && this.focusedObject.building?.type === 'pot') {
            const pot = this.focusedObject.building;
            if (!pot.plant) {
              console.log('Placing plant on pot (via tile.building)');
              const plant = new CannabisPlant(0, 0);
              plant.refreshView();
              pot.setPlant(plant);
              this.room.getPlantsModule().updatePlantCount();
            }
          }
          // Not a valid placement location
          else {
            console.warn('Cannabis plants can only be placed in pots');
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
    
    // Include objects from the room root
    this.room.root.traverse(object => {
      if (object.isMesh && (!object.userData || !object.userData.skipRaycast)) {
        targets.push(object);
      }
    });
    
    // Additionally, specifically look for and include all tiles from trays
    this.room.root.traverse(object => {
      if (object.userData && object.userData.instance && object.userData.instance.type === 'tray') {
        const tray = object.userData.instance;
        // Add all tiles in the tray to targets
        for (let x = 0; x < tray.width; x++) {
          for (let y = 0; y < tray.length; y++) {
            const trayTile = tray.getTile(x, y);
            if (trayTile && trayTile.mesh) {
              // Make sure the tile is marked as belonging to the tray
              trayTile.mesh.userData = {
                instance: trayTile,
                parentTray: tray,
                id: Math.random().toString(36).substr(2, 9)
              };
              targets.push(trayTile.mesh);
            }
          }
        }
      }
    });

    let intersections = this.raycaster.intersectObjects(targets, true);
    if (intersections.length > 0) {
      // Get the first intersection and find its parent Object
      let current = intersections[0].object;
      
      // Special case: if the object has parentTray, return the tile directly
      if (current.userData && current.userData.parentTray) {
        return current.userData.instance;
      }
      
      // Special case: if object has direct instance, return it
      if (current.userData && current.userData.instance) {
        return current.userData.instance;
      }
      
      // Walk up the hierarchy to find an object with userData.instance
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