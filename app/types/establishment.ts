export type Establishment = {
  id: string;
  name: string;
  location: string;
  rating: number;
  numberOfReviews: number;
  description: string;
  priceRange: string;
  capacity: string;
  imageUrl: string;
  images?: string[];
};