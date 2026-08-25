import { apiClient } from '../../../infrastructure/api/apiClient';
import { SmartAlert } from '../domain/SmartAlert';
import { SmartAlertFormState } from '../domain/SmartAlertFormState';
import { ISmartAlertRepository } from './ISmartAlertRepository';
import { CreateSmartAlertMapper } from './mappers/CreateSmartAlertMapper';

export class ApiSmartAlertRepository implements ISmartAlertRepository {
  async getSmartAlerts(): Promise<SmartAlert[]> {
    const response = await apiClient.get<{ data: SmartAlert[] }>('/smart-alerts');
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    return resData?.data || [];
  }

  async createSmartAlert(state: SmartAlertFormState): Promise<SmartAlert> {
    const payload = CreateSmartAlertMapper.toPayload(state);
    const response = await apiClient.post<{ data: SmartAlert }>('/smart-alerts', payload);
    return response.data.data;
  }

  async updateSmartAlert(id: string, state: Partial<SmartAlertFormState>): Promise<SmartAlert> {
    const response = await apiClient.patch<{ data: SmartAlert }>(`/smart-alerts/${id}`, state);
    return response.data.data;
  }

  async deleteSmartAlert(id: string): Promise<void> {
    await apiClient.delete(`/smart-alerts/${id}`);
  }
}
