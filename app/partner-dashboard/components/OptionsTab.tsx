"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { DynamicOptionsForm } from "./DynamicOptionsForm";
import { ReceptionOptions } from "./ReceptionOptions";
import { ServiceType } from "@prisma/client";
import { OptionsService } from "@/lib/options-service";
import { validateFormData } from "@/lib/options-validation";

interface OptionsTabProps {
  storefrontData?: any;
  onUpdate: (data: any) => void;
}

// Mapping des types de service vers les types de prestataires
const SERVICE_TO_PROVIDER_MAPPING: Record<ServiceType, string[]> = {
  LIEU: ["reception-venue"],
  TRAITEUR: ["caterer"],
  FAIRE_PART: ["invitation"],
  CADEAUX_INVITES: ["guest-gifts"],
  PHOTOGRAPHE: ["photographer"],
  MUSIQUE: ["music-dj"],
  VOITURE: ["vehicle"],
  BUS: ["vehicle"], // Utilise les mêmes options que voiture
  DECORATION: ["decoration"],
  CHAPITEAU: ["tent"],
  ANIMATION: ["animation"],
  FLORISTE: ["florist"],
  LISTE: ["wedding-registry"],
  ORGANISATION: ["wedding-planner"],
  VIDEO: ["video"],
  LUNE_DE_MIEL: ["honeymoon-travel"],
  WEDDING_CAKE: ["wedding-cake"],
  OFFICIANT: ["officiant"],
  FOOD_TRUCK: ["food-truck"],
  VIN: ["wine"]
};

const PROVIDER_TYPES = [
  { value: "reception-venue", label: "Lieu de réception", optionsFile: "reception-venue-options" },
  { value: "caterer", label: "Traiteur", optionsFile: "caterer-options" },
  { value: "invitation", label: "Faire-part", optionsFile: "invitation-options" },
  { value: "guest-gifts", label: "Cadeaux d'invités", optionsFile: "guest-gifts-options" },
  { value: "photographer", label: "Photographe", optionsFile: "photographer-options" },
  { value: "music-dj", label: "Musique/DJ", optionsFile: "music-dj-options" },
  { value: "vehicle", label: "Voiture", optionsFile: "vehicle-options" },
  { value: "decoration", label: "Décoration", optionsFile: "decoration-options" },
  { value: "tent", label: "Chapiteau", optionsFile: "tent-options" },
  { value: "animation", label: "Animation", optionsFile: "animation-options" },
  { value: "florist", label: "Fleurs", optionsFile: "florist-options" },
  { value: "wedding-registry", label: "Liste de mariage", optionsFile: "wedding-registry-options" },
  { value: "wedding-planner", label: "Organisation", optionsFile: "wedding-planner-options" },
  { value: "video", label: "Vidéo", optionsFile: "video-options" },
  { value: "honeymoon-travel", label: "Voyage de noces", optionsFile: "honeymoon-travel-options" },
  { value: "wedding-cake", label: "Gâteau de mariage", optionsFile: "wedding-cake-options" },
  { value: "officiant", label: "Officiant", optionsFile: "officiant-options" },
  { value: "food-truck", label: "Food truck", optionsFile: "food-truck-options" },
  { value: "wine", label: "Vin", optionsFile: "wine-options" },
  { value: "wedding-dress", label: "Robe de mariée", optionsFile: "wedding-dress-options" },
  { value: "jewelry", label: "Bijoux", optionsFile: "jewelry-options" },
  { value: "beauty-hair", label: "Esthétique/Coiffure", optionsFile: "beauty-hair-options" },
  { value: "groom-suit", label: "Costume de marié", optionsFile: "groom-suit-options" }
];

interface ProviderOptions {
  [key: string]: {
    sections: any[];
  };
}

export function OptionsTab({ storefrontData, onUpdate }: OptionsTabProps) {
  const [providerOptions, setProviderOptions] = useState<Record<string, ProviderOptions>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string[]>>>({});

  // Déterminer les types de prestataires à afficher selon le type de service
  const relevantProviders = useMemo(() => {
    if (!storefrontData?.serviceType) return [];
    
    const serviceType = storefrontData.serviceType as ServiceType;
    const providerTypes = SERVICE_TO_PROVIDER_MAPPING[serviceType] || [];
    
    return providerTypes.map(providerType => 
      PROVIDER_TYPES.find(p => p.value === providerType)
    ).filter(Boolean);
  }, [storefrontData?.serviceType]);

  // Charger les options pour les prestataires pertinents
  useEffect(() => {
    const loadRelevantProviderOptions = async () => {
      if (!storefrontData?.serviceType) return;
      
      const newProviderOptions: Record<string, ProviderOptions> = {};
      const newLoading: Record<string, boolean> = {};

      for (const provider of relevantProviders) {
        if (!provider) continue;
        
        newLoading[provider.value] = true;
        try {

          const options = await OptionsService.loadProviderOptionsByType(provider.value);

          if (options) {
            newProviderOptions[provider.value] = options;
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des options pour ${provider.value}:`, error);
        } finally {
          newLoading[provider.value] = false;
        }
      }

      setProviderOptions(newProviderOptions);
      setLoading(newLoading);
    };

    if (relevantProviders.length > 0) {
      loadRelevantProviderOptions();
    }
  }, [relevantProviders, storefrontData?.serviceType]); // Dépendre de relevantProviders et serviceType

  const handleSaveOptions = async (providerType: string, data: any) => {
    if (!storefrontData?.id) {
      console.error('[OptionsTab] Pas d\'ID de storefront disponible:', storefrontData)
      return;
    }

    setSaving(prev => ({ ...prev, [providerType]: true }));

    try {

      const response = await fetch(`/api/partner-storefront/${storefrontData.id}/options`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerType,
          options: data,
          searchableOptions: data // Pour l'instant, on utilise les mêmes données
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      // Mettre à jour les données du storefront avec les nouvelles options
      onUpdate({
        ...storefrontData,
        options: result.partner?.options || {},
        searchableOptions: result.partner?.searchableOptions || {}
      });

    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des options pour ${providerType}:`, error);
      // Ici vous pourriez afficher une notification d'erreur à l'utilisateur
    } finally {
      setSaving(prev => ({ ...prev, [providerType]: false }));
    }
  };

  const handleFormDataChange = (providerType: string, data: any) => {
    setFormData(prev => ({ ...prev, [providerType]: data }));
  };

  // Vérifier si un formulaire est valide
  const isFormValid = (providerType: string) => {
    return true; // Pour l'instant, on considère toujours valide
  };

  // Vérifier si un formulaire a des données
  const hasFormData = (providerType: string) => {
    const data = formData[providerType];
    // Vérifier si on a des données dans formData OU des données sauvegardées
    const savedData = storefrontData?.options?.[providerType];

    // Vérifier si les données ont au moins une valeur non vide
    const hasDataValues = data && Object.values(data).some((val: any) =>
      val !== undefined && val !== null && val !== "" &&
      (Array.isArray(val) ? val.length > 0 : true)
    );
    const hasSavedDataValues = savedData && Object.values(savedData).some((val: any) =>
      val !== undefined && val !== null && val !== "" &&
      (Array.isArray(val) ? val.length > 0 : true)
    );

    return hasDataValues || hasSavedDataValues;
  };

  if (!storefrontData?.id) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Chargement des données du storefront...
      </div>
    );
  }

  if (!storefrontData?.serviceType) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucun type de service défini pour ce storefront.
      </div>
    );
  }

  if (relevantProviders.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucun prestataire disponible pour ce type de service.
      </div>
    );
  }

  // Pour les établissements (LIEU) avec un vrai Establishment, utiliser le composant ReceptionOptions
  // Sinon (Partner de type LIEU sans Establishment), utiliser DynamicOptionsForm
  if (storefrontData.serviceType === ServiceType.LIEU && storefrontData.establishmentId) {
    return (
      <ReceptionOptions
        storefrontId={storefrontData.id}
        initialData={{
          spaces: storefrontData.receptionSpaces || [],
          options: storefrontData.receptionOptions || {}
        }}
        onUpdate={(data) => {
          onUpdate({
            ...storefrontData,
            receptionSpaces: data.receptionSpaces,
            receptionOptions: data.receptionOptions
          })
        }}
      />
    );
  }

  // Pour les Partners de type LIEU sans establishmentId, on continue avec DynamicOptionsForm ci-dessous

  return (
    <div className="space-y-6">
      {relevantProviders.map((provider) => {
        if (!provider) return null;

        // Debug: afficher le storefrontData complet

        // Les données sauvegardées sont dans le format { providerType: { question_1: value, question_2: value } }
        // On récupère les options spécifiques au type de prestataire
        const savedOptions = storefrontData?.options?.[provider.value] || {};

        // Debug: afficher les options pour ce prestataire

        const isLoading = loading[provider.value];
        const isSaving = saving[provider.value];
        const isValid = isFormValid(provider.value);
        const hasData = hasFormData(provider.value);

        return (
          <Card key={provider.value}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {provider.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <>
                  <DynamicOptionsForm
                    providerType={provider.value}
                    initialData={savedOptions}
                    onSave={(data) => handleFormDataChange(provider.value, data)}
                    onCancel={() => {}}
                    serviceType={storefrontData.serviceType}
                  />

                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => handleSaveOptions(provider.value, formData[provider.value] || {})}
                      disabled={isSaving || !isValid}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 