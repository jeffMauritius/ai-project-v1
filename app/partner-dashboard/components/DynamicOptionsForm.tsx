"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Info } from "lucide-react";

interface OptionField {
  question_id: number;
  content: string;
  component_type: "input" | "textarea" | "checkbox" | "radio" | "select" | "boolean" | "range";
  field_type?: "text" | "number" | "email";
  options?: string[];
  unit?: string;
  required?: boolean;
  placeholder?: string;
  conditional_field?: {
    show_when: string;
    field: OptionField;
  };
  min_field?: {
    content: string;
    component_type: string;
    field_type: string;
    required: boolean;
  };
  max_field?: {
    content: string;
    component_type: string;
    field_type: string;
    required: boolean;
  };
}

interface Section {
  section_id: number;
  title: string;
  questions: OptionField[];
}

interface ProviderOptions {
  [key: string]: {
    sections: Section[];
  };
}

interface DynamicOptionsFormProps {
  providerType: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function DynamicOptionsForm({ 
  providerType, 
  initialData = {}, 
  onSave, 
  onCancel 
}: DynamicOptionsFormProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const [providerOptions, setProviderOptions] = useState<ProviderOptions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les options du prestataire depuis le fichier JSON
    const loadProviderOptions = async () => {
      try {
        console.log(`[DynamicOptionsForm] Chargement des options pour ${providerType}`);
        const options = await import(`@/partners-options/${providerType}-options.json`);
        console.log(`[DynamicOptionsForm] Options chargées:`, options.default);
        setProviderOptions(options.default);
        setLoading(false);
      } catch (error) {
        console.error(`Erreur lors du chargement des options pour ${providerType}:`, error);
        setLoading(false);
      }
    };

    loadProviderOptions();
  }, [providerType]);

  const handleInputChange = (questionId: number, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId: number, option: string, checked: boolean) => {
    setFormData((prev: any) => {
      const currentValues = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentValues.filter((item: string) => item !== option)
        };
      }
    });
  };

  const renderField = (field: OptionField) => {
    const value = formData[field.question_id];

    switch (field.component_type) {
      case "input":
        return (
          <div key={field.question_id} className="space-y-2">
            <Label htmlFor={`field-${field.question_id}`}>
              {field.content}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={`field-${field.question_id}`}
                type={field.field_type || "text"}
                value={value || ""}
                onChange={(e) => handleInputChange(field.question_id, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
              {field.unit && (
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  {field.unit}
                </span>
              )}
            </div>
          </div>
        );

      case "textarea":
        return (
          <div key={field.question_id} className="space-y-2">
            <Label htmlFor={`field-${field.question_id}`}>
              {field.content}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={`field-${field.question_id}`}
              value={value || ""}
              onChange={(e) => handleInputChange(field.question_id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={field.question_id} className="space-y-3">
            <Label>
              {field.content}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field.options?.map((option, index) => (
                <div key={`${field.question_id}-${option}-${index}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.question_id}-${option}`}
                    checked={value?.includes(option) || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(field.question_id, option, checked as boolean)
                    }
                  />
                  <Label htmlFor={`${field.question_id}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "radio":
        return (
          <div key={field.question_id} className="space-y-3">
            <Label>
              {field.content}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={value || ""}
              onValueChange={(val) => handleInputChange(field.question_id, val)}
              required={field.required}
            >
              {field.options?.map((option, index) => (
                <div key={`${field.question_id}-${option}-${index}`} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.question_id}-${option}`} />
                  <Label htmlFor={`${field.question_id}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {field.conditional_field && value === field.conditional_field.show_when && (
              <div className="ml-6 mt-3 p-3 border-l-2 border-primary">
                {renderField(field.conditional_field.field)}
              </div>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.question_id} className="space-y-2">
            <Label htmlFor={`field-${field.question_id}`}>
              {field.content}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(val) => handleInputChange(field.question_id, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={`${field.question_id}-${option}-${index}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "boolean":
        return (
          <div key={field.question_id} className="flex items-center justify-between">
            <Label htmlFor={`field-${field.question_id}`} className="text-sm">
              {field.content}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Switch
              id={`field-${field.question_id}`}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(field.question_id, checked)}
            />
          </div>
        );

      case "range":
        return (
          <div key={field.question_id} className="space-y-3">
            <Label>
              {field.content}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`field-${field.question_id}-min`}>
                  {field.min_field?.content}
                </Label>
                <Input
                  id={`field-${field.question_id}-min`}
                  type="number"
                  value={value?.min || ""}
                  onChange={(e) => handleInputChange(field.question_id, {
                    ...value,
                    min: e.target.value
                  })}
                  required={field.min_field?.required}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`field-${field.question_id}-max`}>
                  {field.max_field?.content}
                </Label>
                <Input
                  id={`field-${field.question_id}-max`}
                  type="number"
                  value={value?.max || ""}
                  onChange={(e) => handleInputChange(field.question_id, {
                    ...value,
                    max: e.target.value
                  })}
                  required={field.max_field?.required}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Chargement des options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!providerOptions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 p-4 border rounded-lg">
            <Info className="h-4 w-4" />
            <span>Aucune option trouvée pour ce type de prestataire.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mapping des providerType vers les clés dans le JSON
  const providerTypeToJsonKey: Record<string, string> = {
    "reception-venue": "lieu_reception",
    "caterer": "traiteur",
    "invitation": "faire_part",
    "guest-gifts": "cadeaux_invites",
    "photographer": "photographe",
    "music-dj": "musique_dj",
    "vehicle": "voiture",
    "decoration": "decoration",
    "tent": "chapiteau",
    "animation": "animation",
    "florist": "fleurs",
    "wedding-registry": "liste_cadeau_mariage",
    "wedding-planner": "organisation",
    "video": "video",
    "honeymoon-travel": "voyage",
    "wedding-cake": "wedding_cake",
    "officiant": "officiants",
    "food-truck": "food_truck",
    "wine": "vin",
    "wedding-dress": "robe_de_mariee",
    "jewelry": "bijoux",
    "beauty-hair": "esthetique_coiffure",
    "groom-suit": "costume_marie"
  };

  const jsonKey = providerTypeToJsonKey[providerType] || providerType;
  const providerData = providerOptions[jsonKey];

  return (
    <div className="space-y-6">
      {providerData.sections.map((section) => (
        <div key={section.section_id}>
          <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.questions.map(renderField)}
          </div>
          <div className="border-t my-6"></div>
        </div>
      ))}
    </div>
  );
} 