import React from "react";
import { useMyServices, MyServicesStatus } from "./MyServicesTab.hook";
import { Loader } from "./Loader";
import { ErrorBanner } from "./ErrorBanner";
import { ServiceCard } from "./ServiceCard";

export interface MyServicesTabProps {
    user: any;
    activeTab: string;
    statusFilter: MyServicesStatus;
    navigateTo: (page: string, adId?: string | number, category?: string, businessId?: string, serviceId?: string) => void;
    getStatusBadge: (status: string) => React.ReactNode;
    formatDate: (date: string | Date) => string;
}

export function MyServicesTab({
    user,
    activeTab,
    statusFilter,
}: MyServicesTabProps) {
    const {
        myServices,
        loadingServices,
        servicesError,
        handleDeleteService,
    } = useMyServices(activeTab, user, statusFilter);

    if (loadingServices) return <Loader />;
    if (servicesError) return <ErrorBanner message={typeof servicesError === 'string' ? servicesError : (servicesError as any)?.message || 'An error occurred.'} />;

    return (
        <div>
            {myServices.map(service => (
                <ServiceCard
                    key={service.id}
                    service={service}
                    onDelete={() => handleDeleteService(service.id)}
                />
            ))}
        </div>
    );
}
