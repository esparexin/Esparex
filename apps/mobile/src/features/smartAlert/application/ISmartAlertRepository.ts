import { SmartAlert } from '../domain/SmartAlert';
import { SmartAlertFormState } from '../domain/SmartAlertFormState';

export interface ISmartAlertRepository {
  getSmartAlerts(): Promise<SmartAlert[]>;
  createSmartAlert(state: SmartAlertFormState): Promise<SmartAlert>;
  updateSmartAlert(id: string, state: Partial<SmartAlertFormState>): Promise<SmartAlert>;
  deleteSmartAlert(id: string): Promise<void>;
}
