import { Building } from '../building.js';
import { BuildingType } from '../buildingType.js';
import { TILE_SCALE, metersToTileUnits } from '../../constants.js';
import { mockDatabase, mockDatabaseMethods, STRAINS, GROWTH_STAGES } from '../../../data/mockDatabase.js';

export class CannabisPlant extends Building {
  /**
   * Unique identifier for the plant in XX:XX:XX:XX:XX:XX format
   * @type {string}
   */
  uid = '';
  
  /**
   * Strain of the plant
   * @type {Object}
   */
  strain = null;
  
  /**
   * Date when the plant was planted
   * @type {Date}
   */
  plantedDate = null;
  
  /**
   * Current age of the plant in days
   * @type {number}
   */
  currentAge = 0;
  
  /**
   * Current growth stage
   * @type {string}
   */
  growthStage = '';
  
  /**
   * Current height in cm
   * @type {number}
   */
  height = 0;
  
  /**
   * Health percentage (0-100)
   * @type {number}
   */
  health = 100;
  
  /**
   * Estimated yield in grams
   * @type {number}
   */
  estimatedYield = 0;
  
  /**
   * History of actions performed on this plant
   * @type {Array}
   */
  history = [];

  /**
   * Create a new cannabis plant
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   * @param {Object|string} plantData Plant data object from the database or UID string
   */
  constructor(x, y, plantData = null) {
    super(x, y);
    this.type = BuildingType.cannabisPlant;
    
    if (plantData) {
      // Initialize with provided plant data
      if (typeof plantData === 'string') {
        // If plantData is a string, assume it's a UID and look it up
        const plant = mockDatabaseMethods.getPlantByUID(plantData);
        if (plant) {
          this.#initializeFromData(plant);
        } else {
          console.error(`No plant found with UID: ${plantData}`);
          this.#initializeDefault();
        }
      } else {
        // If plantData is an object, use it directly
        this.#initializeFromData(plantData);
      }
    } else {
      // Generate random plant data if none provided
      this.#initializeRandom();
    }
  }
  
  /**
   * Initialize plant data from a database plant object
   * @param {Object} plantData Plant data from the database
   * @private
   */
  #initializeFromData(plantData) {
    this.uid = plantData.uid;
    this.name = plantData.strain.name;
    this.strain = plantData.strain;
    this.plantedDate = new Date(plantData.plantedDate);
    this.currentAge = plantData.currentAge;
    this.growthStage = plantData.growthStage;
    this.height = plantData.height;
    this.health = plantData.health;
    this.estimatedYield = plantData.estimatedYield;
    this.history = plantData.history.slice(); // Clone the history array
  }
  
  /**
   * Initialize with random plant data for testing
   * @private
   */
  #initializeRandom() {
    // Generate a random UID
    this.uid = Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase();
    
    // Pick a random strain
    const strainKeys = Object.keys(STRAINS);
    const randomStrain = STRAINS[strainKeys[Math.floor(Math.random() * strainKeys.length)]];
    this.strain = randomStrain;
    this.name = randomStrain.name;
    
    // Set other properties
    const now = new Date();
    this.plantedDate = new Date(now.getTime() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
    this.currentAge = Math.floor((now - this.plantedDate) / (24 * 60 * 60 * 1000));
    
    // Set growth stage based on age
    if (this.currentAge <= GROWTH_STAGES.SEEDLING.days[1]) {
      this.growthStage = GROWTH_STAGES.SEEDLING.name;
    } else if (this.currentAge <= GROWTH_STAGES.VEGETATIVE.days[1]) {
      this.growthStage = GROWTH_STAGES.VEGETATIVE.name;
    } else if (this.currentAge <= GROWTH_STAGES.FLOWERING.days[1]) {
      this.growthStage = GROWTH_STAGES.FLOWERING.name;
    } else {
      this.growthStage = GROWTH_STAGES.HARVEST.name;
    }
    
    // Height based on growth stage
    if (this.growthStage === GROWTH_STAGES.SEEDLING.name) {
      this.height = Math.floor(Math.random() * 10) + 5; // 5-15cm
    } else if (this.growthStage === GROWTH_STAGES.VEGETATIVE.name) {
      this.height = Math.floor(Math.random() * 30) + 15; // 15-45cm
    } else {
      this.height = Math.floor(Math.random() * 60) + 45; // 45-105cm
    }
    
    // Health and yield
    this.health = Math.floor(Math.random() * 20) + 80; // 80-100%
    this.estimatedYield = Math.floor(Math.random() * 100) + 100; // 100-200g
    
    // Create minimal history
    this.history = [
      {
        id: 1,
        timestamp: this.plantedDate.toISOString(),
        actionType: 'Planting',
        details: 'Initial planting from seedling',
        userId: 1
      }
    ];
  }
  
  /**
   * Initialize with default values
   * @private
   */
  #initializeDefault() {
    this.uid = Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase();
    this.strain = STRAINS.BLUE_DREAM;
    this.name = this.strain.name;
    this.plantedDate = new Date();
    this.currentAge = 0;
    this.growthStage = GROWTH_STAGES.SEEDLING.name;
    this.height = 5;
    this.health = 100;
    this.estimatedYield = 0;
    this.history = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        actionType: 'Planting',
        details: 'Initial planting from seedling',
        userId: 1
      }
    ];
  }

  refreshView() {
    let mesh = window.assetManager.getModel(this.type, this);
    
    // Base scale based on growth stage
    let baseScale = 0.4; // Base scale for seedling
    
    if (this.growthStage === GROWTH_STAGES.VEGETATIVE.name) {
      baseScale = 0.6;
    } else if (this.growthStage === GROWTH_STAGES.FLOWERING.name) {
      baseScale = 0.8;
    } else if (this.growthStage === GROWTH_STAGES.HARVEST.name) {
      baseScale = 1.0;
    }
    
    // Adjust scale based on plant height with a maximum of 200cm
    // Use a more linear scaling approach without strict limits
    let heightFactor = 1.0;
    
    if (this.height > 0) {
      if (this.growthStage === GROWTH_STAGES.SEEDLING.name) {
        // Seedlings expected range: 5-15cm, max 25cm
        // More linear scaling without the 0.5-1.5 limits
        heightFactor = this.height / 10;
      } else if (this.growthStage === GROWTH_STAGES.VEGETATIVE.name) {
        // Vegetative expected range: 15-60cm
        heightFactor = this.height / 30;
      } else if (this.growthStage === GROWTH_STAGES.FLOWERING.name) {
        // Flowering expected range: 45-120cm
        heightFactor = this.height / 75;
      } else {
        // Harvest expected range: 60-200cm
        heightFactor = this.height / 90;
      }
      
      // Apply minimum scale but no maximum (within reason)
      heightFactor = Math.max(0.3, heightFactor);
      
      // Ensure very tall plants (over 200cm) don't get unreasonably large
      if (this.height > 200) {
        // Logarithmic scaling for very tall plants
        heightFactor = Math.log10(this.height) / Math.log10(200) * (this.height / 90);
      }
    }
    
    // Apply final scale (base scale adjusted by height factor)
    const finalScale = baseScale * heightFactor;
    
    mesh.scale.set(finalScale, finalScale, finalScale);
    this.setMesh(mesh);
    
    // Log for debugging
    console.log(`Plant ${this.uid} - Stage: ${this.growthStage}, Height: ${this.height}cm, Scale: ${finalScale}`);
  }
  
  /**
   * Add a history entry for an action performed on this plant
   * @param {string} actionType Type of action (from ACTION_TYPES)
   * @param {string} details Details of the action
   * @param {number} userId ID of the user performing the action
   * @returns {Object} The newly created history entry
   */
  addHistoryEntry(actionType, details, userId) {
    const newEntry = {
      id: this.history.length > 0 ? Math.max(...this.history.map(h => h.id)) + 1 : 1,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userId
    };
    
    this.history.push(newEntry);
    return newEntry;
  }
  
  /**
   * Get formatted history entries, sorted by timestamp 
   * @param {string} sortOrder 'asc' or 'desc'
   * @param {string} filterType Filter by action type or null for all
   * @returns {Array} Formatted history entries
   */
  getFormattedHistory(sortOrder = 'desc', filterType = null) {
    let filteredHistory = filterType 
      ? this.history.filter(entry => entry.actionType === filterType) 
      : this.history;
    
    // Sort by timestamp
    filteredHistory.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    // Format entries
    return filteredHistory.map(entry => {
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      // Get user info
      const user = mockDatabase.USERS && mockDatabase.USERS[entry.userId] 
        ? mockDatabase.USERS[entry.userId] 
        : { name: 'Unknown User', role: 'Unknown' };
      
      return {
        ...entry,
        formattedTimestamp: formattedDate,
        user
      };
    });
  }

  /**
   * Returns HTML representation for the info panel
   * @returns {string}
   */
  toHTML() {
    let html = super.toHTML();
    
    // Basic plant info section
    html += `
      <div class="info-heading">Cannabis Plant</div>
      <span class="info-label">UID</span>
      <span class="info-value">${this.uid}</span>
      <br>
      
      <div class="plant-uid-container">
        <div class="plant-uid-qr" id="plant-qr-code"></div>
      </div>
      
      <span class="info-label">Strain</span>
      <span class="info-value">${this.strain.name}</span>
      <br>
      <span class="info-label">Species</span>
      <span class="info-value">${this.strain.species}</span>
      <br>
      <span class="info-label">THC Range</span>
      <span class="info-value">${this.strain.thcRange[0]}%-${this.strain.thcRange[1]}%</span>
      <br>
      <span class="info-label">Age</span>
      <span class="info-value">${this.currentAge} days</span>
      <br>
      <span class="info-label">Growth Stage</span>
      <span class="info-value">${this.growthStage}</span>
      <br>
      <span class="info-label">Height</span>
      <span class="info-value">${this.height} cm</span>
      <br>
      <span class="info-label">Health</span>
      <span class="info-value">${this.health}%</span>
      <br>
      <span class="info-label">Est. Yield</span>
      <span class="info-value">${this.estimatedYield} g</span>
      <br>
    `;
    
    // Plant history section with improved event attribution
    html += `
      <div class="info-heading mt-3">Plant History</div>
      <div class="history-controls">
        <select id="history-filter" class="form-select form-select-sm">
          <option value="all">All Actions</option>
          <option value="Planting">Planting</option>
          <option value="Watering">Watering</option>
          <option value="Nutrition">Nutrition</option>
          <option value="Pruning">Pruning</option>
          <option value="Inspection">Inspection</option>
          <option value="Treatment">Treatment</option>
          <option value="Relocation">Relocation</option>
          <option value="Harvest">Harvest</option>
        </select>
        <select id="history-sort" class="form-select form-select-sm mt-1">
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
      <div id="history-entries" class="history-list">
        ${this.#generateHistoryHTML()}
      </div>
    `;
    
    // Add event listeners for filtering and sorting (will be added by UI.js)
    setTimeout(() => {
      const filterSelect = document.getElementById('history-filter');
      const sortSelect = document.getElementById('history-sort');
      const entriesDiv = document.getElementById('history-entries');
      
      if (filterSelect && sortSelect && entriesDiv) {
        const updateHistoryDisplay = () => {
          const filterValue = filterSelect.value;
          const sortValue = sortSelect.value;
          
          const filterType = filterValue === 'all' ? null : filterValue;
          const formattedHistory = this.getFormattedHistory(sortValue, filterType);
          
          entriesDiv.innerHTML = this.#generateHistoryHTML(formattedHistory);
        };
        
        filterSelect.addEventListener('change', updateHistoryDisplay);
        sortSelect.addEventListener('change', updateHistoryDisplay);
      }
      
      // Generate QR code for plant UID
      try {
        const qrCodeContainer = document.getElementById('plant-qr-code');
        if (qrCodeContainer && typeof QRCode !== 'undefined') {
          // Clear previous QR code if any
          qrCodeContainer.innerHTML = '';
          
          // Create new QR code
          new QRCode(qrCodeContainer, {
            text: this.uid,
            width: 70,
            height: 70,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        } else {
          // If QRCode library is not available, add a link to load it
          if (qrCodeContainer && !document.getElementById('qrcode-script')) {
            const qrScript = document.createElement('script');
            qrScript.id = 'qrcode-script';
            qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
            qrScript.onload = () => {
              new QRCode(qrCodeContainer, {
                text: this.uid,
                width: 70,
                height: 70,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
              });
            };
            document.head.appendChild(qrScript);
          }
        }
      } catch (error) {
        console.warn('Error generating QR code:', error);
      }
    }, 0);
    
    return html;
  }
  
  /**
   * Generate HTML for history entries
   * @param {Array} entries Optional array of pre-formatted entries
   * @returns {string} HTML for history entries
   * @private
   */
  #generateHistoryHTML(entries = null) {
    const historyEntries = entries || this.getFormattedHistory();
    
    if (historyEntries.length === 0) {
      return '<div class="history-empty">No history available</div>';
    }
    
    return historyEntries.map(entry => `
      <div class="history-entry">
        <div class="history-entry-header">
          <span class="history-type">${entry.actionType}</span>
          <span class="history-date">${entry.formattedTimestamp}</span>
        </div>
        <div class="history-entry-body">
          <p>${entry.details}</p>
        </div>
        <div class="history-entry-footer">
          <span class="history-user">By: ${entry.user.name} (${entry.user.role})</span>
        </div>
      </div>
    `).join('');
  }
}

// Gerador de nomes para a planta
const prefixes = ['Emerald', 'Golden', 'Purple', 'Frosty', 'Crystal', 'Royal', 'Dank', 'Frosted', 'Stellar', 'Tropical'];
const suffixes = ['Kush', 'Haze', 'Dream', 'Frost', 'Crystal', 'Diamond', 'Star', 'Moon', 'Sun', 'Sky'];
function generatePlantName() {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return prefix + ' ' + suffix;
} 