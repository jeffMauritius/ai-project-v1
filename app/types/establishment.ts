export type Establishment = {
  id: string;
  name: string;
  location: string;
  rating: number;
  numberOfReviews: number;
  description: string;
  priceRange: string;
  capacity: string;
  images: string[]; // Tableau d'URLs Vercel Blob Storage
  imageUrl?: string; // Champ optionnel pour compatibilité
};