import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { UserAppProviders } from '@/components/providers/UserAppProviders';

export default async function AuthLayout({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const initialHasAuthCookie = Boolean(cookieStore.get('esparex_auth'));

    return (
        <UserAppProviders initialHasAuthCookie={initialHasAuthCookie}>{children}</UserAppProviders>
    );
}
