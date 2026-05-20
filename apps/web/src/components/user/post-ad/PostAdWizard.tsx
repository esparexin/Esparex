import { useCallback } from "react";
import { PostAdProvider, usePostAdFlow, usePostAdImages, usePostAdAction } from "./PostAdContext";
import DeviceIdentityFields from "./steps/DeviceIdentityFields";
import ListingDetailsFields from "./steps/ListingDetailsFields";
import { PostAdShell } from "./PostAdShell";
import { ListingModalLayout, ListingModalBody, ListingModalFooter } from "@/components/user/shared/ListingModalLayout";
import { ListingSubmissionSuccessModal } from "@/components/user/shared/ListingSubmissionSuccessModal";
import { EditAdWrapper } from "./EditAdWrapper";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/button";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { FormProvider } from "react-hook-form";
import { useNavigation } from "@/context/NavigationContext";
import type { PostAdWizardProps } from "./types";

const STEP_LABELS = ["Device Details", "Listing Details"];

function PostAdWizardContent({ navigateTo }: { navigateTo: PostAdWizardProps["navigateTo"] }) {
  const { currentStep, isEditMode, isSubmitting, formError, submittedAd } = usePostAdFlow();
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
      <ListingModalLayout 
        title={isEditMode ? "Edit Ad" : "Post Ad"} 
        subtitle={isEditMode ? undefined : stepSubtitle}
        onClose={handleClose}
      >
        <ListingModalBody data-post-ad-scroll className="space-y-4">
          {formError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p className="font-semibold">Post Ad Error</p>
              <p className="mt-1">{formError || "Please complete required fields before posting."}</p>
            </div>
          ) : null}

          <div className={cn(currentStep > 1 && "hidden")}>
            <DeviceIdentityFields />
          </div>
          <div className={cn(currentStep <= 1 && "hidden")}>
            <ListingDetailsFields />
          </div>

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
