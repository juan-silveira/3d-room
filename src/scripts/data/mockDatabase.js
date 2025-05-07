/**
 * Mock Database for Cultivation Room 3D
 * 
 * This file simulates a database with information about rooms, equipment, and plants.
 * It's structured to be easily replaceable with a real database in the future.
 */

/**
 * Generate a random hexadecimal UID in format XX:XX:XX:XX:XX:XX
 * @returns {string} Hexadecimal identifier
 */
function generateHexUID() {
  return Array.from({ length: 6 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':').toUpperCase();
}

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
        width: 36,
        height: 280,
        wallHeight: 3,
        wallThickness: 0.2
      },
      environmentalData: {
        temperature: 24, // Celsius
        humidity: 65, // Percentage
        co2Level: 1200, // PPM
        lightCycle: '18/6' // Hours on/off
      },
      created: new Date('2023-01-15').toISOString()
    },
    {
      id: 2,
      name: 'Flowering Room',
      dimensions: {
        width: 24,
        height: 180,
        wallHeight: 3,
        wallThickness: 0.2
      },
      environmentalData: {
        temperature: 22, // Celsius
        humidity: 55, // Percentage
        co2Level: 1500, // PPM
        lightCycle: '12/12' // Hours on/off
      },
      created: new Date('2023-03-20').toISOString()
    }
  ],
  
  /**
   * Equipment in the rooms (trays, pots)
   */
  equipment: {
    trays: [
      {
        id: 1,
        roomId: 1,
        position: { x: 2, y: 10 },
        dimensions: {
          width: 4,
          length: 8,
          legHeight: 0.8,
          topThickness: 0.05,
          edgeHeight: 0.1,
          edgeThickness: 0.03
        },
        installed: new Date('2023-02-01').toISOString()
      },
      {
        id: 2,
        roomId: 1,
        position: { x: 10, y: 10 },
        dimensions: {
          width: 4,
          length: 8,
          legHeight: 0.8,
          topThickness: 0.05,
          edgeHeight: 0.1,
          edgeThickness: 0.03
        },
        installed: new Date('2023-02-01').toISOString()
      }
    ],
    
    pots: [
      // First tray pots
      {
        id: 1,
        trayId: 1,
        position: { x: 0, y: 0 },
        shape: 'round',
        dimensions: {
          height: 0.3,
          topDiameter: 0.25,
          bottomDiameter: 0.2
        },
        plantId: 1
      },
      {
        id: 2,
        trayId: 1,
        position: { x: 0, y: 1 },
        shape: 'round',
        dimensions: {
          height: 0.3,
          topDiameter: 0.25,
          bottomDiameter: 0.2
        },
        plantId: 2
      },
      {
        id: 3,
        trayId: 1,
        position: { x: 0, y: 2 },
        shape: 'round',
        dimensions: {
          height: 0.3,
          topDiameter: 0.25,
          bottomDiameter: 0.2
        },
        plantId: 3
      },
      
      // Second tray pots
      {
        id: 11,
        trayId: 2,
        position: { x: 0, y: 0 },
        shape: 'square',
        dimensions: {
          height: 0.3,
          topSide: 0.2,
          bottomSide: 0.15
        },
        plantId: 11
      },
      {
        id: 12,
        trayId: 2,
        position: { x: 0, y: 1 },
        shape: 'square',
        dimensions: {
          height: 0.3,
          topSide: 0.2,
          bottomSide: 0.15
        },
        plantId: 12
      }
    ]
  },
  
  /**
   * Plants in the cultivation rooms
   */
  plants: [
    {
      id: 1,
      uid: 'A1:B2:C3:D4:E5:F6',
      strain: STRAINS.BLUE_DREAM,
      plantedDate: new Date('2023-06-01').toISOString(),
      currentAge: 25, // Days since planting
      growthStage: GROWTH_STAGES.VEGETATIVE.name,
      height: 25, // cm
      health: 95, // 0-100 percentage
      estimatedYield: 150, // grams
      history: [
        {
          id: 1,
          timestamp: new Date('2023-06-01T10:15:00').toISOString(),
          actionType: ACTION_TYPES.PLANTING,
          details: 'Initial planting from seedling',
          userId: 1
        },
        {
          id: 2,
          timestamp: new Date('2023-06-04T09:30:00').toISOString(),
          actionType: ACTION_TYPES.WATERING,
          details: 'First watering, 200ml',
          userId: 3
        },
        {
          id: 3,
          timestamp: new Date('2023-06-08T11:00:00').toISOString(),
          actionType: ACTION_TYPES.NUTRITION,
          details: 'Applied nitrogen-rich nutrients, 100ml',
          userId: 3
        },
        {
          id: 4,
          timestamp: new Date('2023-06-15T14:20:00').toISOString(),
          actionType: ACTION_TYPES.INSPECTION,
          details: 'Healthy growth, no signs of pests or deficiencies',
          userId: 4
        },
        {
          id: 5,
          timestamp: new Date('2023-06-20T10:45:00').toISOString(),
          actionType: ACTION_TYPES.PRUNING,
          details: 'Light pruning to promote bushier growth',
          userId: 1
        }
      ]
    },
    {
      id: 2,
      uid: 'B2:C3:D4:E5:F6:A1',
      strain: STRAINS.NORTHERN_LIGHTS,
      plantedDate: new Date('2023-06-05').toISOString(),
      currentAge: 21, // Days since planting
      growthStage: GROWTH_STAGES.VEGETATIVE.name,
      height: 20, // cm
      health: 90, // 0-100 percentage
      estimatedYield: 130, // grams
      history: [
        {
          id: 101,
          timestamp: new Date('2023-06-05T11:30:00').toISOString(),
          actionType: ACTION_TYPES.PLANTING,
          details: 'Initial planting from seedling',
          userId: 1
        },
        {
          id: 102,
          timestamp: new Date('2023-06-09T10:15:00').toISOString(),
          actionType: ACTION_TYPES.WATERING,
          details: 'Regular watering, 150ml',
          userId: 3
        },
        {
          id: 103,
          timestamp: new Date('2023-06-14T09:45:00').toISOString(),
          actionType: ACTION_TYPES.INSPECTION,
          details: 'Minor yellowing on lower leaves, possible nitrogen deficiency',
          userId: 4
        },
        {
          id: 104,
          timestamp: new Date('2023-06-14T15:20:00').toISOString(),
          actionType: ACTION_TYPES.NUTRITION,
          details: 'Applied additional nitrogen, 120ml',
          userId: 3
        },
        {
          id: 105,
          timestamp: new Date('2023-06-18T13:10:00').toISOString(),
          actionType: ACTION_TYPES.INSPECTION,
          details: 'Leaf color improved, healthy growth resumed',
          userId: 4
        }
      ]
    },
    {
      id: 3,
      uid: 'C3:D4:E5:F6:A1:B2',
      strain: STRAINS.GORILLA_GLUE,
      plantedDate: new Date('2023-06-10').toISOString(),
      currentAge: 16, // Days since planting
      growthStage: GROWTH_STAGES.VEGETATIVE.name,
      height: 15, // cm
      health: 98, // 0-100 percentage
      estimatedYield: 180, // grams
      history: [
        {
          id: 201,
          timestamp: new Date('2023-06-10T09:15:00').toISOString(),
          actionType: ACTION_TYPES.PLANTING,
          details: 'Initial planting from seedling',
          userId: 2
        },
        {
          id: 202,
          timestamp: new Date('2023-06-13T10:30:00').toISOString(),
          actionType: ACTION_TYPES.WATERING,
          details: 'Light watering, 100ml',
          userId: 3
        },
        {
          id: 203,
          timestamp: new Date('2023-06-17T14:45:00').toISOString(),
          actionType: ACTION_TYPES.NUTRITION,
          details: 'Balanced nutrient solution, 150ml',
          userId: 3
        },
        {
          id: 204,
          timestamp: new Date('2023-06-20T11:20:00').toISOString(),
          actionType: ACTION_TYPES.INSPECTION,
          details: 'Exceptional growth rate, very healthy',
          userId: 4
        },
        {
          id: 205,
          timestamp: new Date('2023-06-24T13:10:00').toISOString(),
          actionType: ACTION_TYPES.WATERING,
          details: 'Regular watering, 200ml',
          userId: 1
        }
      ]
    },
    // More plants for second tray
    {
      id: 11,
      uid: 'D4:E5:F6:A1:B2:C3',
      strain: STRAINS.WEDDING_CAKE,
      plantedDate: new Date('2023-05-15').toISOString(),
      currentAge: 42, // Days since planting
      growthStage: GROWTH_STAGES.VEGETATIVE.name,
      height: 80, // cm
      health: 92, // 0-100 percentage
      estimatedYield: 200, // grams
      history: [
        {
          id: 301,
          timestamp: new Date('2023-05-15T10:15:00').toISOString(),
          actionType: ACTION_TYPES.PLANTING,
          details: 'Initial planting from seedling',
          userId: 1
        },
        {
          id: 302,
          timestamp: new Date('2023-05-20T09:30:00').toISOString(),
          actionType: ACTION_TYPES.WATERING,
          details: 'Regular watering, 150ml',
          userId: 3
        },
        {
          id: 303,
          timestamp: new Date('2023-05-27T11:45:00').toISOString(),
          actionType: ACTION_TYPES.NUTRITION,
          details: 'Veg-phase nutrient mix, 180ml',
          userId: 3
        },
        {
          id: 304,
          timestamp: new Date('2023-06-05T14:20:00').toISOString(),
          actionType: ACTION_TYPES.PRUNING,
          details: 'Topped main stem to promote branching',
          userId: 2
        },
        {
          id: 305,
          timestamp: new Date('2023-06-15T10:10:00').toISOString(),
          actionType: ACTION_TYPES.INSPECTION,
          details: 'Branching well, preparing for flowering stage',
          userId: 4
        },
        {
          id: 306,
          timestamp: new Date('2023-06-20T13:30:00').toISOString(),
          actionType: ACTION_TYPES.NUTRITION,
          details: 'Pre-flower nutrient mix, 200ml',
          userId: 3
        }
      ]
    },
    {
      id: 12,
      uid: 'E5:F6:A1:B2:C3:D4',
      strain: STRAINS.SOUR_DIESEL,
      plantedDate: new Date('2023-05-20').toISOString(),
      currentAge: 37, // Days since planting
      growthStage: GROWTH_STAGES.VEGETATIVE.name,
      height: 120, // cm
      health: 88, // 0-100 percentage
      estimatedYield: 170, // grams
      history: [
        {
          id: 401,
          timestamp: new Date('2023-05-20T11:30:00').toISOString(),
          actionType: ACTION_TYPES.PLANTING,
          details: 'Initial planting from seedling',
          userId: 1
        },
        {
          id: 402,
          timestamp: new Date('2023-05-24T10:15:00').toISOString(),
          actionType: ACTION_TYPES.WATERING,
          details: 'Regular watering, 150ml',
          userId: 3
        },
        {
          id: 403,
          timestamp: new Date('2023-05-31T09:45:00').toISOString(),
          actionType: ACTION_TYPES.INSPECTION,
          details: 'Some stretching observed, light adjusted',
          userId: 4
        },
        {
          id: 404,
          timestamp: new Date('2023-06-07T14:20:00').toISOString(),
          actionType: ACTION_TYPES.TREATMENT,
          details: 'Preventative neem oil application',
          userId: 3
        },
        {
          id: 405,
          timestamp: new Date('2023-06-14T13:15:00').toISOString(),
          actionType: ACTION_TYPES.NUTRITION,
          details: 'Balanced nutrient solution, 200ml',
          userId: 3
        },
        {
          id: 406,
          timestamp: new Date('2023-06-21T11:30:00').toISOString(),
          actionType: ACTION_TYPES.PRUNING,
          details: 'Removed lower small branches to focus growth energy',
          userId: 2
        }
      ]
    }
  ]
};

/**
 * Helper methods to interact with the mock database
 */
export const mockDatabaseMethods = {
  /**
   * Gets a room by ID
   * @param {number} roomId Room ID
   * @returns {Object|null} Room object or null if not found
   */
  getRoom(roomId) {
    return mockDatabase.rooms.find(room => room.id === roomId) || null;
  },
  
  /**
   * Gets all equipment in a room
   * @param {number} roomId Room ID
   * @returns {Object} Equipment in the room
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
   * Gets all plants in a room
   * @param {number} roomId Room ID
   * @returns {Array} Plants in the room
   */
  getRoomPlants(roomId) {
    // Get all pots in the room
    const roomPots = this.getRoomEquipment(roomId).pots;
    
    // Get all plants in those pots
    return mockDatabase.plants.filter(plant => 
      roomPots.some(pot => pot.plantId === plant.id)
    );
  },
  
  /**
   * Gets a plant by UID
   * @param {string} uid Plant UID
   * @returns {Object|null} Plant object or null if not found
   */
  getPlantByUID(uid) {
    return mockDatabase.plants.find(plant => plant.uid === uid) || null;
  },
  
  /**
   * Gets all history entries for a plant
   * @param {number} plantId Plant ID
   * @returns {Array} History entries
   */
  getPlantHistory(plantId) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    return plant ? plant.history : [];
  },
  
  /**
   * Gets the pot containing a specific plant
   * @param {number} plantId Plant ID
   * @returns {Object|null} Pot object or null if not found
   */
  getPlantPot(plantId) {
    return mockDatabase.equipment.pots.find(pot => pot.plantId === plantId) || null;
  },
  
  /**
   * Gets the tray containing a specific pot
   * @param {number} potId Pot ID
   * @returns {Object|null} Tray object or null if not found
   */
  getPotTray(potId) {
    const pot = mockDatabase.equipment.pots.find(p => p.id === potId);
    if (!pot) return null;
    
    return mockDatabase.equipment.trays.find(tray => tray.id === pot.trayId) || null;
  }
};

/**
 * Methods to update the mock database (simulating API calls)
 */
export const mockDatabaseAPI = {
  /**
   * Adds a new history entry to a plant
   * @param {number} plantId Plant ID
   * @param {string} actionType Action type
   * @param {string} details Action details
   * @param {number} userId User ID
   * @returns {Object} New history entry
   */
  addPlantHistory(plantId, actionType, details, userId) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    if (!plant) return null;
    
    const newEntry = {
      id: Math.max(0, ...plant.history.map(h => h.id)) + 1,
      timestamp: new Date().toISOString(),
      actionType,
      details,
      userId
    };
    
    plant.history.push(newEntry);
    return newEntry;
  },
  
  /**
   * Updates a plant's growth stage
   * @param {number} plantId Plant ID
   * @param {string} newStage New growth stage
   * @returns {boolean} Success
   */
  updatePlantStage(plantId, newStage) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    if (!plant) return false;
    
    plant.growthStage = newStage;
    return true;
  },
  
  /**
   * Relocates a plant to a different pot
   * @param {number} plantId Plant ID
   * @param {number} newPotId New pot ID
   * @returns {boolean} Success
   */
  relocatePlant(plantId, newPotId) {
    const plant = mockDatabase.plants.find(p => p.id === plantId);
    if (!plant) return false;
    
    const oldPot = mockDatabase.equipment.pots.find(pot => pot.plantId === plantId);
    if (oldPot) {
      oldPot.plantId = null;
    }
    
    const newPot = mockDatabase.equipment.pots.find(pot => pot.id === newPotId);
    if (!newPot) return false;
    
    newPot.plantId = plantId;
    return true;
  }
};

export default { mockDatabase, mockDatabaseMethods, mockDatabaseAPI }; 