'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, Users, MapPin, Mail, Phone, User, MessageSquare, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/useToast';

interface QuoteRequestFormProps {
  storefrontId: string;
  storefrontName: string;
  storefrontEmail?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Schéma de validation Zod
const quoteRequestSchema = z.object({
  eventDate: z.string().min(1, "La date de l'événement est requise"),
  guestCount: z.string().min(1, "Le nombre d'invités est requis"),
  eventType: z.string().min(1, "Le type d'événement est requis"),
  venueLocation: z.string().min(1, "Le lieu de l'événement est requis"),
  budget: z.string().min(1, "Le budget estimé est requis"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof quoteRequestSchema>;

export function QuoteRequestForm({
  storefrontId,
  storefrontName,
  storefrontEmail,
  isOpen,
  onClose,
}: QuoteRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    eventDate: '',
    guestCount: '',
    eventType: '',
    venueLocation: '',
    budget: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    try {
      quoteRequestSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quote-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          storefrontId,
          storefrontName,
          storefrontEmail,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Demande envoyée !",
          description: `${storefrontName} vous contactera dans les plus brefs délais.`,
        });
        // Reset form after successful submission
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            eventDate: '',
            guestCount: '',
            eventType: '',
            venueLocation: '',
            budget: '',
            message: '',
          });
          setErrors({});
          onClose();
        }, 3000);
      } else if (response.status === 401) {
        // Utilisateur non connecté
        toast({
          title: "Connexion requise",
          description: "Vous devez être connecté pour envoyer une demande de devis.",
          variant: "destructive",
        });
        // Rediriger vers la page de connexion
        window.location.href = '/auth/login';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-pink-600" />
            Demander un devis
          </DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire pour recevoir un devis personnalisé de {storefrontName}
          </DialogDescription>
        </DialogHeader>

        {/* Mention pour créer un compte */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Créez un compte gratuitement pour demander un devis
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Vous devez être connecté pour envoyer une demande de devis. C'est rapide et gratuit !
              </p>
            </div>
          </div>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Demande envoyée !</h3>
            <p className="text-gray-600">
              Votre demande de devis a été envoyée avec succès. {storefrontName} vous contactera dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-600" />
                Détails de l'événement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">Date de l'événement *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange('eventDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.eventDate ? 'border-red-500' : ''}
                  />
                  {errors.eventDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.eventDate}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="guestCount">Nombre d'invités *</Label>
                  <Select value={formData.guestCount} onValueChange={(value) => handleInputChange('guestCount', value)}>
                    <SelectTrigger className={errors.guestCount ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1-50 personnes</SelectItem>
                      <SelectItem value="51-100">51-100 personnes</SelectItem>
                      <SelectItem value="101-200">101-200 personnes</SelectItem>
                      <SelectItem value="201-500">201-500 personnes</SelectItem>
                      <SelectItem value="500+">Plus de 500 personnes</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.guestCount && (
                    <p className="text-sm text-red-500 mt-1">{errors.guestCount}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="eventType">Type d'événement *</Label>
                <Select value={formData.eventType} onValueChange={(value) => handleInputChange('eventType', value)}>
                  <SelectTrigger className={errors.eventType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Sélectionnez le type d'événement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mariage">Mariage</SelectItem>
                    <SelectItem value="bapteme">Baptême</SelectItem>
                    <SelectItem value="communion">Communion</SelectItem>
                    <SelectItem value="anniversaire">Anniversaire</SelectItem>
                    <SelectItem value="seminaire">Séminaire / Conférence</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {errors.eventType && (
                  <p className="text-sm text-red-500 mt-1">{errors.eventType}</p>
                )}
              </div>
            </div>

            {/* Location & Budget */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-pink-600" />
                Localisation et budget
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="venueLocation">Lieu de l'événement *</Label>
                  <Input
                    id="venueLocation"
                    value={formData.venueLocation}
                    onChange={(e) => handleInputChange('venueLocation', e.target.value)}
                    placeholder="Adresse ou nom du lieu"
                    className={errors.venueLocation ? 'border-red-500' : ''}
                  />
                  {errors.venueLocation && (
                    <p className="text-sm text-red-500 mt-1">{errors.venueLocation}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="budget">Budget estimé *</Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                    <SelectTrigger className={errors.budget ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<5000">Moins de 5 000€</SelectItem>
                      <SelectItem value="5000-10000">5 000€ - 10 000€</SelectItem>
                      <SelectItem value="10000-20000">10 000€ - 20 000€</SelectItem>
                      <SelectItem value="20000-50000">20 000€ - 50 000€</SelectItem>
                      <SelectItem value="50000+">Plus de 50 000€</SelectItem>
                      <SelectItem value="non-defini">Non défini</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.budget && (
                    <p className="text-sm text-red-500 mt-1">{errors.budget}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-pink-600" />
                Message
              </h3>
              <div>
                <Label htmlFor="message">Détails supplémentaires</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Décrivez vos besoins spécifiques, vos préférences, ou posez vos questions..."
                  rows={4}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 