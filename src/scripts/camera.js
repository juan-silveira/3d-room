import * as THREE from 'three';

// -- Constants --
const DEG2RAD = Math.PI / 180.0;
const RIGHT_MOUSE_BUTTON = 2;

// Camera constraints
const CAMERA_SIZE = 5;
const MIN_CAMERA_RADIUS = 0.3; // Maximum zoom in (higher value = more zoomed in)
// We'll dynamically set MAX_CAMERA_RADIUS based on room size
const MIN_CAMERA_ELEVATION = 0;
const MAX_CAMERA_ELEVATION = 90;

// Camera sensitivity
const AZIMUTH_SENSITIVITY = 0.2;
const ELEVATION_SENSITIVITY = 0.2;
const ZOOM_SENSITIVITY = 0.001; // Reduced sensitivity for smoother zooming
const PAN_SENSITIVITY = -0.05;

// Navigation button sensitivity
const NAV_PAN_AMOUNT = 1;
const NAV_ZOOM_AMOUNT = 1.2; // Zoom in factor
const NAV_ZOOM_OUT_AMOUNT = 1.2; // Zoom out factor

const Y_AXIS = new THREE.Vector3(0, 1, 0);

// Default zoom settings - these can be adjusted at runtime
const DEFAULT_ZOOM_SETTINGS = {
  // Base value for maximum zoom out - higher means less zoom out
  baseMaxRadius: 0.03,
  
  // Reference size for scaling zoom (rooms larger than this will zoom out more)
  baseRoomSize: 30,
  
  // Min/max limits for the calculated maxCameraRadius
  minMaxRadius: 0.01,
  maxMaxRadius: 0.15,
  
  // View fit adjustment factors (closer to 1 = tighter fit to room)
  portraitFitFactor: 4.5, // Fixed at 4.5 for consistent 100% vertical view
  landscapeFitFactor: 0.7 // This will be automatically adjusted based on room height
};

/**
 * Normalizes an angle to be between 0 and 360 degrees
 * @param {number} angle - The angle to normalize in degrees
 * @returns {number} - The normalized angle between 0 and 360 degrees
 */
function normalizeAngle(angle) {
  // Using modulo to wrap around and handle negative values
  return ((angle % 360) + 360) % 360;
}

export class CameraManager {
  constructor() {
    const aspect = window.ui.gameWindow.clientWidth / window.ui.gameWindow.clientHeight;

    this.camera = new THREE.OrthographicCamera(
      (CAMERA_SIZE * aspect) / -2,
      (CAMERA_SIZE * aspect) / 2,
      CAMERA_SIZE / 2,
      CAMERA_SIZE / -2, 1, 1000);
    this.camera.layers.enable(1);
    
    this.cameraOrigin = new THREE.Vector3(8, 0, 8);
    this.cameraRadius = 0.5;
    this.cameraAzimuth = 225;
    this.cameraElevation = 45;
    
    // Default max zoom out value - will be adjusted based on room size
    this.maxCameraRadius = 0.02;
    
    // Store zoom settings in a configurable object
    this.zoomSettings = { ...DEFAULT_ZOOM_SETTINGS };
    
    // Store initial camera settings for reset functionality
    this.initialCameraSettings = {
      origin: new THREE.Vector3(8, 0, 8),
      radius: 0.5,
      azimuth: 225,
      elevation: 45
    };

    this.updateCameraPosition();

    window.ui.gameWindow.addEventListener('wheel', this.onMouseScroll.bind(this), false);
    window.ui.gameWindow.addEventListener('mousedown', this.onMouseMove.bind(this), false);
    window.ui.gameWindow.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    
    // Make camera manager accessible globally for debugging and configuration
    window.cameraManager = this;
  }

  /**
   * Updates zoom settings - can be called from console to adjust zoom behavior
   * @param {Object} newSettings Settings to update
   */
  updateZoomSettings(newSettings) {
    // Update only the provided settings
    this.zoomSettings = { ...this.zoomSettings, ...newSettings };
    console.log('Updated zoom settings:', this.zoomSettings);
    
    // Re-adjust to room size with new settings
    if (window.game && window.game.room) {
      this.adjustToRoomSize({
        width: window.game.room.width,
        height: window.game.room.height
      });
    }
    
    return this.zoomSettings;
  }

  calculateScale(H) {
    H = Math.max(0, H);
    
    let scale;
    
    if (H <= 20) {
      scale = 4.5;
    } else if (H <= 40) {
      scale = 6 - 0.075 * H;
    } else if (H <= 80) {
      scale = 4.5 - 0.0375 * H;
    } else if (H <= 160) {
      scale = 2.25 - 0.009375 * H;
    } else {
      scale = 2.25 - 0.009375 * H;
    }
    
    return Math.round(scale * 100) / 100;
  }
  
  /**
   * Resets zoom settings to defaults
   */
  resetZoomSettings() {
    // Create a copy of default settings
    const defaultSettings = { ...DEFAULT_ZOOM_SETTINGS };
    
    // Calculate landscape fit factor if room dimensions are available
    if (window.game && window.game.room) {
      const roomDimensions = {
        width: window.game.room.width,
        height: window.game.room.height
      };
      
      // Use the formula: landscapeFitFactor = 45 * roomHeight^-0.6
      defaultSettings.landscapeFitFactor = this.calculateScale(roomDimensions.height);
    }
    
    // Apply the settings
    this.zoomSettings = defaultSettings;
    console.log('Reset zoom settings to defaults:', this.zoomSettings);
    
    // Re-adjust to room size with default settings
    if (window.game && window.game.room) {
      this.adjustToRoomSize({
        width: window.game.room.width,
        height: window.game.room.height
      });
    }
    
    return this.zoomSettings;
  }

  /**
   * Adjusts camera parameters based on room dimensions
   * @param {Object} roomDimensions The dimensions of the room {width, height}
   */
  adjustToRoomSize(roomDimensions) {
    // Calculate appropriate zoom level based on room size
    // Larger rooms need smaller radius values to zoom out more
    const maxDimension = Math.max(roomDimensions.width, roomDimensions.height);
    
    // Scale the max radius inversely with room size
    // For small rooms (e.g. 16x20), use larger value (less zoom out)
    // For larger rooms, use smaller value (more zoom out)
    const baseSize = this.zoomSettings.baseRoomSize;
    this.maxCameraRadius = this.zoomSettings.baseMaxRadius * (baseSize / maxDimension);
    
    // Clamp to reasonable values
    this.maxCameraRadius = Math.max(
      this.zoomSettings.minMaxRadius, 
      Math.min(this.zoomSettings.maxMaxRadius, this.maxCameraRadius)
    );
    
    // Automatically adjust landscape fit factor based on room height
    const calculatedLandscapeFactor = this.calculateScale(roomDimensions.height);
    
    // Update the zoom settings with the calculated factor
    // Only if not manually set (preserves user adjustments)
    if (this.zoomSettings.landscapeFitFactor === DEFAULT_ZOOM_SETTINGS.landscapeFitFactor) {
      this.zoomSettings.landscapeFitFactor = calculatedLandscapeFactor;
      console.log(`Auto-adjusted landscape fit factor to ${calculatedLandscapeFactor} based on room height ${roomDimensions.height}`);
    }
    
    console.log(`Adjusted camera maxCameraRadius to ${this.maxCameraRadius} for room size ${roomDimensions.width}x${roomDimensions.height}`);
    
    // Update initial camera settings origin to center of room
    this.initialCameraSettings.origin = new THREE.Vector3(
      roomDimensions.width / 2, 
      0, 
      roomDimensions.height / 2
    );
    
    // Update camera origin to center of room
    this.cameraOrigin.set(
      roomDimensions.width / 2, 
      0, 
      roomDimensions.height / 2
    );
    
    this.updateCameraPosition();
  }

  /**
   * Moves the camera in the specified direction
   * @param {number} x - Amount to move in x direction
   * @param {number} z - Amount to move in z direction
   */
  moveCamera(x, z) {
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(Y_AXIS, this.cameraAzimuth * DEG2RAD);
    const left = new THREE.Vector3(1, 0, 0).applyAxisAngle(Y_AXIS, this.cameraAzimuth * DEG2RAD);
    
    this.cameraOrigin.add(forward.multiplyScalar(NAV_PAN_AMOUNT * z));
    this.cameraOrigin.add(left.multiplyScalar(NAV_PAN_AMOUNT * x));
    
    this.updateCameraPosition();
    this.hideInfoPanel();
  }

  /**
   * Zooms the camera in or out
   * @param {number} amount - Positive for zooming out, negative for zooming in
   */
  zoomCamera(amount) {
    // IMPORTANT: In orthographic camera, smaller radius = more zoomed in
    if (amount < 0) {
      // Zoom in: multiply by factor (makes radius larger)
      this.cameraRadius *= NAV_ZOOM_AMOUNT;
    } else {
      // Zoom out: divide by factor (makes radius smaller)
      this.cameraRadius /= NAV_ZOOM_OUT_AMOUNT;
    }
    
    // For orthographic camera, limit values (smaller = more zoomed in)
    this.cameraRadius = Math.max(this.maxCameraRadius, Math.min(MIN_CAMERA_RADIUS, this.cameraRadius));
    
    this.updateCameraPosition();
    this.hideInfoPanel();
  }

  /**
    * Applies any changes to camera position/orientation
    */
  updateCameraPosition() {
    this.camera.zoom = this.cameraRadius;
    
    // Normalize azimuth to be between 0 and 360 degrees
    this.cameraAzimuth = normalizeAngle(this.cameraAzimuth);
    
    this.camera.position.x = 100 * Math.sin(this.cameraAzimuth * DEG2RAD) * Math.cos(this.cameraElevation * DEG2RAD);
    this.camera.position.y = 100 * Math.sin(this.cameraElevation * DEG2RAD);
    this.camera.position.z = 100 * Math.cos(this.cameraAzimuth * DEG2RAD) * Math.cos(this.cameraElevation * DEG2RAD);
    this.camera.position.add(this.cameraOrigin);
    this.camera.lookAt(this.cameraOrigin);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /**
   * Event handler for `mousemove` event
   * @param {MouseEvent} event Mouse event arguments
   */
  onMouseMove(event) {
    // Handles the rotation of the camera
    if (event.buttons & RIGHT_MOUSE_BUTTON && !event.ctrlKey) {
      this.cameraAzimuth += -(event.movementX * AZIMUTH_SENSITIVITY);
      this.cameraElevation += (event.movementY * ELEVATION_SENSITIVITY);
      this.cameraElevation = Math.min(MAX_CAMERA_ELEVATION, Math.max(MIN_CAMERA_ELEVATION, this.cameraElevation));
      
      // Update angle display in UI when camera rotates
      try {
        if (window.ui && typeof window.ui.updateAngleDisplay === 'function') {
          window.ui.updateAngleDisplay(
            this.cameraAzimuth,
            this.cameraElevation,
            0 // Rotação (não temos rotação no eixo z atualmente)
          );
        }
        
        // Esconder o painel de informações durante a rotação da câmera
        this.hideInfoPanel();
      } catch (error) {
        console.warn('Erro ao atualizar ângulo na interface:', error);
      }
    }

    // Handles the panning of the camera
    if (event.buttons & RIGHT_MOUSE_BUTTON && event.ctrlKey) {
      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(Y_AXIS, this.cameraAzimuth * DEG2RAD);
      const left = new THREE.Vector3(1, 0, 0).applyAxisAngle(Y_AXIS, this.cameraAzimuth * DEG2RAD);
      this.cameraOrigin.add(forward.multiplyScalar(PAN_SENSITIVITY * event.movementY));
      this.cameraOrigin.add(left.multiplyScalar(PAN_SENSITIVITY * event.movementX));
      
      // Esconder o painel de informações durante o pan da câmera
      this.hideInfoPanel();
    }

    this.updateCameraPosition();
  }

  /**
   * Event handler for `wheel` event
   * @param {MouseEvent} event Mouse event arguments
   */
  onMouseScroll(event) {
    // Save current mouse position for zooming toward cursor
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.camera.viewport || event.target.getBoundingClientRect();
    const mouseNDC = {
      x: ((mouseX - rect.left) / rect.width) * 2 - 1,
      y: -((mouseY - rect.top) / rect.height) * 2 + 1
    };
    
    // Get world position under mouse before zoom
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseNDC, this.camera);
    
    // Define a plane at the height of the room floor
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    
    // Find the point where the ray intersects the ground plane
    const targetPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, targetPoint);
    
    // Store current origin-to-target vector
    const currentOffset = targetPoint.clone().sub(this.cameraOrigin);
    
    // Store old radius before zoom
    const oldRadius = this.cameraRadius;
    
    // For orthographic camera: deltaY < 0 means wheel up = zoom in
    if (event.deltaY < 0) { // Inverted to match natural scrolling
      // Zoom in: multiply by factor (makes radius larger)
      this.cameraRadius *= (1 + (Math.abs(event.deltaY) * ZOOM_SENSITIVITY * 2));
    } else {
      // Zoom out: divide by factor (makes radius smaller)
      this.cameraRadius /= (1 + (Math.abs(event.deltaY) * ZOOM_SENSITIVITY));
    }
    
    // For orthographic camera, limit values (smaller = more zoomed in)
    this.cameraRadius = Math.max(this.maxCameraRadius, Math.min(MIN_CAMERA_RADIUS, this.cameraRadius));
    
    // Calculate zoom factor to adjust position
    const zoomFactor = this.cameraRadius / oldRadius;
    
    // Adjust camera origin to zoom toward mouse position
    if (targetPoint && !isNaN(targetPoint.x)) {
      // Move the camera origin toward/away from the target point based on zoom
      const newOffset = currentOffset.multiplyScalar(zoomFactor);
      const offsetDiff = currentOffset.clone().sub(newOffset);
      this.cameraOrigin.add(offsetDiff);
    }
    
    try {
      if (window.ui && typeof window.ui.updateAngleDisplay === 'function') {
        window.ui.updateAngleDisplay(
          this.cameraAzimuth,
          this.cameraElevation,
          0 // Rotação (não temos rotação no eixo z atualmente)
        );
      }
      
      this.hideInfoPanel();
    } catch (error) {
      console.warn('Erro ao atualizar ângulo na interface:', error);
    }

    this.updateCameraPosition();
  }

  resize() {
    const aspect = window.ui.gameWindow.clientWidth / window.ui.gameWindow.clientHeight;
    this.camera.left = (CAMERA_SIZE * aspect) / -2;
    this.camera.right = (CAMERA_SIZE * aspect) / 2;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Esconde o painel de informações
   */
  hideInfoPanel() {
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.style.visibility = 'hidden';
    }
  }

  /**
   * Reset camera to initial position and orientation
   */
  resetView() {
    this.cameraOrigin.copy(this.initialCameraSettings.origin);
    this.cameraRadius = this.initialCameraSettings.radius;
    this.cameraAzimuth = this.initialCameraSettings.azimuth;
    this.cameraElevation = this.initialCameraSettings.elevation;
    
    this.updateCameraPosition();
    this.hideInfoPanel();
  }
  
  /**
   * Fits the camera to show the room in portrait mode (100% visible vertically)
   * @param {Object} roomDimensions The dimensions of the room {width, height}
   */
  fitVertical(roomDimensions) {
    console.log("Fitting to vertical view");
    
    // Set to maximum zoom out to see entire room
    this.cameraRadius = this.maxCameraRadius;
    
    // Get viewport dimensions
    const aspect = window.ui.gameWindow.clientWidth / window.ui.gameWindow.clientHeight;
    
    // Calculate a zoom level that will fit the room height in the view
    // The factor is adjustable via zoomSettings
    const heightFactor = this.zoomSettings.portraitFitFactor; 
    this.cameraRadius = heightFactor / roomDimensions.height;
    
    // Center camera on room
    this.cameraOrigin.set(
      roomDimensions.width / 2, 
      0, 
      roomDimensions.height / 2
    );
    
    // Set to exact top-down view
    this.cameraAzimuth = 180;
    this.cameraElevation = 90;
    
    console.log(`Set camera radius to ${this.cameraRadius}, azimuth: ${this.cameraAzimuth}, elevation: ${this.cameraElevation}`);
    this.updateCameraPosition();
    this.hideInfoPanel();
  }
  
  /**
   * Fits the camera to show the room in landscape mode (100% visible horizontally)
   * @param {Object} roomDimensions The dimensions of the room {width, height}
   */
  fitHorizontal(roomDimensions) {
    console.log("Fitting to horizontal view");
    
    // Set to maximum zoom out to see entire room
    this.cameraRadius = this.maxCameraRadius;
    
    // Get viewport dimensions
    const aspect = window.ui.gameWindow.clientWidth / window.ui.gameWindow.clientHeight;
    
    // Calculate a zoom level that will fit the room width in the view
    // The factor is adjustable via zoomSettings
    const widthFactor = this.zoomSettings.landscapeFitFactor;
    this.cameraRadius = widthFactor / roomDimensions.width;
    
    // Center camera on room
    this.cameraOrigin.set(
      roomDimensions.width / 2, 
      0, 
      roomDimensions.height / 2
    );
    
    // Set to exact side view
    this.cameraAzimuth = 270;
    this.cameraElevation = 90;
    
    console.log(`Set camera radius to ${this.cameraRadius}, azimuth: ${this.cameraAzimuth}, elevation: ${this.cameraElevation}`);
    this.updateCameraPosition();
    this.hideInfoPanel();
  }
}