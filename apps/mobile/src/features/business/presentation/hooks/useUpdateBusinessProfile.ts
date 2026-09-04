import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Business } from '@esparex/contracts';
import { services } from '../../../../bootstrap';
import { BusinessFormState } from '../../domain/BusinessFormState';

export interface UpdateBusinessMutationArgs {
  businessId: string;
  state: Partial<BusinessFormState>;
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();

  return useMutation<Business, Error, UpdateBusinessMutationArgs>({
    mutationFn: ({ businessId, state }: UpdateBusinessMutationArgs) =>
      services.businessService.updateBusiness(businessId, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}
