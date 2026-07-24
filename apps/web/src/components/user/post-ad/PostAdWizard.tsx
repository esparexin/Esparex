import { useCallback } from "react";
import { PostAdProvider, usePostAdFlow, usePostAdImages, usePostAdAction } from "./PostAdContext";
import { StepOne } from "./steps/listing-information";
import { StepTwo } from "./steps/listing-details";
import { PostAdShell } from "./PostAdShell";
import { ListingModalLayout, ListingModalBody, ListingModalFooter } from "@/components/user/shared/ListingModalLayout";
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { EditAdWrapper } from "./EditAdWrapper";
import { cn } from "@/components/ui/utils";
import { Button } from "@esparex/ui";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { FormProvider } from "react-hook-form";
import { ValidationSummary } from "./steps/common/ValidationSummary";
import { useNavigation } from "@/context/NavigationContext";
import type { PostAdWizardProps } from "./types";

const STEP_LABELS = ["Listing Information", "Listing Details"];

function PostAdWizardContent({ navigateTo }: { navigateTo: PostAdWizardProps["navigateTo"] }) {
  const { currentStep, isEditMode, isSubmitting, submittedAd } = usePostAdFlow();
  const { isUploadingImages } = usePostAdImages();
  const { prevStep, nextStep, submitAd } = usePostAdAction();
  const { confirmNavigation } = useNavigation();

  const handleGoHome = useCallback(() => navigateTo("home"), [navigateTo]);
  const handleGoMyAds = useCallback(() => navigateTo("my-ads"), [navigateTo]);
  const handleClose = useCallback(() => {
    confirmNavigation(handleGoHome);
  }, [confirmNavigation, handleGoHome]);

  const isButtonDisabled = isSubmitting || isUploadingImages;

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

  const stepSubtitle = `Step ${currentStep} of 2: ${STEP_LABELS[currentStep - 1]}`;

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
          <ValidationSummary />

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
                className="text-sm font-medium h-11 px-4 shrink-0"
              >
                ← Back
              </Button>
            )}
            {currentStep === 1 && !isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="text-sm font-medium h-11 px-4"
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
                "flex-1 sm:flex-none min-w-0 sm:min-w-[200px] rounded-xl font-medium transition-all active:scale-[0.98]",
                "h-11 text-base",
                "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
