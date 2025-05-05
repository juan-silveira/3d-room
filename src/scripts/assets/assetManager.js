import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import viteConfig from '../../../vite.config.js';
import models from './models.js';

const baseUrl = viteConfig.base;

export class AssetManager {
  textureLoader = new THREE.TextureLoader();
  modelLoader = new GLTFLoader();

  textures = {
    'base': this.#loadTexture(`${baseUrl}textures/base.png`),
    'specular': this.#loadTexture(`${baseUrl}textures/specular.png`),
    'grid': this.#loadTexture(`${baseUrl}textures/grid.png`),
    
  };

  models = {};

  sprites = {};

  constructor(onLoad) {
    this.modelCount = Object.keys(models).length;
    this.loadedModelCount = 0;

    for (const [name, meta] of Object.entries(models)) {
      if (meta.procedural) {
        // Just create a placeholder for procedural models
        this.models[name] = new THREE.Group();
        this.loadedModelCount++;
      } else {
      this.#loadModel(name, meta);
      }
    }

    this.onLoad = onLoad;
  }

  /**
   * Returns a cloned copy of a mesh
   * @param {string} name The name of the mesh to retrieve
   * @param {Object} simObject The Object object that corresponds to this mesh
   * @param {boolean} transparent True if materials should be transparent. Default is false.
   * @returns {THREE.Mesh}
   */
  getModel(name, simObject, transparent = false) {
    const mesh = this.models[name].clone();

    mesh.traverse((obj) => {
      obj.userData = {
        instance: simObject,
        id: Math.random().toString(36).substr(2, 9)
      };
      if(obj.material) {
        obj.material = obj.material.clone();
        if (name !== "cannabis-plant") {
          obj.material.transparent = transparent;
        }
      }
    });

    return mesh;
  }
  
  /**
   * Loads the texture at the specified URL
   * @param {string} url 
   * @returns {THREE.Texture} A texture object
   */
  #loadTexture(url, flipY = false) {
    const texture = this.textureLoader.load(url)
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = flipY;
    return texture;
  }

  /**
   * Load the 3D models
   * @param {string} url The URL of the model to load
   */
  #loadModel(name, {filename, scale = 1, rotation = 0, receiveShadow = true, castShadow = true}) {
    this.modelLoader.load(`${baseUrl}models/${filename}`,
      (glb) => {
        let mesh = glb.scene;
        
        mesh.name = filename;

        mesh.traverse((obj) => {
          if (obj.material) {
            if (name !== "cannabis-plant") {
              obj.material = new THREE.MeshLambertMaterial({
                map: this.textures.base,
                specularMap: this.textures.specular
              });
            }
            obj.receiveShadow = receiveShadow;
            obj.castShadow = castShadow;
          }
        });

        mesh.rotation.set(0, THREE.MathUtils.degToRad(rotation), 0);
        mesh.scale.set(scale / 30, scale / 30, scale / 30);

        this.models[name] = mesh;

        // Once all models are loaded
        this.loadedModelCount++;
        if (this.loadedModelCount == this.modelCount) {
          this.onLoad()
        }
      },
      (xhr) => {
        //console.log(`${name} ${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error(error);
      });
  }
}