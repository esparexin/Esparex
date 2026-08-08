import { useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

interface ToggleSaveParams {
  adId: string;
  isSaved: boolean;
}

export function useToggleSaveListing() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleSaveParams>({
    mutationFn: ({ adId, isSaved }) => services.listingService.toggleSaveListing(adId, isSaved),
    onSuccess: () => {
      // Invalidate saved listings, search listings, and details to keep favorite hearts synchronized in real time
      queryClient.invalidateQueries({ queryKey: ['listings', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'search'] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'detail'] });
    },
  });
}
