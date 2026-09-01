import { useQuery } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';

export const useProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      return await services.userService.getProfile();
    },
    enabled,
  });
};
