"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Edit, Trash2, Save } from "lucide-react";
import { DynamicOptionsForm } from "./DynamicOptionsForm";
import { ServiceType } from "@prisma/client";

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

  // Déterminer les types de prestataires à afficher selon le type de service
  const getRelevantProviders = () => {
    if (!storefrontData?.serviceType) return [];
    
    const serviceType = storefrontData.serviceType as ServiceType;
    const providerTypes = SERVICE_TO_PROVIDER_MAPPING[serviceType] || [];
    
    return providerTypes.map(providerType => 
      PROVIDER_TYPES.find(p => p.value === providerType)
    ).filter(Boolean);
  };

  const relevantProviders = getRelevantProviders();

  // Charger les options pour les prestataires pertinents
  useEffect(() => {
    const loadRelevantProviderOptions = async () => {
      const newProviderOptions: Record<string, ProviderOptions> = {};
      const newLoading: Record<string, boolean> = {};

      for (const provider of relevantProviders) {
        if (!provider) continue;
        
        // Éviter de recharger si déjà chargé
        if (providerOptions[provider.value]) {
          newProviderOptions[provider.value] = providerOptions[provider.value];
          continue;
        }
        
        console.log(`[OptionsTab] Chargement des options pour ${provider.value} depuis ${provider.optionsFile}.json`);
        newLoading[provider.value] = true;
        try {
          const options = await import(`@/partners-options/${provider.optionsFile}.json`);
          console.log(`[OptionsTab] Options chargées pour ${provider.value}:`, options.default);
          newProviderOptions[provider.value] = options.default;
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
  }, [storefrontData?.serviceType]); // Dépendance uniquement sur le type de service

  const handleSaveOptions = (providerType: string, data: any) => {
    const updatedData = {
      ...storefrontData,
      options: {
        ...storefrontData?.options,
        [providerType]: data
      }
    };
    onUpdate(updatedData);
  };

  const handleFormDataChange = (providerType: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [providerType]: data
    }));
  };

  // Si aucun type de service n'est défini, afficher un message
  if (!storefrontData?.serviceType) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Options des prestataires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Veuillez d'abord sélectionner un type de service dans l'onglet Général pour voir les options disponibles.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="space-y-8">
            {relevantProviders.map((provider) => {
              if (!provider) return null;
              
              const options = providerOptions[provider.value];
              const isLoading = loading[provider.value];
              const currentFormData = formData[provider.value] || {};
              const savedOptions = storefrontData?.options?.[provider.value];

              if (isLoading) {
                return (
                  <Card key={provider.value} className="p-6">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Chargement des options pour {provider.label}...</span>
                    </div>
                  </Card>
                );
              }

              if (!options) {
                return (
                  <Card key={provider.value} className="p-6">
                    <div className="text-center text-muted-foreground">
                      Aucune option disponible pour {provider.label}
                    </div>
                  </Card>
                );
              }

              return (
                <Card key={provider.value} className="p-6">
                  <CardHeader>
                    <CardTitle>{provider.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DynamicOptionsForm
                      providerType={provider.value}
                      initialData={savedOptions || {}}
                      onSave={(data) => handleFormDataChange(provider.value, data)}
                      onCancel={() => {}}
                    />
                    <div className="flex justify-end mt-6 pt-6 border-t">
                      <Button
                        onClick={() => handleSaveOptions(provider.value, currentFormData)}
                        disabled={Object.keys(currentFormData).length === 0}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Sauvegarder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {relevantProviders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune option disponible pour le type de service "{storefrontData.serviceType}".
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 