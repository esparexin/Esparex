import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { getMe } from "@/lib/api/user/users";
import { useCurrentUser } from '@/hooks/useCurrentUser';

/**
 * Hook to fetch the currently authenticated user's profile
 */
export const useUserQuery = () => {
    const { status, user } = useCurrentUser();

    return useQuery({
        queryKey: queryKeys.user.me(),
        queryFn: () => getMe({ silent: true }), // Prevent error toasts on 401s if not logged in
        staleTime: 5 * 60 * 1000,
        retry: 0, // No need to retry if 401
        enabled: status === 'authenticated',
        initialData: user ?? undefined,
    });
};
