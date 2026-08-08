import { useQuery } from '@tanstack/react-query';
import { SmartAlert } from '../../domain/SmartAlert';
import { services } from '../../../../bootstrap';

export function useSmartAlertsList(enabled: boolean = true) {
  return useQuery<SmartAlert[], Error>({
    queryKey: ['smart-alerts', 'list'],
    queryFn: () => services.smartAlertService.getSmartAlerts(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
