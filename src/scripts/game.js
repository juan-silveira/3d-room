import * as THREE from 'three';
import { AssetManager } from './assets/assetManager.js';
import { CameraManager } from './camera.js';
import { InputManager } from './input.js';
import { Room } from './sim/room.js';
import { SimObject } from './sim/simObject.js';
import { Tile } from './sim/tile.js';

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
   * @type {SimObject | null}
   */
  focusedObject = null;
  /**
   * Class for managing user input
   * @type {InputManager}
   */
  inputManager;
  /**
   * Object that is currently selected
   * @type {SimObject | null}
   */
  selectedObject = null;
  /**
   * Tile that is currently selected
   * @type {Tile | null}
   */
  selectedTile = null;
  _lastTouch = { x: null, y: null, dist: null };

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

      this.room = new Room(12, 30);
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

    this.room.draw();
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
   * Sets the object that is currently highlighted
   */
  updateFocusedObject() {  
    this.focusedObject?.setFocused(false);
    const newObject = this.#raycast();
    if (newObject !== this.focusedObject) {
      this.focusedObject = newObject;
    }
    this.focusedObject?.setFocused(true);
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

    let intersections = this.raycaster.intersectObjects(this.room.root.children, true);
    if (intersections.length > 0) {
      // The SimObject attached to the mesh is stored in the user data
      const selectedObject = intersections[0].object.userData;
      return selectedObject;
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