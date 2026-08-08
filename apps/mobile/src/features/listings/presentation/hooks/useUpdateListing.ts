import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateListingRequest } from '@esparex/contracts';
import { services } from '../../../../bootstrap';
import { Listing } from '../../domain/Listing';

interface UpdateListingParams {
  id: string;
  updates: Partial<CreateListingRequest>;
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation<Listing, Error, UpdateListingParams>({
    mutationFn: ({ id, updates }) => services.listingService.updateListing(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listings', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'search'] });
    },
  });
}
