import { useCallback } from "react";
import { PostAdProvider, usePostAdFlow, usePostAdImages, usePostAdAction } from "./PostAdContext";
import { StepOne } from "./steps/listing-information";
import { StepTwo } from "./steps/listing-details";
import { PostAdShell } from "./PostAdShell";
import { ListingModalLayout, ListingModalBody, ListingModalFooter } from "@/components/user/shared/ListingModalLayout";
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { EditAdWrapper } from "./EditAdWrapper";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { FormProvider } from "react-hook-form";
import { ValidationSummary } from "./steps/common/ValidationSummary";
import { useNavigation } from "@/context/NavigationContext";
import { useRouter } from "next/navigation";
import { buildAccountListingRoute } from "@/lib/accountListingRoutes";
import type { PostAdWizardProps } from "./types";

const STEP_LABELS = ["Listing Information", "Listing Details"];

function PostAdWizardContent({ navigateTo }: { navigateTo: PostAdWizardProps["navigateTo"] }) {
  const { currentStep, isEditMode, isSubmitting, submittedAd } = usePostAdFlow();
  const { isUploadingImages } = usePostAdImages();
  const { prevStep, nextStep, submitAd } = usePostAdAction();
  const { confirmNavigation } = useNavigation();
  const router = useRouter();

  const handleGoHome = useCallback(() => navigateTo("home"), [navigateTo]);
  const isAutoApproved = submittedAd?.status === 'live';
  const handleGoMyAds = useCallback(() => {
    const statusTab = isAutoApproved ? "live" : "pending";
    void router.push(buildAccountListingRoute("ads", statusTab));
  }, [router, isAutoApproved]);
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
      <ListingModalLayout 
        title={isEditMode ? "Edit Ad" : "Post Ad"} 
        subtitle={isEditMode ? undefined : stepSubtitle}
        onClose={handleClose}
      >
        <ListingModalBody data-post-ad-scroll className="space-y-4">
          <ValidationSummary />

          {currentStep === 1 && <StepOne />}
          {currentStep === 2 && <StepTwo />}

          {currentStep > 1 && !isEditMode ? (
            <div className="border-t border-slate-100 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="text-sm font-semibold text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors h-11 px-2 -ml-2"
              >
                ← Back to Step {currentStep - 1}
              </Button>
            </div>
          ) : null}
        </ListingModalBody>

        <ListingModalFooter>
          <Button
            type="button"
            onClick={currentStep === 2 ? submitAd : nextStep}
            disabled={isButtonDisabled}
            className={cn(
              "w-full rounded-xl font-semibold transition-all active:scale-[0.98]",
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
              currentStep === 2 ? (isEditMode ? "Save Changes" : "Confirm & Post Ad") : "Continue"
            )}
          </Button>
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
