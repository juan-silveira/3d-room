import { Building } from '../building.js';
import { BuildingType } from '../buildingType.js';

export class CannabisPlant extends Building {
  /**
   * Capacidade de produção (exemplo, pode ser alterado)
   */
  productionCapacity = 50;

  constructor(x, y) {
    super(x, y);
    this.type = BuildingType.cannabisPlant;
    this.name = generatePlantName();
    this.power.required = 0; // Não precisa de energia
    this.roadAccess.value = true; // Sempre tem acesso à estrada
  }

  // Sobrescreve para nunca mostrar status de falta de energia ou estrada
  setStatus(status) {
    // Não faz nada
  }

  refreshView() {
    let mesh = window.assetManager.getModel(this.type, this);
    this.setMesh(mesh);
  }

  /**
   * Retorna uma representação HTML deste objeto
   * @returns {string}
   */
  toHTML() {
    let html = super.toHTML();
    html += `
      <div class="info-heading">Cannabis Plant</div>
      <span class="info-label">Production Capacity</span>
      <span class="info-value">${this.productionCapacity}</span>
      <br>
    `;
    return html;
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