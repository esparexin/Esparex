"use client";


import { Notifications } from '@/components/user/Notifications';
import { withGuard } from '@/guards/withGuard';
import { requireUserAuth } from '@/guards/routeGuards';

function NotificationsPage() {
    return (
        <div className="p-4 md:p-8">
            <Notifications />
        </div>
    );
}

export default withGuard(NotificationsPage, requireUserAuth);
