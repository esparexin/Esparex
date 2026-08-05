import { SmartAlert } from '../domain/SmartAlert';
import { SmartAlertFormState } from '../domain/SmartAlertFormState';
import { ISmartAlertRepository } from './ISmartAlertRepository';

export class SmartAlertService {
  constructor(private readonly smartAlertRepository: ISmartAlertRepository) {}

  async getSmartAlerts(): Promise<SmartAlert[]> {
    return this.smartAlertRepository.getSmartAlerts();
  }

  async createSmartAlert(state: SmartAlertFormState): Promise<SmartAlert> {
    return this.smartAlertRepository.createSmartAlert(state);
  }

  async updateSmartAlert(id: string, state: Partial<SmartAlertFormState>): Promise<SmartAlert> {
    return this.smartAlertRepository.updateSmartAlert(id, state);
  }

  async deleteSmartAlert(id: string): Promise<void> {
    return this.smartAlertRepository.deleteSmartAlert(id);
  }
}
