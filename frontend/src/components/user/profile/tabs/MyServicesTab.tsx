import { useMyServices, MyServicesStatus } from "./MyServicesTab.hook";
import { Loader } from "./Loader";
import { ErrorBanner } from "./ErrorBanner";
import { ServiceCard } from "./ServiceCard";
// ...existing code...

// Business logic moved to hook

// ...existing code...

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
    // Hook-driven architecture: destructure only used values
    const {
        myServices,
        loadingServices,
        servicesError,
        handleDeleteService,
    } = useMyServices(activeTab, user, statusFilter);

    // UI wiring
    if (loadingServices) return <Loader />;
    if (servicesError) return <ErrorBanner message={typeof servicesError === 'string' ? servicesError : servicesError?.message || 'An error occurred.'} />;

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
// ...existing code...

    // ...UI code remains, but use myServices, loadingServices, fetchMyServices, handleDeleteService from hook
}
