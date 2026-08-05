import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SmartAlert } from '../../domain/SmartAlert';
import { SmartAlertFormState } from '../../domain/SmartAlertFormState';
import { ApiSmartAlertRepository } from '../../application/ApiSmartAlertRepository';
import { SmartAlertService } from '../../application/SmartAlertService';

const smartAlertService = new SmartAlertService(new ApiSmartAlertRepository());

export function useCreateSmartAlert() {
  const queryClient = useQueryClient();

  return useMutation<SmartAlert, Error, SmartAlertFormState>({
    mutationFn: (state: SmartAlertFormState) => smartAlertService.createSmartAlert(state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts', 'list'] });
    },
  });
}
