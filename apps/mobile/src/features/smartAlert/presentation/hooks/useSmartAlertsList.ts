import { useQuery } from '@tanstack/react-query';
import { SmartAlert } from '../../domain/SmartAlert';
import { ApiSmartAlertRepository } from '../../application/ApiSmartAlertRepository';
import { SmartAlertService } from '../../application/SmartAlertService';

const smartAlertService = new SmartAlertService(new ApiSmartAlertRepository());

export function useSmartAlertsList(enabled: boolean = true) {
  return useQuery<SmartAlert[], Error>({
    queryKey: ['smart-alerts', 'list'],
    queryFn: () => smartAlertService.getSmartAlerts(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
