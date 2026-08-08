import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Business } from '@esparex/contracts';
import { services } from '../../../../bootstrap';
import { BusinessFormState } from '../../domain/BusinessFormState';

export function useSubmitBusinessRegistration() {
  const queryClient = useQueryClient();

  return useMutation<Business, Error, BusinessFormState>({
    mutationFn: (state: BusinessFormState) => services.businessService.registerBusiness(state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
