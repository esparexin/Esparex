import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Business } from '@esparex/contracts';
import { ApiBusinessRepository } from '../../application/ApiBusinessRepository';
import { BusinessService } from '../../application/BusinessService';
import { BusinessFormState } from '../../domain/BusinessFormState';

const businessService = new BusinessService(new ApiBusinessRepository());

export function useSubmitBusinessRegistration() {
  const queryClient = useQueryClient();

  return useMutation<Business, Error, BusinessFormState>({
    mutationFn: (state: BusinessFormState) => businessService.registerBusiness(state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
