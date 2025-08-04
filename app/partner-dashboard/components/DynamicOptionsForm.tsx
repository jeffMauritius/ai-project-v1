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
import { OptionsService, SERVICE_TYPE_TO_JSON_KEY } from "@/lib/options-service";
import { ServiceType } from "@prisma/client";
import { validateFormData, getFieldErrors } from "@/lib/options-validation";

interface DynamicOptionsFormProps {
  providerType: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  serviceType?: ServiceType;
}

export function DynamicOptionsForm({ 
  providerType, 
  initialData = {}, 
  onSave, 
  onCancel,
  serviceType
}: DynamicOptionsFormProps) {
  const [formData, setFormData] = useState<any>(initialData);
  const [providerOptions, setProviderOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Synchroniser les données quand initialData change
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    // Charger les options du prestataire depuis le service
    const loadProviderOptions = async () => {
      if (!serviceType) {
        console.error('ServiceType non défini');
        setLoading(false);
        return;
      }

      try {
        console.log(`[DynamicOptionsForm] Chargement des options pour ${providerType} avec serviceType ${serviceType}`);
        const options = await OptionsService.loadProviderOptions(serviceType);
        console.log(`[DynamicOptionsForm] Options chargées:`, options);
        setProviderOptions(options);
        setLoading(false);
      } catch (error) {
        console.error(`Erreur lors du chargement des options pour ${providerType}:`, error);
        setLoading(false);
      }
    };

    loadProviderOptions();
  }, [providerType, serviceType]);

  const handleInputChange = (fieldId: string, value: any) => {
    const fieldKey = getFieldKey(fieldId);
    const newFormData = {
      ...formData,
      [fieldKey]: value
    };
    setFormData(newFormData);
    onSave(newFormData); // Toujours sauvegarder, même si invalide
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const fieldKey = getFieldKey(fieldId);
    const currentValues = formData[fieldKey] || [];
    let newValues;
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter((val: string) => val !== option);
    }
    const newFormData = {
      ...formData,
      [fieldKey]: newValues
    };
    setFormData(newFormData);
    onSave(newFormData); // Toujours sauvegarder, même si invalide
  };

  const handleRadioChange = (fieldId: string, value: string) => {
    const fieldKey = getFieldKey(fieldId);
    const newFormData = {
      ...formData,
      [fieldKey]: value
    };
    setFormData(newFormData);
    onSave(newFormData); // Toujours sauvegarder, même si invalide
  };

  const handleSelectChange = (fieldId: string, value: string) => {
    const fieldKey = getFieldKey(fieldId);
    const newFormData = {
      ...formData,
      [fieldKey]: value
    };
    setFormData(newFormData);
    onSave(newFormData); // Toujours sauvegarder, même si invalide
  };

  const handleSwitchChange = (fieldId: string, checked: boolean) => {
    const fieldKey = getFieldKey(fieldId);
    const newFormData = {
      ...formData,
      [fieldKey]: checked
    };
    setFormData(newFormData);
    onSave(newFormData); // Toujours sauvegarder, même si invalide
  };

  // Mapping des IDs descriptifs vers les clés numériques pour la compatibilité
  const getFieldKey = (fieldId: string) => {
    // Si les données existent avec l'ancien format numérique, on les utilise
    // Sinon, on utilise le nouveau format descriptif
    const numericKey = Object.keys(initialData).find(key => 
      key.startsWith('question_') && initialData[key] !== undefined
    );
    
    if (numericKey) {
      // On utilise un mapping basé sur l'index du champ dans la section
      const allFields = relevantOptions?.sections?.flatMap((section: any) => section.fields) || [];
      const fieldIndex = allFields.findIndex((f: any) => f.id === fieldId);
      return fieldIndex >= 0 ? `question_${fieldIndex + 1}` : `question_${fieldId}`;
    }
    
    return `question_${fieldId}`;
  };

  const renderField = (field: any) => {
    const fieldKey = getFieldKey(field.id);
    const fieldErrors = getFieldErrors(fieldKey, validationErrors);
    const hasError = fieldErrors.length > 0;

    const renderInput = () => {
      if (field.component_type === "input") {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              type={field.field_type === "number" ? "number" : "text"}
              value={formData[fieldKey] || ""}
              onChange={(e) => handleInputChange(field.id, field.field_type === "number" ? Number(e.target.value) : e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && (
              <p className="text-sm text-red-500">{fieldErrors[0]}</p>
            )}
          </div>
        );
      }

      if (field.component_type === "textarea") {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldKey}
              value={formData[fieldKey] || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && (
              <p className="text-sm text-red-500">{fieldErrors[0]}</p>
            )}
          </div>
        );
      }

      if (field.component_type === "checkbox") {
        return (
          <div className="space-y-2">
            <Label>
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field.options?.map((option, index) => (
                <div key={`${field.question_id}-${option}-${index}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldKey}_${option}`}
                    checked={(formData[fieldKey] || []).includes(option)}
                    onCheckedChange={(checked) => handleCheckboxChange(field.id, option, !!checked)}
                  />
                  <Label htmlFor={`${fieldKey}_${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {hasError && (
              <p className="text-sm text-red-500">{fieldErrors[0]}</p>
            )}
          </div>
        );
      }

      if (field.component_type === "radio") {
        return (
          <div className="space-y-2">
            <Label>
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={formData[fieldKey] || ""}
              onValueChange={(value) => handleRadioChange(field.id, value)}
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
            {hasError && (
              <p className="text-sm text-red-500">{fieldErrors[0]}</p>
            )}
          </div>
        );
      }

      if (field.component_type === "select") {
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formData[fieldKey] || ""}
              onValueChange={(value) => handleSelectChange(field.id, value)}
            >
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
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
            {hasError && (
              <p className="text-sm text-red-500">{fieldErrors[0]}</p>
            )}
          </div>
        );
      }

      if (field.component_type === "boolean") {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {field.question}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Switch
                checked={formData[fieldKey] || false}
                onCheckedChange={(checked) => handleSwitchChange(field.id, checked)}
              />
            </div>
            {hasError && (
              <p className="text-sm text-red-500">{fieldErrors[0]}</p>
            )}
          </div>
        );
      }

      if (field.component_type === "range") {
        return (
          <div className="space-y-2">
            <Label>
              {field.question}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${fieldKey}_min`} className="text-sm">
                  {field.min_field?.question}
                </Label>
                <Input
                  id={`${fieldKey}_min`}
                  type="number"
                  value={formData[fieldKey]?.min || ""}
                  onChange={(e) => {
                    const newRange = {
                      ...formData[fieldKey],
                      min: e.target.value // Garder comme string
                    };
                    handleInputChange(field.question_id, newRange);
                  }}
                  placeholder="Minimum"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${fieldKey}_max`} className="text-sm">
                  {field.max_field?.question}
                </Label>
                <Input
                  id={`${fieldKey}_max`}
                  type="number"
                  value={formData[fieldKey]?.max || ""}
                  onChange={(e) => {
                    const newRange = {
                      ...formData[fieldKey],
                      max: e.target.value // Garder comme string
                    };
                    handleInputChange(field.question_id, newRange);
                  }}
                  placeholder="Maximum"
                />
              </div>
            </div>
            {hasError && (
              <p className="text-sm text-red-500">{fieldErrors[0]}</p>
            )}
          </div>
        );
      }

      return null;
    };

    return (
      <div key={field.question_id} className="space-y-2">
        {renderInput()}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!providerOptions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-500">
            <Info className="h-4 w-4" />
            <span>Aucune option trouvée pour ce type de prestataire.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const providerTypeToJsonKey = SERVICE_TYPE_TO_JSON_KEY[serviceType as keyof typeof SERVICE_TYPE_TO_JSON_KEY];
  const relevantOptions = providerOptions[providerTypeToJsonKey];

  if (!relevantOptions) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-500">
            <Info className="h-4 w-4" />
            <span>Aucune option trouvée pour ce type de prestataire.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {relevantOptions.sections.map((section: any, index: number) => (
            <div key={index} className="space-y-4">
              <h3 className="text-lg font-semibold">{section.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map((field: any) => renderField(field))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 