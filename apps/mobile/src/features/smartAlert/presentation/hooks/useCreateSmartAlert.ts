import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SmartAlert } from '../../domain/SmartAlert';
import { SmartAlertFormState } from '../../domain/SmartAlertFormState';
import { services } from '../../../../bootstrap';

export function useCreateSmartAlert() {
  const queryClient = useQueryClient();

  return useMutation<SmartAlert, Error, SmartAlertFormState>({
    mutationFn: (state: SmartAlertFormState) => services.smartAlertService.createSmartAlert(state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts', 'list'] });
    },
  });
}
