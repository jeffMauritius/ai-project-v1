# Système de Formulaires Dynamiques d'Options pour Prestataires

## Vue d'ensemble

Ce système permet de générer dynamiquement des formulaires d'options pour chaque type de prestataire de mariage, en utilisant les fichiers JSON de configuration et les composants shadcn/ui.

## Structure des fichiers

### 1. Fichiers JSON de configuration (`partners-options/`)
Chaque prestataire a son fichier JSON avec la structure suivante :

```json
{
  "lieu_reception": {
    "sections": [
      {
        "section_id": 1,
        "title": "Vos espaces de réceptions",
        "questions": [
          {
            "question_id": 1,
            "content": "Nom",
            "component_type": "input",
            "field_type": "text",
            "required": true
          }
        ]
      }
    ]
  }
}
```

### 2. Composants React

#### `DynamicOptionsForm.tsx`
- Génère dynamiquement les formulaires basés sur les JSON
- Supporte tous les types de composants shadcn/ui
- Gère les champs conditionnels
- Organise les sections en onglets

#### `OptionsTab.tsx`
- Interface pour sélectionner le type de prestataire
- Affiche les options déjà configurées
- Permet l'édition et suppression des options

## Types de composants supportés

### Input
```json
{
  "component_type": "input",
  "field_type": "text|number|email",
  "unit": "€",
  "placeholder": "Exemple..."
}
```

### Textarea
```json
{
  "component_type": "textarea",
  "field_type": "text"
}
```

### Checkbox (sélection multiple)
```json
{
  "component_type": "checkbox",
  "options": ["Option 1", "Option 2"]
}
```

### Radio (choix unique)
```json
{
  "component_type": "radio",
  "options": ["Oui", "Non"]
}
```

### Select
```json
{
  "component_type": "select",
  "options": ["Option 1", "Option 2"]
}
```

### Boolean (Switch)
```json
{
  "component_type": "boolean"
}
```

### Range (min/max)
```json
{
  "component_type": "range",
  "min_field": { "content": "Minimum" },
  "max_field": { "content": "Maximum" }
}
```

## Champs conditionnels

```json
{
  "component_type": "radio",
  "options": ["Oui", "Non"],
  "conditional_field": {
    "show_when": "Oui",
    "field": {
      "content": "Précisez",
      "component_type": "input",
      "field_type": "text"
    }
  }
}
```

## Utilisation

### 1. Dans la page storefront
```tsx
import { OptionsTab } from "../components/OptionsTab";

<TabsContent value="options" className="space-y-6">
  <OptionsTab 
    storefrontData={storefrontFormData} 
    onUpdate={handleStorefrontUpdate} 
  />
</TabsContent>
```

### 2. Ajouter un nouveau type de prestataire

1. Créer le fichier JSON dans `partners-options/`
2. Ajouter l'entrée dans `PROVIDER_TYPES` dans `OptionsTab.tsx`
3. Le formulaire sera automatiquement généré

## Fonctionnalités

### ✅ Implémentées
- Génération dynamique de formulaires
- Support de tous les types de composants shadcn/ui
- Champs conditionnels
- Organisation en onglets
- Validation des champs requis
- Interface d'édition et suppression
- Sauvegarde des données

### 🔄 À implémenter
- Validation côté serveur
- Persistance en base de données
- Export/import des configurations
- Prévisualisation des formulaires
- Templates prédéfinis

## Exemple d'utilisation complète

```tsx
// 1. Sélectionner un type de prestataire
// 2. Cliquer sur "Ajouter des options"
// 3. Remplir le formulaire généré automatiquement
// 4. Sauvegarder les options
// 5. Les options apparaissent dans la liste
// 6. Possibilité d'éditer ou supprimer
```

## Avantages

1. **Maintenabilité** : Ajout de nouveaux prestataires sans modification de code
2. **Cohérence** : Interface uniforme pour tous les prestataires
3. **Flexibilité** : Support de tous les types de champs
4. **Extensibilité** : Facile d'ajouter de nouveaux types de composants
5. **UX** : Interface intuitive avec onglets et validation

## Structure des données sauvegardées

```json
{
  "options": {
    "lieu_reception": {
      "1": "Nom de l'espace",
      "2": "Description...",
      "3": 150,
      "4": ["Piste de danse", "Accès PMR"]
    }
  }
}
```

Cette structure permet une sauvegarde efficace et une récupération facile des données pour l'affichage et l'édition. 