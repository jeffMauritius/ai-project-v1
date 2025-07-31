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
  question_id: number;
  content: string;
  component_type: string;
  field_type?: string;
  required?: boolean;
  options?: string[];
  unit?: string;
  conditional_field?: {
    depends_on: string;
    value: string;
  };
}

export interface OptionSection {
  section_id: number;
  title: string;
  questions: OptionField[];
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

      const options = await import(`../partners-options/${fileName}`);
      return options.default || options;
    } catch (error) {
      console.error(`Erreur lors du chargement des options pour ${serviceType}:`, error);
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
      section.questions.forEach(question => {
        const fieldKey = `question_${question.question_id}`;
        const value = formData[fieldKey];

        if (!value) return;

        // Mapping intelligent basé sur le contenu de la question
        this.mapQuestionToSearchable(question, value, searchable);
      });
    });

    return searchable;
  }

  /**
   * Mappe une question vers les searchableOptions
   */
  private static mapQuestionToSearchable(
    question: OptionField,
    value: any,
    searchable: SearchableOptions
  ): void {
    const content = question.content.toLowerCase();

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