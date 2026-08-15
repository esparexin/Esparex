import { useCallback } from "react";
import { PostAdProvider, usePostAdFlow, usePostAdImages, usePostAdAction } from "./context";
import { StepOne } from "./steps/listing-information";
import { StepTwo } from "./steps/listing-details";
import { PostAdShell } from "./PostAdShell";
import { ListingModalLayout, ListingModalBody, ListingModalFooter } from "@/components/user/shared/ListingModalLayout";
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { EditAdWrapper } from "./EditAdWrapper";
import { cn } from "@/components/ui/utils";
import { Button, Spinner } from "@esparex/ui";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { FormProvider } from "react-hook-form";
// useNavigation removed
import { usePostingEntitlement } from "@/hooks/usePostingEntitlement";
import { EntitlementExhaustedShell } from "@/components/user/shared/EntitlementExhaustedShell";
import type { PostAdWizardProps } from "./types";

const STEP_LABELS = ["Listing Information", "Listing Details"];

function PostAdWizardContent({ navigateTo }: { navigateTo: PostAdWizardProps["navigateTo"] }) {
  const { currentStep, isEditMode, isSubmitting, submittedAd } = usePostAdFlow();
  const { isUploadingImages } = usePostAdImages();
  const { prevStep, nextStep, submitAd } = usePostAdAction();
  // Navigation handled without confirmation due to Draft Recovery
  const { entitlement, isAllowed, isLoading: isLoadingEntitlement } = usePostingEntitlement("ads");

  const handleGoHome = useCallback(() => navigateTo("home"), [navigateTo]);
  const handleGoMyAds = useCallback(() => navigateTo("my-ads"), [navigateTo]);
  const handleGoPlans = useCallback(() => {
    window.location.href = "/account/plans";
  }, []);
  const handleClose = useCallback(() => {
    handleGoHome();
  }, [handleGoHome]);

  const isButtonDisabled = isSubmitting || isUploadingImages;

  if (!isEditMode && !isLoadingEntitlement && !isAllowed && entitlement) {
    return (
      <PostAdShell>
        <ListingModalLayout title="Ad Posting Limit" onClose={handleClose}>
          <EntitlementExhaustedShell
            moduleTitle="Ad Posting"
            entitlement={entitlement}
            onPrimaryAction={handleGoPlans}
            onClose={handleClose}
          />
        </ListingModalLayout>
      </PostAdShell>
    );
  }

  if (submittedAd) {
    return (
      <PostAdShell>
        <ListingSubmissionSuccessModal
          entityLabel="Ad"
          isEditMode={isEditMode}
          pendingActionLabel="View Pending Ads"
          onPrimaryAction={handleGoHome}
          onSecondaryAction={handleGoMyAds}
        />
      </PostAdShell>
    );
  }

  const stepLabel = STEP_LABELS[currentStep - 1] || "Listing Information";
  const stepSubtitle = `STEP ${currentStep} OF 2: ${stepLabel.toUpperCase()}`;

  return (
    <PostAdShell>
      <a
        href="#post-ad-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-foreground focus:rounded-lg focus:shadow-lg focus:border focus:border-slate-200 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <ListingModalLayout 
        title={isEditMode ? "Edit Ad" : "Post Ad"} 
        subtitle={isEditMode ? undefined : stepSubtitle}
        onClose={handleClose}
      >
        <ListingModalBody id="post-ad-content" data-post-ad-scroll className="space-y-4">

          <div className={cn(currentStep !== 1 && "hidden")}>
            <StepOne />
          </div>
          <div className={cn(currentStep !== 2 && "hidden")}>
            <StepTwo />
          </div>

        </ListingModalBody>

        <ListingModalFooter>
          <div className="flex items-center gap-3 sm:gap-4 w-full">
            {currentStep > 1 && !isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="text-xs sm:text-sm font-semibold h-11 px-4 sm:px-5 rounded-xl text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                ← Back
              </Button>
            )}
            {currentStep === 1 && !isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="text-xs sm:text-sm font-semibold h-11 px-4 sm:px-5 rounded-xl text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Cancel
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              onClick={currentStep === 2 ? submitAd : nextStep}
              disabled={isButtonDisabled}
              className={cn(
                "flex-1 sm:flex-none min-w-0 sm:min-w-[180px] rounded-xl font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "h-11 text-sm font-semibold",
                "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-600/20 disabled:opacity-50"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Processing...</span>
                </div>
              ) : (
                currentStep === 2 ? (isEditMode ? "Save Changes" : "Post Ad") : "Continue →"
              )}
            </Button>
          </div>
        </ListingModalFooter>
      </ListingModalLayout>
    </PostAdShell>
  );
}

export function PostAdWizard({ navigateTo, editAdId }: PostAdWizardProps) {
  const formHook = usePostAdForm(!!editAdId)
  return (
    <FormProvider {...formHook.form}>
      <PostAdProvider
        formHook={formHook}
        editAdId={editAdId}
      >
        {editAdId ? (
          <EditAdWrapper>
            <PostAdWizardContent navigateTo={navigateTo} />
          </EditAdWrapper>
        ) : (
          <PostAdWizardContent navigateTo={navigateTo} />
        )}
      </PostAdProvider>
    </FormProvider>
  )
}
