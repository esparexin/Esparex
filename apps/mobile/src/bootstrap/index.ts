import { bootstrapServices } from './services';

// Centralized Composition Root
// Services are instantiated once when the application loads.
export const services = bootstrapServices();
