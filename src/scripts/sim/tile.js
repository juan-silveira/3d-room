import * as THREE from 'three';
import { Building } from './buildings/building.js';
import { Object } from './object.js';

export class Tile extends Object {
  /**
   * The type of terrain, set to concrete only
   * @type {string}
   */
  terrain = 'concrete';
  /**
   * The building on this tile
   * @type {Building?}
   */
  #building = null;

  constructor(x, y) {
    super(x, y);
    this.name = `Tile-${this.x}-${this.y}`;
  }

  /**
   * @type {Building}
   */
  get building() {
    return this.#building;
  }

  /**
   * @type {Building} value
   */
  setBuilding(value) {
    // Remove and dispose resources for existing building
    if (this.#building) {
      this.#building.dispose();
      this.remove(this.#building);
    }

    this.#building = value;

    // Add to scene graph
    if (value) {
      this.add(this.#building);
    }
  }

  refreshView(room) {
    this.building?.refreshView(room);
    if (this.building?.hideTerrain) {
      this.setMesh(null);
    } else {
      /**
       * @type {THREE.Mesh}
       */
      const mesh = window.assetManager.getModel('concrete', this);
      mesh.name = 'concrete';
      this.setMesh(mesh);
    }
  }

  simulate(room) {
    this.building?.simulate(room);
  }

  /**
   * Gets the Manhattan distance between two tiles
   * @param {Tile} tile 
   * @returns 
   */
  distanceTo(tile) {
    return Math.abs(this.x - tile.x) + Math.abs(this.y - tile.y);
  }

  /**
   * 
   * @returns {string} HTML representation of this object
   */
  toHTML() {
    let html = `
      <div class="info-heading">Tile</div>
      <span class="info-label">Coordinates </span>
      <span class="info-value">X: ${this.x}, Y: ${this.y}</span>
      <br>
    `;

    if (this.building) {
      html += this.building.toHTML();
    }

    return html;
  }
};