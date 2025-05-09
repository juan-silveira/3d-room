/**
 * Mock Database for Cultivation Room 3D
 * 
 * This file contains a static database with fixed information about rooms, equipment, and plants.
 * It's structured to be easily replaceable with a real database in the future.
 */

/**
 * Available cannabis species
 */
export const SPECIES = {
  SATIVA: 'Cannabis sativa',
  INDICA: 'Cannabis indica',
  HYBRID: 'Cannabis hybrid'
};

/**
 * Available cannabis strains
 */
export const STRAINS = {
  // Sativa strains
  DURBAN_POISON: { name: 'Durban Poison', species: SPECIES.SATIVA, thcRange: [20, 25], growthTime: 65 },
  SUPER_SILVER_HAZE: { name: 'Super Silver Haze', species: SPECIES.SATIVA, thcRange: [18, 23], growthTime: 70 },
  SOUR_DIESEL: { name: 'Sour Diesel', species: SPECIES.SATIVA, thcRange: [19, 25], growthTime: 75 },
  
  // Indica strains
  NORTHERN_LIGHTS: { name: 'Northern Lights', species: SPECIES.INDICA, thcRange: [16, 21], growthTime: 55 },
  PURPLE_KUSH: { name: 'Purple Kush', species: SPECIES.INDICA, thcRange: [17, 22], growthTime: 50 },
  HINDU_KUSH: { name: 'Hindu Kush', species: SPECIES.INDICA, thcRange: [15, 20], growthTime: 52 },
  
  // Hybrid strains
  BLUE_DREAM: { name: 'Blue Dream', species: SPECIES.HYBRID, thcRange: [17, 24], growthTime: 65 },
  WEDDING_CAKE: { name: 'Wedding Cake', species: SPECIES.HYBRID, thcRange: [22, 28], growthTime: 62 },
  GORILLA_GLUE: { name: 'Gorilla Glue', species: SPECIES.HYBRID, thcRange: [25, 30], growthTime: 58 }
};

/**
 * Growth stages for cannabis plants
 */
export const GROWTH_STAGES = {
  SEEDLING: { name: 'Seedling', days: [0, 14] },
  VEGETATIVE: { name: 'Vegetative', days: [15, 45] },
  FLOWERING: { name: 'Flowering', days: [46, 90] },
  HARVEST: { name: 'Harvest', days: [91, Infinity] }
};

/**
 * Types of actions that can be performed on a plant
 */
export const ACTION_TYPES = {
  PLANTING: 'Planting',
  WATERING: 'Watering',
  NUTRITION: 'Nutrition',
  PRUNING: 'Pruning',
  INSPECTION: 'Inspection',
  TREATMENT: 'Treatment',
  RELOCATION: 'Relocation',
  HARVEST: 'Harvest'
};

/**
 * Mock users who can perform actions
 */
export const USERS = {
  1: { id: 1, name: 'John Smith', role: 'Cultivator' },
  2: { id: 2, name: 'Maria Garcia', role: 'Manager' },
  3: { id: 3, name: 'Alex Johnson', role: 'Technician' },
  4: { id: 4, name: 'Sarah Williams', role: 'Quality Control' }
};

// Fixed date for consistency (30 days ago)
const THIRTY_DAYS_AGO = new Date();
THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

const TWENTY_DAYS_AGO = new Date();
TWENTY_DAYS_AGO.setDate(TWENTY_DAYS_AGO.getDate() - 23);

const FIFTEEN_DAYS_AGO = new Date();
FIFTEEN_DAYS_AGO.setDate(FIFTEEN_DAYS_AGO.getDate() - 15);

const TEN_DAYS_AGO = new Date();
TEN_DAYS_AGO.setDate(TEN_DAYS_AGO.getDate() - 9);

// Predefined UID values
const PLANT_UIDS = [
  'AA:BB:CC:DD:EE:FF',
  '11:22:33:44:55:66',
  'AB:CD:EF:12:34:56',
  'FE:DC:BA:98:76:54',
  'A1:B2:C3:D4:E5:F6',
  'F6:E5:D4:C3:B2:A1',
  '01:23:45:67:89:AB',
  'BA:98:76:54:32:10'
];

// Predefined plant histories
const plantHistories = {
  plant1: [
    {
      id: 1,
      timestamp: THIRTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.PLANTING,
      details: 'Initial planting - Blue Dream',
      userId: 1
    },
    {
      id: 2,
      timestamp: TWENTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.WATERING,
      details: 'Regular watering - 500ml',
      userId: 1
    },
    {
      id: 3,
      timestamp: FIFTEEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.NUTRITION,
      details: 'Nitrogen-rich nutrient solution applied',
      userId: 2
    },
    {
      id: 4,
      timestamp: TEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.INSPECTION,
      details: 'Routine health inspection - looking healthy',
      userId: 4
    }
  ],
  plant2: [
    {
      id: 1,
      timestamp: THIRTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.PLANTING,
      details: 'Initial planting - Northern Lights',
      userId: 2
    },
    {
      id: 2,
      timestamp: TWENTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.WATERING,
      details: 'Light watering - 300ml',
      userId: 1
    },
    {
      id: 3,
      timestamp: FIFTEEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.NUTRITION,
      details: 'CalMag supplement',
      userId: 3
    },
    {
      id: 4,
      timestamp: TEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.PRUNING,
      details: 'Lower fan leaves removed',
      userId: 4
    }
  ],
  plant3: [
    {
      id: 1,
      timestamp: THIRTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.PLANTING,
      details: 'Initial planting - Sour Diesel',
      userId: 3
    },
    {
      id: 2,
      timestamp: TWENTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.WATERING,
      details: 'Deep watering - 700ml',
      userId: 3
    },
    {
      id: 3,
      timestamp: FIFTEEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.NUTRITION,
      details: 'Potassium boost formula',
      userId: 2
    },
    {
      id: 4,
      timestamp: TEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.INSPECTION,
      details: 'Growth measurement - on track',
      userId: 4
    }
  ],
  plant4: [
    {
      id: 1,
      timestamp: THIRTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.PLANTING,
      details: 'Initial planting - Wedding Cake',
      userId: 4
    },
    {
      id: 2,
      timestamp: TWENTY_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.WATERING,
      details: 'Water with pH 6.5',
      userId: 1
    },
    {
      id: 3,
      timestamp: FIFTEEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.TREATMENT,
      details: 'Preventative neem oil application',
      userId: 3
    },
    {
      id: 4,
      timestamp: TEN_DAYS_AGO.toISOString(),
      actionType: ACTION_TYPES.INSPECTION,
      details: 'Leaf inspection - no signs of deficiency',
      userId: 2
    }
  ]
};

// Fixed pot dimensions
const potDimensions = {
  height: 0.3,
  topDiameter: 0.25,
  bottomDiameter: 0.2
};

// Fixed plants with predetermined data
const plants = [
  {
    id: 1,
    uid: PLANT_UIDS[0],
    strain: STRAINS.BLUE_DREAM,
    plantedDate: THIRTY_DAYS_AGO.toISOString(),
    currentAge: 30,
    growthStage: GROWTH_STAGES.VEGETATIVE.name,
    height: 30,
    health: 95,
    estimatedYield: 150,
    history: plantHistories.plant1
  },
  {
    id: 2,
    uid: PLANT_UIDS[1],
    strain: STRAINS.NORTHERN_LIGHTS,
    plantedDate: THIRTY_DAYS_AGO.toISOString(),
    currentAge: 30,
    growthStage: GROWTH_STAGES.VEGETATIVE.name,
    height: 55,
    health: 90,
    estimatedYield: 140,
    history: plantHistories.plant2
  },
  {
    id: 3,
    uid: PLANT_UIDS[2],
    strain: STRAINS.SOUR_DIESEL,
    plantedDate: THIRTY_DAYS_AGO.toISOString(),
    currentAge: 30,
    growthStage: GROWTH_STAGES.VEGETATIVE.name,
    height: 65,
    health: 98,
    estimatedYield: 160,
    history: plantHistories.plant3
  },
  {
    id: 4,
    uid: PLANT_UIDS[3],
    strain: STRAINS.WEDDING_CAKE,
    plantedDate: THIRTY_DAYS_AGO.toISOString(),
    currentAge: 30,
    growthStage: GROWTH_STAGES.VEGETATIVE.name,
    height: 58,
    health: 92,
    estimatedYield: 155,
    history: plantHistories.plant4
  }
];

// Fixed trays
const trays = [
  {
    id: 1,
    roomId: 1,
    position: { x: 5, y: 6 },
    dimensions: {
      width: 4,
      length: 40,
      legHeight: 0.8,
      topThickness: 0.05,
      edgeHeight: 0.1,
      edgeThickness: 0.03
    },
    installed: new Date().toISOString()
  },
  {
    id: 2,
    roomId: 1,
    position: { x: 14, y: 6 },
    dimensions: {
      width: 4,
      length: 40,
      legHeight: 0.8,
      topThickness: 0.05,
      edgeHeight: 0.1,
      edgeThickness: 0.03
    },
    installed: new Date().toISOString()
  },
  {
    id: 3,
    roomId: 1,
    position: { x: 23, y: 6 },
    dimensions: {
      width: 4,
      length: 40,
      legHeight: 0.8,
      topThickness: 0.05,
      edgeHeight: 0.1,
      edgeThickness: 0.03
    },
    installed: new Date().toISOString()
  },
  {
    id: 4,
    roomId: 1,
    position: { x: 32, y: 6 },
    dimensions: {
      width: 4,
      length: 40,
      legHeight: 0.8,
      topThickness: 0.05,
      edgeHeight: 0.1,
      edgeThickness: 0.03
    },
    installed: new Date().toISOString()
  }
];

// Fixed pots with predetermined positions
const pots = [
  {
    id: 1,
    trayId: 1,
    position: { x: 1, y: 1 },
    shape: 'round',
    dimensions: potDimensions,
    plantId: 1
  },
  {
    id: 2,
    trayId: 1,
    position: { x: 1, y: 4 },
    shape: 'round',
    dimensions: potDimensions,
    plantId: 2
  },
  {
    id: 3,
    trayId: 2,
    position: { x: 2, y: 1 },
    shape: 'round',
    dimensions: potDimensions,
    plantId: 3
  },
  {
    id: 4,
    trayId: 2,
    position: { x: 2, y: 4 },
    shape: 'round',
    dimensions: potDimensions,
    plantId: 4
  }
];

/**
 * Mock database for rooms, equipment, and plants
 */
export const mockDatabase = {
  /**
   * Available rooms
   */
  rooms: [
    {
      id: 1,
      name: 'Main Cultivation Room',
      dimensions: {
        width: 40,
        height: 50,
        wallHeight: 3,
        wallThickness: 0.06
      },
      environmentalData: {
        temperature: 24, // Celsius
        humidity: 65, // Percentage
        co2Level: 1200, // PPM
        lightCycle: '18/6' // Hours on/off
      },
      doors: [
        {
          position: { x: 10, y: 0 },
          width: 5, // 5 tiles width
          wallSide: 'south' // Door on the south wall
        }
      ],
      created: new Date().toISOString()
    }
  ],
  
  /**
   * Equipment in the rooms (trays, pots)
   */
  equipment: {
    trays: trays,
    pots: pots
  },
  
  /**
   * Plants in the cultivation rooms
   */
  plants: plants
};

/**
 * Methods to access the mock database
 */
export const mockDatabaseMethods = {
  /**
   * Get room by ID
   * @param {number} roomId 
   * @returns {Object|null} Room data or null if not found
   */
  getRoom(roomId) {
    return mockDatabase.rooms.find(room => room.id === roomId) || null;
  },
  
  /**
   * Get all equipment in a room
   * @param {number} roomId 
   * @returns {Object} Object with trays and pots arrays
   */
  getRoomEquipment(roomId) {
    return {
      trays: mockDatabase.equipment.trays.filter(tray => tray.roomId === roomId),
      pots: mockDatabase.equipment.pots.filter(pot => {
        const tray = mockDatabase.equipment.trays.find(t => t.id === pot.trayId);
        return tray && tray.roomId === roomId;
      })
    };
  },
  
  /**
   * Get all plants in a room
   * @param {number} roomId 
   * @returns {Array} Array of plants
   */
  getRoomPlants(roomId) {
    const roomPots = this.getRoomEquipment(roomId).pots;
    const plantIds = roomPots.map(pot => pot.plantId).filter(id => id);
    return mockDatabase.plants.filter(plant => plantIds.includes(plant.id));
  },
  
  /**
   * Get plant by UID
   * @param {string} uid 
   * @returns {Object|null} Plant data or null if not found
   */
  getPlantByUID(uid) {
    return mockDatabase.plants.find(plant => plant.uid === uid) || null;
  },
  
  /**
   * Get plant history
   * @param {number} plantId 
   * @returns {Array} Plant history events
   */
  getPlantHistory(plantId) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    return plant ? plant.history : [];
  },
  
  /**
   * Get pot containing a plant
   * @param {number} plantId 
   * @returns {Object|null} Pot data or null if not found
   */
  getPlantPot(plantId) {
    return mockDatabase.equipment.pots.find(pot => pot.plantId === plantId) || null;
  },
  
  /**
   * Get tray containing a pot
   * @param {number} potId 
   * @returns {Object|null} Tray data or null if not found
   */
  getPotTray(potId) {
    const pot = mockDatabase.equipment.pots.find(p => p.id === potId);
    if (!pot) return null;
    
    return mockDatabase.equipment.trays.find(tray => tray.id === pot.trayId) || null;
  },
  
  /**
   * Get all equipment for a specific plant (pot and tray)
   * @param {number} plantId 
   * @returns {Object} Object with pot and tray properties
   */
  getPlantEquipment(plantId) {
    const pot = this.getPlantPot(plantId);
    const tray = pot ? this.getPotTray(pot.id) : null;
    
    return { pot, tray };
  },
  
  /**
   * Add a history event to a plant
   * @param {number} plantId 
   * @param {string} actionType 
   * @param {string} details 
   * @param {number} userId 
   * @returns {boolean} Success status
   */
  addPlantHistory(plantId, actionType, details, userId) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    if (!plant) return false;
    
    const newHistoryId = Math.max(...plant.history.map(h => h.id), 0) + 1;
    plant.history.push({
      id: newHistoryId,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userId
    });
    
    return true;
  },
  
  /**
   * Update plant growth stage
   * @param {number} plantId 
   * @param {string} newStage 
   * @returns {boolean} Success status
   */
  updatePlantStage(plantId, newStage) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    if (!plant) return false;
    
    plant.growthStage = newStage;
    this.addPlantHistory(plantId, ACTION_TYPES.INSPECTION, `Updated growth stage to ${newStage}`, 1);
    
    return true;
  },
  
  /**
   * Relocate a plant to a new pot
   * @param {number} plantId 
   * @param {number} newPotId 
   * @returns {boolean} Success status
   */
  relocatePlant(plantId, newPotId) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    const currentPot = this.getPlantPot(plantId);
    const newPot = mockDatabase.equipment.pots.find(p => p.id === newPotId);
    
    if (!plant || !currentPot || !newPot || newPot.plantId) return false;
    
    // Remove plant from current pot
    currentPot.plantId = null;
    
    // Add plant to new pot
    newPot.plantId = plantId;
    
    // Add history entry
    this.addPlantHistory(plantId, ACTION_TYPES.RELOCATION, `Relocated to new pot #${newPotId}`, 1);
    
    return true;
  }
};

export default { mockDatabase, mockDatabaseMethods }; 