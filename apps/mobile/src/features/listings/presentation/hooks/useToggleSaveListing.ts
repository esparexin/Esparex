import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiListingRepository } from '../../application/ApiListingRepository';

const listingRepo = new ApiListingRepository();

interface ToggleSaveParams {
  adId: string;
  isSaved: boolean;
}

export function useToggleSaveListing() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleSaveParams>({
    mutationFn: ({ adId, isSaved }) => listingRepo.toggleSaveListing(adId, isSaved),
    onSuccess: () => {
      // Invalidate saved listings, search listings, and details to keep favorite hearts synchronized in real time
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'search'] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'detail'] });
    },
  });
}
