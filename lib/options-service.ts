import { ServiceType } from '@prisma/client';

// Mapping des ServiceType vers les fichiers JSON
export const SERVICE_TYPE_TO_JSON_FILE: Record<ServiceType, string> = {
  LIEU: 'reception-venue-options.json',
  TRAITEUR: 'caterer-options.json',
  FAIRE_PART: 'invitation-options.json',
  CADEAUX_INVITES: 'guest-gifts-options.json',
  PHOTOGRAPHE: 'photographer-options.json',
  MUSIQUE: 'music-dj-options.json',
  VOITURE: 'vehicle-options.json',
  BUS: 'vehicle-options.json', // Utilise le même fichier que VOITURE
  DECORATION: 'decoration-options.json',
  CHAPITEAU: 'tent-options.json',
  ANIMATION: 'animation-options.json',
  FLORISTE: 'florist-options.json',
  LISTE: 'wedding-registry-options.json',
  ORGANISATION: 'wedding-planner-options.json',
  VIDEO: 'video-options.json',
  LUNE_DE_MIEL: 'honeymoon-travel-options.json',
  WEDDING_CAKE: 'wedding-cake-options.json',
  OFFICIANT: 'officiant-options.json',
  FOOD_TRUCK: 'food-truck-options.json',
  VIN: 'wine-options.json'
};

// Mapping des types de prestataires vers les fichiers JSON
export const PROVIDER_TYPE_TO_JSON_FILE: Record<string, string> = {
  'reception-venue': 'reception-venue-options.json',
  'caterer': 'caterer-options.json',
  'invitation': 'invitation-options.json',
  'guest-gifts': 'guest-gifts-options.json',
  'photographer': 'photographer-options.json',
  'music-dj': 'music-dj-options.json',
  'vehicle': 'vehicle-options.json',
  'decoration': 'decoration-options.json',
  'tent': 'tent-options.json',
  'animation': 'animation-options.json',
  'florist': 'florist-options.json',
  'wedding-registry': 'wedding-registry-options.json',
  'wedding-planner': 'wedding-planner-options.json',
  'video': 'video-options.json',
  'honeymoon-travel': 'honeymoon-travel-options.json',
  'wedding-cake': 'wedding-cake-options.json',
  'officiant': 'officiant-options.json',
  'food-truck': 'food-truck-options.json',
  'wine': 'wine-options.json',
  'wedding-dress': 'wedding-dress-options.json',
  'jewelry': 'jewelry-options.json',
  'beauty-hair': 'beauty-hair-options.json',
  'groom-suit': 'groom-suit-options.json'
};

// Mapping des types de prestataires vers les clés JSON internes
export const PROVIDER_TYPE_TO_JSON_KEY: Record<string, string> = {
  'reception-venue': 'lieu_reception',
  'caterer': 'traiteur',
  'invitation': 'faire_part',
  'guest-gifts': 'cadeaux_invites',
  'photographer': 'photographe',
  'music-dj': 'musique_dj',
  'vehicle': 'voiture',
  'decoration': 'decoration',
  'tent': 'chapiteau',
  'animation': 'animation',
  'florist': 'fleurs',
  'wedding-registry': 'liste_cadeau_mariage',
  'wedding-planner': 'organisation',
  'video': 'video',
  'honeymoon-travel': 'voyage',
  'wedding-cake': 'wedding_cake',
  'officiant': 'officiants',
  'food-truck': 'food_truck',
  'wine': 'vin',
  'wedding-dress': 'wedding_dress',
  'jewelry': 'jewelry',
  'beauty-hair': 'beauty_hair',
  'groom-suit': 'groom_suit'
};

// Mapping des ServiceType vers les clés JSON internes
export const SERVICE_TYPE_TO_JSON_KEY: Record<ServiceType, string> = {
  LIEU: 'lieu_reception',
  TRAITEUR: 'traiteur',
  FAIRE_PART: 'faire_part',
  CADEAUX_INVITES: 'cadeaux_invites',
  PHOTOGRAPHE: 'photographe',
  MUSIQUE: 'musique_dj',
  VOITURE: 'voiture',
  BUS: 'voiture',
  DECORATION: 'decoration',
  CHAPITEAU: 'chapiteau',
  ANIMATION: 'animation',
  FLORISTE: 'fleurs',
  LISTE: 'liste_cadeau_mariage',
  ORGANISATION: 'organisation',
  VIDEO: 'video',
  LUNE_DE_MIEL: 'voyage',
  WEDDING_CAKE: 'wedding_cake',
  OFFICIANT: 'officiants',
  FOOD_TRUCK: 'food_truck',
  VIN: 'vin'
};

// Types pour les options
export interface OptionField {
  id: string;
  question: string;
  component_type: string;
  field_type?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  condition?: {
    field: string;
    value: string;
  };
}

export interface OptionSection {
  title: string;
  fields: OptionField[];
}

export interface ProviderOptions {
  [key: string]: {
    sections: OptionSection[];
  };
}

export interface FormData {
  [key: string]: any;
}

export interface SearchableOptions {
  capacite_max?: number;
  prix_min?: number;
  prix_max?: number;
  services_disponibles?: string[];
  localisation?: string;
  style?: string[];
  type_cuisine?: string[];
  menus_specifiques?: string[];
  styles_photos?: string[];
  techniques_photo?: string[];
  services_complementaires?: string[];
  types_vehicules?: string[];
  types_animations?: string[];
  types_fleurs?: string[];
  types_voyages?: string[];
  [key: string]: any;
}

// Service principal pour la gestion des options
export class OptionsService {
  /**
   * Charge les options JSON pour un type de service donné
   */
  static async loadProviderOptions(serviceType: ServiceType): Promise<ProviderOptions | null> {
    try {
      const fileName = SERVICE_TYPE_TO_JSON_FILE[serviceType];
      if (!fileName) {
        console.error(`Aucun fichier JSON trouvé pour le serviceType: ${serviceType}`);
        return null;
      }

      // Utiliser fetch pour charger le fichier JSON côté client
      if (typeof window !== 'undefined') {
        const response = await fetch(`/partners-options/${fileName}`);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const options = await response.json();
        return options;
      } else {
        // Côté serveur, utiliser fs
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'partners-options', fileName);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const options = JSON.parse(fileContent);
        return options;
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des options pour ${serviceType}:`, error);
      return null;
    }
  }

  /**
   * Charge les options JSON pour un type de prestataire donné
   */
  static async loadProviderOptionsByType(providerType: string): Promise<ProviderOptions | null> {
    try {

      const fileName = PROVIDER_TYPE_TO_JSON_FILE[providerType];
      if (!fileName) {
        console.error(`[OptionsService] Aucun fichier JSON trouvé pour le providerType: ${providerType}`);
        return null;
      }

      // Utiliser fetch pour charger le fichier JSON côté client
      if (typeof window !== 'undefined') {

        const response = await fetch(`/partners-options/${fileName}`);

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const options = await response.json();

        const jsonKey = PROVIDER_TYPE_TO_JSON_KEY[providerType];

        if (jsonKey && options[jsonKey]) {
          const result = {
            [providerType]: options[jsonKey]
          };

          return result;
        }

        return { [providerType]: options };
      } else {
        // Côté serveur, utiliser fs

        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'partners-options', fileName);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const options = JSON.parse(fileContent);

        const jsonKey = PROVIDER_TYPE_TO_JSON_KEY[providerType];

        if (jsonKey && options[jsonKey]) {
          const result = {
            [providerType]: options[jsonKey]
          };

          return result;
        }
        return { [providerType]: options };
      }
    } catch (error) {
      console.error(`[OptionsService] Erreur lors du chargement des options pour ${providerType}:`, error);
      return null;
    }
  }

  /**
   * Génère les searchableOptions à partir des données du formulaire
   */
  static generateSearchableOptions(
    formData: FormData,
    serviceType: ServiceType,
    providerOptions: ProviderOptions
  ): SearchableOptions {
    const jsonKey = SERVICE_TYPE_TO_JSON_KEY[serviceType];
    const providerData = providerOptions[jsonKey];
    
    if (!providerData) {
      console.error(`Aucune donnée trouvée pour la clé: ${jsonKey}`);
      return {};
    }

    const searchable: SearchableOptions = {};

    // Parcourir toutes les sections et questions
    providerData.sections.forEach(section => {
      section.fields.forEach(field => {
        const fieldKey = `question_${field.id}`;
        const value = formData[fieldKey];

        if (!value) return;

        // Mapping intelligent basé sur le contenu de la question
        this.mapQuestionToSearchable(field, value, searchable);
      });
    });

    return searchable;
  }

  /**
   * Mappe une question vers les searchableOptions
   */
  private static mapQuestionToSearchable(
    field: OptionField,
    value: any,
    searchable: SearchableOptions
  ): void {
    const content = field.question.toLowerCase();

    // Capacité
    if (content.includes('capacité') || content.includes('assise') || content.includes('debout')) {
      const num = this.extractNumber(value);
      if (num) {
        searchable.capacite_max = Math.max(searchable.capacite_max || 0, num);
      }
    }

    // Prix
    if (content.includes('tarif') || content.includes('prix') || content.includes('budget')) {
      const num = this.extractNumber(value);
      if (num) {
        if (!searchable.prix_min || num < searchable.prix_min) {
          searchable.prix_min = num;
        }
        if (!searchable.prix_max || num > searchable.prix_max) {
          searchable.prix_max = num;
        }
      }
    }

    // Services
    if (content.includes('services') || content.includes('proposez-vous')) {
      if (Array.isArray(value)) {
        searchable.services_disponibles = value;
      } else if (typeof value === 'string') {
        searchable.services_disponibles = [value];
      }
    }

    // Localisation
    if (content.includes('adresse') || content.includes('ville') || content.includes('région')) {
      searchable.localisation = value;
    }

    // Style
    if (content.includes('style') || content.includes('type')) {
      if (Array.isArray(value)) {
        searchable.style = value;
      } else if (typeof value === 'string') {
        searchable.style = [value];
      }
    }

    // Types de cuisine
    if (content.includes('cuisine') || content.includes('type de cuisine')) {
      if (Array.isArray(value)) {
        searchable.type_cuisine = value;
      } else if (typeof value === 'string') {
        searchable.type_cuisine = [value];
      }
    }

    // Menus spécifiques
    if (content.includes('menus') || content.includes('végétarien') || content.includes('sans gluten')) {
      if (Array.isArray(value)) {
        searchable.menus_specifiques = value;
      } else if (typeof value === 'string') {
        searchable.menus_specifiques = [value];
      }
    }

    // Styles de photos
    if (content.includes('style') && content.includes('photo')) {
      if (Array.isArray(value)) {
        searchable.styles_photos = value;
      } else if (typeof value === 'string') {
        searchable.styles_photos = [value];
      }
    }

    // Techniques photo
    if (content.includes('technique') || content.includes('numérique') || content.includes('argentique')) {
      if (Array.isArray(value)) {
        searchable.techniques_photo = value;
      } else if (typeof value === 'string') {
        searchable.techniques_photo = [value];
      }
    }

    // Services complémentaires
    if (content.includes('complémentaires') || content.includes('additionnels')) {
      if (Array.isArray(value)) {
        searchable.services_complementaires = value;
      } else if (typeof value === 'string') {
        searchable.services_complementaires = [value];
      }
    }

    // Types de véhicules
    if (content.includes('véhicule') || content.includes('voiture') || content.includes('limousine')) {
      if (Array.isArray(value)) {
        searchable.types_vehicules = value;
      } else if (typeof value === 'string') {
        searchable.types_vehicules = [value];
      }
    }

    // Types d'animations
    if (content.includes('animation') || content.includes('magie') || content.includes('théâtre')) {
      if (Array.isArray(value)) {
        searchable.types_animations = value;
      } else if (typeof value === 'string') {
        searchable.types_animations = [value];
      }
    }

    // Types de fleurs
    if (content.includes('fleurs') || content.includes('bouquet') || content.includes('décoration florale')) {
      if (Array.isArray(value)) {
        searchable.types_fleurs = value;
      } else if (typeof value === 'string') {
        searchable.types_fleurs = [value];
      }
    }

    // Types de voyages
    if (content.includes('voyage') || content.includes('destination') || content.includes('type de voyage')) {
      if (Array.isArray(value)) {
        searchable.types_voyages = value;
      } else if (typeof value === 'string') {
        searchable.types_voyages = [value];
      }
    }
  }

  /**
   * Extrait un nombre d'une valeur
   */
  private static extractNumber(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }
    return null;
  }

  /**
   * Sauvegarde les options pour un storefront
   */
  static async saveOptions(
    storefrontId: string,
    serviceType: ServiceType,
    formData: FormData
  ): Promise<{ options: FormData; searchableOptions: SearchableOptions }> {
    const providerOptions = await this.loadProviderOptions(serviceType);
    
    if (!providerOptions) {
      throw new Error(`Impossible de charger les options pour ${serviceType}`);
    }

    const searchableOptions = this.generateSearchableOptions(formData, serviceType, providerOptions);

    return {
      options: formData,
      searchableOptions
    };
  }
} 