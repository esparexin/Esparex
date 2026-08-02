import { useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '../../../../bootstrap';
import { User } from '@esparex/contracts';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      return await services.userService.updateProfile(payload);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'profile'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};
