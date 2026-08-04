export interface SmartAlertCriteria {
  keywords?: string;
  category?: string;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}

export interface SmartAlert {
  id: string;
  name: string;
  criteria?: SmartAlertCriteria;
  frequency: 'instant' | 'daily';
  radiusKm?: number;
  notificationChannels?: string[];
  createdAt?: string;
}
