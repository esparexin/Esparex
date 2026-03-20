/**
 * Page Wrapper with Back to Dashboard Button
 * Automatically shows a back button when user navigates from dashboard
 */

import { BackButton } from "@/components/common/BackButton";

interface PageWithBackButtonProps {
  children: React.ReactNode;
  showBackButton: boolean;
  onBack: () => void;
  backLabel?: string;
  className?: string;
}

/**
 * Wrapper component that adds a back-to-dashboard button at the top of pages
 * Usage:
 * <PageWithBackButton showBackButton={isFromDashboard()} onBack={navigateBack}>
 *   <YourPageContent />
 * </PageWithBackButton>
 */
export function PageWithBackButton({
  children,
  showBackButton,
  onBack,
  backLabel = "Back to Dashboard",
  className = ""
}: PageWithBackButtonProps) {
  if (!showBackButton) {
    return <>{children}</>;
  }

  return (
    <div className={className}>
      {/* Back Button Bar - Sticky at top */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <BackButton
            onClick={onBack}
            label={backLabel}
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100"
            showLabelOnMobile={true}
          />
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
