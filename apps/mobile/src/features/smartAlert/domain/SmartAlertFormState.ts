export interface SmartAlertFormState {
  name: string;
  keywords: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  radiusKm: number;
  frequency: 'instant' | 'daily';
}

export const INITIAL_SMART_ALERT_FORM_STATE: SmartAlertFormState = {
  name: '',
  keywords: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  location: '',
  radiusKm: 25,
  frequency: 'instant',
};
