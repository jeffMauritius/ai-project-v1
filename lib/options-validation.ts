import { z } from "zod";
import { OptionField, OptionSection, ProviderOptions } from "./options-service";

// Schéma de base pour un champ d'option
const createFieldSchema = (field: OptionField) => {
  switch (field.component_type) {
    case "input":
      if (field.field_type === "number") {
        // Pour les champs numériques, on accepte les chaînes et on les convertit
        return z.string()
          .min(1, "Ce champ est requis")
          .transform((val) => {
            const num = parseFloat(val);
            if (isNaN(num)) {
              throw new Error("Veuillez entrer un nombre valide");
            }
            return num;
          })
          .pipe(z.number().min(0, "Le nombre doit être positif"));
      } else {
        return z.string().min(1, "Ce champ est requis");
      }

    case "textarea":
      return z.string().optional();

    case "checkbox":
      if (field.required) {
        return z.array(z.string()).min(1, "Sélectionnez au moins une option");
      } else {
        return z.array(z.string()).optional().default([]);
      }

    case "radio":
      if (field.required) {
        return z.string().min(1, "Sélectionnez une option");
      } else {
        return z.string().optional();
      }

    case "select":
      if (field.required) {
        return z.string().min(1, "Sélectionnez une option");
      } else {
        return z.string().optional();
      }

    case "boolean":
      return z.boolean().optional().default(false);

    case "range":
      return z.object({
        min: z.string()
          .transform((val) => {
            const num = parseFloat(val);
            if (isNaN(num)) {
              throw new Error("Veuillez entrer un nombre valide");
            }
            return num;
          })
          .pipe(z.number().min(0, "La valeur minimum doit être positive")),
        max: z.string()
          .transform((val) => {
            const num = parseFloat(val);
            if (isNaN(num)) {
              throw new Error("Veuillez entrer un nombre valide");
            }
            return num;
          })
          .pipe(z.number().min(0, "La valeur maximum doit être positive"))
      }).refine(data => data.max >= data.min, {
        message: "La valeur maximum doit être supérieure ou égale à la valeur minimum"
      });

    default:
      return z.any();
  }
};

// Créer un schéma de validation pour un formulaire complet
export const createFormValidationSchema = (providerOptions: ProviderOptions) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  // Parcourir toutes les sections et questions
  Object.values(providerOptions).forEach((providerOption) => {
    providerOption.sections.forEach((section: OptionSection) => {
      section.questions.forEach((field: OptionField) => {
        const fieldKey = `question_${field.question_id}`;
        schemaFields[fieldKey] = createFieldSchema(field);
      });
    });
  });

  return z.object(schemaFields);
};

// Type pour les données validées
export type ValidatedFormData = z.infer<ReturnType<typeof createFormValidationSchema>>;

// Fonction de validation d'un formulaire
export const validateFormData = (
  formData: any,
  providerOptions: ProviderOptions
): { success: true; data: ValidatedFormData } | { success: false; errors: Record<string, string[]> } => {
  try {
    const schema = createFormValidationSchema(providerOptions);
    const validatedData = schema.parse(formData);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const fieldName = err.path.join(".");
        if (!errors[fieldName]) {
          errors[fieldName] = [];
        }
        errors[fieldName].push(err.message);
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: ["Erreur de validation inconnue"] } };
  }
};

// Fonction pour obtenir les messages d'erreur pour un champ spécifique
export const getFieldErrors = (
  fieldName: string,
  validationErrors: Record<string, string[]>
): string[] => {
  return validationErrors[fieldName] || [];
};

// Schéma de validation pour les données envoyées à l'API
export const optionsRequestSchema = z.object({
  providerType: z.string().min(1, "Type de prestataire requis"),
  formData: z.record(z.any()).optional()
});

export type OptionsRequestData = z.infer<typeof optionsRequestSchema>; 