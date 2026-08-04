import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiSmartAlertRepository } from '../../application/ApiSmartAlertRepository';
import { SmartAlertService } from '../../application/SmartAlertService';
import { SmartAlert } from '../../domain/SmartAlert';

const smartAlertService = new SmartAlertService(new ApiSmartAlertRepository());

export function useDeleteSmartAlert() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousAlerts?: SmartAlert[] }>({
    mutationFn: (id: string) => smartAlertService.deleteSmartAlert(id),
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({ queryKey: ['smart-alerts', 'list'] });
      const previousAlerts = queryClient.getQueryData<SmartAlert[]>(['smart-alerts', 'list']);

      if (previousAlerts) {
        queryClient.setQueryData<SmartAlert[]>(
          ['smart-alerts', 'list'],
          previousAlerts.filter((a) => a.id !== deletedId)
        );
      }

      return { previousAlerts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(['smart-alerts', 'list'], context.previousAlerts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-alerts', 'list'] });
    },
  });
}
