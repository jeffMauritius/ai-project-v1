import { z } from 'zod'

// Schéma de validation pour la connexion
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  remember: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Schéma de validation pour le mot de passe oublié
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('Format d\'email invalide'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// Schéma de validation pour l'inscription (couple)
export const registerCoupleSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom complet est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  passwordConfirmation: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
  terms: z
    .boolean()
    .refine((val) => val === true, 'Vous devez accepter les conditions d\'utilisation'),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['passwordConfirmation'],
})

// Schéma de validation pour l'inscription (partenaire)
export const registerPartnerSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom complet est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z
    .string()
    .min(1, 'L\'adresse email est requise')
    .email('Format d\'email invalide'),
  partnerType: z
    .string()
    .min(1, 'Le type de prestation est requis'),
  siret: z
    .string()
    .min(1, 'Le numéro SIRET est requis')
    .regex(/^[0-9]{14}$/, 'Le numéro SIRET doit contenir exactement 14 chiffres'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  passwordConfirmation: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
  terms: z
    .boolean()
    .refine((val) => val === true, 'Vous devez accepter les conditions d\'utilisation'),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['passwordConfirmation'],
})

export type RegisterCoupleFormData = z.infer<typeof registerCoupleSchema>
export type RegisterPartnerFormData = z.infer<typeof registerPartnerSchema>

// Schéma de validation pour la création d'une table
export const tableSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom de la table est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  seats: z
    .number()
    .min(1, 'Le nombre de places doit être au moins 1')
    .max(20, 'Le nombre de places ne peut pas dépasser 20'),
})

export type TableFormData = z.infer<typeof tableSchema> 