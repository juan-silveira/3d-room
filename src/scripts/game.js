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
import { mockDatabase, mockDatabaseMethods } from './data/mockDatabase.js';

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
  /**
   * Timestamp of the last info panel update
   * @type {number}
   */
  lastInfoPanelUpdate = 0;
  _lastTouch = { x: null, y: null, dist: null };
  highlightedTiles = [];
  _toolLock = false;
  _lastAlertMessage = null;
  _lastAlertTime = 0;

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

      // Get room dimensions from mockDatabase
      const roomData = mockDatabase.rooms[0];
      const roomWidth = roomData.dimensions.width;
      const roomHeight = roomData.dimensions.height;
      const wallHeight = roomData.dimensions.wallHeight;
      const wallThickness = roomData.dimensions.wallThickness;

      // Create room with dimensions from mock database
      this.room = new Room(roomWidth, roomHeight, wallHeight, wallThickness);
      this.initialize(this.room);
      
      // Adjust camera parameters based on room size
      this.cameraManager.adjustToRoomSize({
        width: roomWidth,
        height: roomHeight
      });
      
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
    
    // Try to load saved room data
    this.#loadRoomDataFromDatabase(room);
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

    // Luz direcional perpendicular à parede norte (90°)
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    
    // Calcular posição ao norte com base nas dimensões da sala
    // A luz é posicionada no centro horizontal, mas ao norte da sala
    const northOffset = Math.max(20, this.room.height / 2); // Garante distância mínima
    const lightHeight = Math.max(40, this.room.height); // Altura proporcional
    
    // Posicionar a luz ao norte da sala (Z negativo é norte)
    sun.position.set(centerX, lightHeight, centerZ - northOffset);
    
    // Apontar a luz diretamente para o centro da sala (perpendicular à parede norte)
    sun.target.position.set(centerX, 0, centerZ);
    this.scene.add(sun.target); // Importante: adicionar o target à cena
    
    sun.castShadow = true;
    
    // Ajustar a câmera da sombra com base no tamanho da sala
    const shadowSize = Math.max(this.room.width, this.room.height) * 1.5;
    sun.shadow.camera.left = -shadowSize;
    sun.shadow.camera.right = shadowSize;
    sun.shadow.camera.top = shadowSize;
    sun.shadow.camera.bottom = -shadowSize;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = lightHeight + shadowSize;
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
      // Normal touch controls (for backward compatibility)
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

    // Only update the info panel every 10 seconds
    const currentTime = Date.now();
    if (currentTime - this.lastInfoPanelUpdate > 60000) {
      window.ui.updateInfoPanel(this.selectedObject);
      this.lastInfoPanelUpdate = currentTime;
    }
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
    // Adicionar proteção contra múltiplos cliques (debounce)
    if (this._toolLock) {
      console.log("Tool locked, ignoring request");
      return;
    }
    
    switch (window.ui.activeToolId) {
      case 'select':
        this.updateSelectedObject();
        // Info panel is already updated in updateSelectedObject
        break;
      case 'trash':
        // Aplicar trava para evitar múltiplas chamadas
        this._toolLock = true;
        
        setTimeout(() => {
          // Liberar a trava após um delay
          this._toolLock = false;
        }, 1000); // 1 segundo de trava
        
        if (this.focusedObject) {
          console.log('Trying to trash object:', this.focusedObject);
          console.log('Object type:', this.focusedObject.type);
          
          // Função auxiliar para confirmar a exclusão de um objeto
          const confirmDeletion = (objectType, actionAfterConfirm) => {
            // Verificar se o objeto é uma Tile da room
            if (this.focusedObject instanceof Tile || 
                (this.focusedObject.name && this.focusedObject.name.startsWith('Tile-')) ||
                objectType.toLowerCase().includes('tile')) {
              // Se for uma Tile, não exibir confirmação
              actionAfterConfirm();
              return;
            }
            
            // Para outros objetos, exibir confirmação
            const objectName = this.focusedObject.name || objectType;
            if (confirm(`Tem certeza que deseja excluir este objeto (${objectName})?`)) {
              actionAfterConfirm();
              // Resetar ferramenta após exclusão bem-sucedida
              this.resetToolAfterTrash();
            } else {
              // Mesmo se o usuário cancelar, resetar a ferramenta
              this.resetToolAfterTrash();
            }
          };
          
          // Caso 1: Objeto é uma planta (cannabis-plant)
          if (this.focusedObject.type === 'cannabis-plant') {
            console.log('Detected cannabis plant');
            
            // Verificar se a planta está em um vaso
            const parentObject = this.focusedObject.parent;
            console.log('Plant parent:', parentObject);
            
            if (parentObject && parentObject.type === 'pot') {
              confirmDeletion('planta', () => {
                console.log('Plant is on a pot, removing plant only');
                
                try {
                  // Adicionar debug
                  if (typeof parentObject.debugPlantState === 'function') {
                    parentObject.debugPlantState();
                  }
                  
                  // Remover a planta do pot usando setPlant(null)
                  parentObject.setPlant(null);
                  
                  // Verificar se a planta foi realmente removida
                  if (typeof parentObject.debugPlantState === 'function') {
                    parentObject.debugPlantState();
                  }
                  
                  // Atualizar a contagem de plantas
                  this.room.getPlantsModule().updatePlantCount();
                  
                  // Atualizar o painel de informações
                  window.ui.updateInfoPanel(parentObject);
                  this.lastInfoPanelUpdate = Date.now();
                  console.log('Plant successfully removed from pot');
                  
                  // Resetar ferramenta após exclusão bem-sucedida
                  this.resetToolAfterTrash();
                } catch (error) {
                  console.error('Error removing plant from pot:', error);
                }
              });
              return;
            } else {
              // Planta diretamente em um tile (raro)
              confirmDeletion('planta', () => {
                console.log('Plant is directly on a tile');
                try {
                  const { x, y } = this.focusedObject;
                  console.log('Removing plant at coordinates:', x, y);
                  this.room.trash(x, y);
                  window.ui.updateInfoPanel(this.selectedObject);
                  this.lastInfoPanelUpdate = Date.now();
                  console.log('Plant successfully removed from tile');
                  
                  // Resetar ferramenta após exclusão bem-sucedida
                  this.resetToolAfterTrash();
                } catch (error) {
                  console.error('Error removing plant from tile:', error);
                }
              });
              return;
            }
          }
          
          // Caso 2: Objeto é um pot
          else if (this.focusedObject.type === 'pot') {
            console.log('Detected pot:', this.focusedObject);
            // Verificar se o pot tem uma planta
            if (this.focusedObject.plant) {
              console.log('Pot has a plant, showing warning');
              this.showAlert('O vaso não está vazio. Remova a planta primeiro antes de excluir o vaso.');
              // Resetar ferramenta mesmo após o aviso
              this.resetToolAfterTrash();
              return;
            }
            
            // Se o pot estiver em uma tray, usar o método trash da tray
            const parentObject = this.focusedObject.parent;
            console.log('Pot parent:', parentObject);
            
            if (parentObject && parentObject.type === 'tray') {
              confirmDeletion('vaso', () => {
                console.log('Pot is on a tray - trying to find its location');
                const tray = parentObject;
                
                // Método 1: Verificar cada tile da tray para encontrar o pot
                let potFound = false;
                for (let tx = 0; tx < tray.width; tx++) {
                  for (let ty = 0; ty < tray.length; ty++) {
                    const trayTile = tray.getTile(tx, ty);
                    if (trayTile && trayTile.building === this.focusedObject) {
                      console.log('Found pot on tray at', tx, ty);
                      potFound = true;
                      
                      // Remover o pot usando o método trash da tray
                      try {
                        const result = tray.trash(tx, ty);
                        console.log('Trash result:', result);
                        // Atualizar a contagem de pots
                        this.room.getPotsModule().updatePotCount();
                        // Atualizar o painel de informações
                        window.ui.updateInfoPanel(this.selectedObject);
                        this.lastInfoPanelUpdate = Date.now();
                        
                        // Resetar ferramenta após exclusão bem-sucedida
                        this.resetToolAfterTrash();
                      } catch (error) {
                        console.error('Error removing pot from tray:', error);
                      }
                      return;
                    }
                  }
                }
                
                // Método 2: Se o método 1 falhar, tentar outros métodos
                if (!potFound) {
                  console.log('Pot not found in tray tiles, trying alternative method');
                  // Vamos tentar encontrar as coordenadas do pot dentro da tray
                  if (typeof this.focusedObject.x === 'number' && typeof this.focusedObject.y === 'number') {
                    // Calcular as coordenadas locais na tray
                    const localX = this.focusedObject.x - tray.x;
                    const localY = this.focusedObject.y - tray.y;
                    
                    if (localX >= 0 && localX < tray.width && localY >= 0 && localY < tray.length) {
                      console.log('Found pot at local coordinates:', localX, localY);
                      try {
                        tray.trash(localX, localY);
                        this.room.getPotsModule().updatePotCount();
                        window.ui.updateInfoPanel(this.selectedObject);
                        this.lastInfoPanelUpdate = Date.now();
                        
                        // Resetar ferramenta após exclusão bem-sucedida
                        this.resetToolAfterTrash();
                      } catch (error) {
                        console.error('Error removing pot from tray (method 2):', error);
                      }
                    } else {
                      console.error('Calculated local coordinates are outside the tray bounds', localX, localY);
                    }
                  } else {
                    console.error('Pot does not have valid coordinates');
                  }
                }
              });
              return;
            } else {
              // Pot diretamente em um tile
              confirmDeletion('vaso', () => {
                console.log('Pot is directly on a room tile');
                const { x, y } = this.focusedObject;
                this.room.trash(x, y);
                window.ui.updateInfoPanel(this.selectedObject);
                this.lastInfoPanelUpdate = Date.now();
                
                // Resetar ferramenta após exclusão bem-sucedida
                this.resetToolAfterTrash();
              });
              return;
            }
          }
          
          // Caso 3: Objeto é uma tray
          else if (this.focusedObject.type === 'tray') {
            console.log('Detected tray');
            // Verificar se a tray tem pots ou outros objetos usando o método isEmpty
            const tray = this.focusedObject;
            
            if (!tray.isEmpty()) {
              console.log('Tray is not empty, showing warning');
              this.showAlert('A bandeja não está vazia. Remova todos os objetos da bandeja primeiro antes de excluí-la.');
              // Resetar ferramenta mesmo após o aviso
              this.resetToolAfterTrash();
              return;
            } else {
              confirmDeletion('bandeja', () => {
                console.log('Tray is empty, removing it');
                const { x, y } = this.focusedObject;
                this.room.trash(x, y);
                window.ui.updateInfoPanel(this.selectedObject);
                this.lastInfoPanelUpdate = Date.now();
                
                // Resetar ferramenta após exclusão bem-sucedida
                this.resetToolAfterTrash();
              });
              return;
            }
          }
          
          // Caso 4: Qualquer outro tipo de objeto
          else {
            confirmDeletion(this.focusedObject.type || 'objeto', () => {
              console.log('Other object type, using standard trash method');
              const { x, y } = this.focusedObject;
              this.room.trash(x, y);
              window.ui.updateInfoPanel(this.selectedObject);
              this.lastInfoPanelUpdate = Date.now();
              
              // Resetar ferramenta após exclusão bem-sucedida
              this.resetToolAfterTrash();
            });
          }
        }
        break;
      case 'double-door':
        if (this.focusedObject) {
          const { x, y } = this.focusedObject;
          // Check if the tile is at the edge of the room
          if (x === 0 || x === this.room.width - 1 || y === 0 || y === this.room.height - 1) {
            const doorWidth = window.ui.getDoorWidth();
            this.room.placeDoor(x, y, doorWidth);
            // Update panel immediately
            window.ui.updateInfoPanel(this.selectedObject);
            this.lastInfoPanelUpdate = Date.now();
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
                
                // Usar a nova função para encontrar as coordenadas locais do tile na tray
                const localCoords = tray.findTileLocalCoordinates(trayTile);
                
                if (localCoords) {
                  const { x: localX, y: localY } = localCoords;
                  console.log(`Found local tray coordinates: (${localX}, ${localY})`);
                  
                  try {
                    // Place the pot using local coordinates
                    tray.placeBuilding(localX, localY, pot);
                    
                    // Update the pot counter when placing on a tray
                    this.room.getPotsModule().updatePotCount();
                  } catch (error) {
                    console.error("Error placing pot on tray:", error);
                  }
                } else {
                  console.error("Failed to determine local coordinates for tile:", trayTile);
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
              
              // Create a new plant with random data from the mock database or random generation
              const plant = new CannabisPlant(0, 0);
              plant.refreshView();
              
              // Assign the plant to the pot
              pot.setPlant(plant);
              this.room.getPlantsModule().updatePlantCount();
              
              // Update info panel immediately after placing a plant
              window.ui.updateInfoPanel(this.selectedObject);
              this.lastInfoPanelUpdate = Date.now();
            }
          }
          // Case 2: Pot selected via mesh
          else if (this.focusedObject.userData?.instance?.type === 'pot') {
            const pot = this.focusedObject.userData.instance;
            if (!pot.plant) {
              console.log('Placing plant on pot (via mesh userData)');
              
              // Create a new plant with random data from the mock database or random generation
              const plant = new CannabisPlant(0, 0);
              plant.refreshView();
              
              // Assign the plant to the pot
              pot.setPlant(plant);
              this.room.getPlantsModule().updatePlantCount();
              
              // Update info panel immediately after placing a plant
              window.ui.updateInfoPanel(this.selectedObject);
              this.lastInfoPanelUpdate = Date.now();
            }
          }
          // Case 3: Tile with pot building
          else if (this.focusedObject instanceof Tile && this.focusedObject.building?.type === 'pot') {
            const pot = this.focusedObject.building;
            if (!pot.plant) {
              console.log('Placing plant on pot (via tile.building)');
              
              // Create a new plant with random data from the mock database or random generation
              const plant = new CannabisPlant(0, 0);
              plant.refreshView();
              
              // Assign the plant to the pot
              pot.setPlant(plant);
              this.room.getPlantsModule().updatePlantCount();
              
              // Update info panel immediately after placing a plant
              window.ui.updateInfoPanel(this.selectedObject);
              this.lastInfoPanelUpdate = Date.now();
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
          const result = this.room.placeBuilding(x, y, window.ui.activeToolId);
          
          // Update info panel immediately after placing a building
          if (result) {
            window.ui.updateInfoPanel(this.selectedObject);
            this.lastInfoPanelUpdate = Date.now();
          }
        }
        break;
    }
  }
  
  /**
   * Sets the currently selected object and highlights it
   */
  updateSelectedObject() {
    if (this.selectedObject && typeof this.selectedObject.setSelected === 'function') {
      this.selectedObject.setSelected(false);
    }
    this.selectedObject = this.focusedObject;
    if (this.selectedObject && typeof this.selectedObject.setSelected === 'function') {
      this.selectedObject.setSelected(true);
    }
    
    // Update the selected tile
    if (this.selectedObject instanceof Tile) {
      this.selectedTile = this.selectedObject;
    } else {
      this.selectedTile = null;
    }
    
    // Update the info panel immediately when a new object is selected
    if (this.selectedObject) {
      // Garantir que o painel seja visível quando algo for selecionado
      const infoPanel = document.getElementById('info-panel');
      if (infoPanel) {
        infoPanel.style.visibility = 'visible';
      }
    }
    
    window.ui.updateInfoPanel(this.selectedObject);
    this.lastInfoPanelUpdate = Date.now();
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

    // Abordagem: colete todos os objetos interativos
    const allTargets = [];
    
    // Arrays para priorização por tipo
    const plantObjects = [];  // Objetos de plantas cannabis
    const potObjects = [];    // Objetos de vasos (pots)
    const trayObjects = [];   // Objetos de bandejas (trays)
    
    // Percorrer a cena e coletar todos os objetos interativos
    this.room.root.traverse(object => {
      if (object.isMesh && (!object.userData || !object.userData.skipRaycast)) {
        allTargets.push(object);
        
        // Verificar userData para categorização
        if (object.userData && object.userData.instance) {
          const instance = object.userData.instance;
          
          if (instance.type === 'cannabis-plant') {
            plantObjects.push(object);
          } else if (instance.type === 'pot') {
            potObjects.push(object);
            
            // Se o vaso tem planta, adicionar a planta também
            if (instance.plant) {
              // Adicionar os meshes da planta, se existirem
              if (instance.plant.mesh) {
                plantObjects.push(instance.plant.mesh);
              }
            }
          } else if (instance.type === 'tray') {
            trayObjects.push(object);
          }
        }
      }
    });
    
    // Verificações de cima para baixo para a ferramenta trash ou select:
    // 1. Planta -> 2. Pot -> 3. Tray -> 4. Outros
    if (window.ui.activeToolId === 'trash' || window.ui.activeToolId === 'select') {
      // Verificar interseções com plantas primeiro
      const plantIntersections = this.raycaster.intersectObjects(plantObjects);
      if (plantIntersections.length > 0) {
        // Encontrar o objeto principal (cannabis-plant) a partir da interseção
        let current = plantIntersections[0].object;
        while (current) {
          if (current.userData && current.userData.instance && current.userData.instance.type === 'cannabis-plant') {
            return current.userData.instance;
          }
          
          if (!current.parent) break;
          current = current.parent;
        }
      }
      
      // Verificar interseções com pots em segundo lugar
      const potIntersections = this.raycaster.intersectObjects(potObjects);
      if (potIntersections.length > 0) {
        // Encontrar o objeto principal (pot) a partir da interseção
        let current = potIntersections[0].object;
        while (current) {
          if (current.userData && current.userData.instance && current.userData.instance.type === 'pot') {
            return current.userData.instance;
          }
          
          if (!current.parent) break;
          current = current.parent;
        }
      }
      
      // Verificar interseções com trays em terceiro lugar
      const trayIntersections = this.raycaster.intersectObjects(trayObjects);
      if (trayIntersections.length > 0) {
        // Encontrar o objeto principal (tray) a partir da interseção
        let current = trayIntersections[0].object;
        while (current) {
          if (current.userData && current.userData.instance && current.userData.instance.type === 'tray') {
            return current.userData.instance;
          }
          
          if (!current.parent) break;
          current = current.parent;
        }
      }
    }
    
    // Caso geral: verificar interseções com todos os alvos
    const intersections = this.raycaster.intersectObjects(allTargets, true);
    if (intersections.length > 0) {
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
      
      if (current && current.userData && current.userData.instance) {
        return current.userData.instance;
      }
    }
    
    return null;
  }

  /**
   * Resizes the renderer to fit the current game window
   */
  onResize() {
    this.cameraManager.resize(window.ui.gameWindow);
    this.renderer.setSize(window.ui.gameWindow.clientWidth, window.ui.gameWindow.clientHeight);
  }

  /**
   * Loads room data from the mock database
   * @param {Room} room The room to populate
   * @private
   */
  #loadRoomDataFromDatabase(room) {
    try {
      // Get the first room from the mock database (we could make this configurable later)
      const roomData = mockDatabase.rooms[0];
      if (!roomData) return;
      
      // Set room name
      room.name = roomData.name;
      
      // Place doors if there are any defined
      if (roomData.doors && roomData.doors.length > 0) {
        for (const doorData of roomData.doors) {
          const { x, y } = doorData.position;
          const width = doorData.width || 2; // Default width is 2
          
          // Place door at position
          room.placeDoor(x, y, width);
        }
      }
      
      // Load equipment
      const equipment = mockDatabaseMethods.getRoomEquipment(roomData.id);
      
      // Place trays
      if (equipment.trays && equipment.trays.length > 0) {
        for (const trayData of equipment.trays) {
          const { x, y } = trayData.position;
          
          // Place tray at position
          room.placeBuilding(x, y, 'tray');
          
          // Get the tile with the tray
          const tile = room.getTile(x, y);
          if (tile && tile.building && tile.building.type === 'tray') {
            const tray = tile.building;
            
            // Configure tray dimensions
            tray.width = trayData.dimensions.width;
            tray.length = trayData.dimensions.length;
            tray.legHeight = trayData.dimensions.legHeight;
            tray.topThickness = trayData.dimensions.topThickness;
            tray.edgeHeight = trayData.dimensions.edgeHeight;
            tray.edgeThickness = trayData.dimensions.edgeThickness;
            
            // Initialize tiles
            tray.initializeTiles();
            tray.refreshView();
            
            // Place pots in this tray
            const trayPots = equipment.pots.filter(pot => pot.trayId === trayData.id);
            for (const potData of trayPots) {
              const { x: potX, y: potY } = potData.position;
              
              // Create a new pot with the specified shape and dimensions
              const pot = new Pot(0, 0, potData.shape);
              pot.height = potData.dimensions.height;
              
              if (pot.shape === 'round') {
                pot.topDiameter = potData.dimensions.topDiameter;
                pot.bottomDiameter = potData.dimensions.bottomDiameter;
              } else {
                pot.topSide = potData.dimensions.topSide;
                pot.bottomSide = potData.dimensions.bottomSide;
              }
              
              // Place pot on tray
              tray.placeBuilding(potX, potY, pot);
              
              // Place plant if this pot has a plant
              if (potData.plantId) {
                const plantData = mockDatabase.plants.find(p => p.id === potData.plantId);
                if (plantData) {
                  // Create plant using data from database
                  const plant = new CannabisPlant(0, 0, plantData);
                  plant.refreshView();
                  pot.setPlant(plant);
                }
              }
            }
          }
        }
      }
      
      // Update UI counters
      room.getPotsModule().updatePotCount();
      room.getPlantsModule().updatePlantCount();
      room.getTraysModule().updateTrayCount();
      
      // Update the title bar with the room name
      window.ui.updateTitleBar(this);
      
      console.log('Room data loaded from mock database');
    } catch (error) {
      console.error('Error loading room data from database:', error);
    }
  }

  /**
   * Função para mostrar alertas com proteção contra múltiplos disparos
   * @param {string} message Mensagem a ser exibida
   */
  showAlert(message) {
    // Verificar se já existe um alerta recente com a mesma mensagem
    if (this._lastAlertMessage === message && 
        Date.now() - this._lastAlertTime < 2000) {
      console.log("Alert suppressed (duplicate):", message);
      return;
    }
    
    // Registrar este alerta
    this._lastAlertMessage = message;
    this._lastAlertTime = Date.now();
    
    // Exibir o alerta
    alert(message);
  }

  /**
   * Reseta a ferramenta atual para a ferramenta de seleção (hand/select)
   * após qualquer interação com a ferramenta trash
   */
  resetToolAfterTrash() {
    // Sempre resetar para a ferramenta de seleção (hand) em qualquer dispositivo
    console.log("Switching from trash to select tool");
    window.ui.setActiveTool('select');
  }
}

// Create a new game when the window is loaded
window.onload = () => {
  window.game = new Game();
}