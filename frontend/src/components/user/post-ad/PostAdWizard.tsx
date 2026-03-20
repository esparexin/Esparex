import { PostAdProvider, usePostAd } from "./PostAdContext";
import DeviceIdentityFields from "./steps/DeviceIdentityFields";
import ListingDetailsFields from "./steps/ListingDetailsFields";
import { PostAdShell } from "./PostAdShell";
import { cn } from "@/components/ui/utils";
import { X } from "@/icons/IconRegistry";
import { Button } from "@/components/ui/button";
import { usePostAdForm } from "@/hooks/usePostAdForm";
import { FormProvider } from "react-hook-form";
import { useNavigation } from "@/context/NavigationContext";
import type { PostAdWizardProps } from "./types";

const STEP_LABELS = ["Device Details", "Listing Details"];

function PostAdWizardContent({ navigateTo }: { navigateTo: PostAdWizardProps["navigateTo"] }) {
  const { 
    currentStep, 
    isEditMode, 
    prevStep, 
    nextStep, 
    submitAd, 
    isSubmitting, 
    isUploadingImages,
    formError,
    submittedAd
  } = usePostAd();
  const { confirmNavigation } = useNavigation();

  const handleClose = () => {
    confirmNavigation(() => {
      navigateTo("home");
    });
  };

  const isButtonDisabled = isSubmitting || isUploadingImages;

  if (submittedAd) {
    return (
      <PostAdShell>
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-6"
          )}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">
                {isEditMode ? "Ad Updated Successfully" : "Ad Submitted Successfully"}
              </h2>
              <p className="text-sm text-slate-600">
                {isEditMode 
                  ? "Your changes are pending admin review. They will go live after approval."
                  : "Pending admin review. It will go live after approval."
                }
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => navigateTo("home")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-xl"
              >
                OK
              </Button>
              <Button
                variant="outline"
                onClick={() => navigateTo("my-ads", undefined, "?tab=pending")}
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold h-12 rounded-xl"
              >
                View Pending Ads
              </Button>
            </div>
          </div>
        </div>
      </PostAdShell>
    );
  }

  return (
    <PostAdShell>
      {/* Global error banner */}
      {formError && (
        <div className="error-banner">
          <strong>Post Ad Error:</strong> {formError || "Please complete required fields before posting."}
        </div>
      )}

      <div
        onClick={handleClose}
        className={cn(
          "h-[100dvh] flex flex-col bg-white overflow-hidden font-inter",
          "sm:fixed sm:inset-0 sm:h-auto sm:bg-slate-900/40 sm:backdrop-blur-md sm:flex sm:items-center sm:justify-center sm:p-6 sm:z-40 sm:cursor-pointer"
        )}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex flex-col bg-white flex-1 sm:cursor-default",
            "sm:flex-none sm:w-full sm:max-w-lg sm:max-h-[90dvh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
          )}
        >
          <header className={cn(
            "shrink-0 bg-white border-b border-slate-200",
            "flex items-center px-4 h-14",
            "sm:gap-3 sm:px-5 sm:h-auto sm:py-4"
          )}>
            <div className="sm:contents">
              <div className="w-10 sm:w-auto flex items-center justify-start shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-slate-600 hover:bg-slate-100 rounded-full h-9 w-9 sm:h-8 sm:w-8"
                  aria-label="Close"
                >
                  <X className="text-slate-500 hover:text-slate-900 transition-colors" />
                </Button>
              </div>
              <h1 className={cn(
                "font-bold text-slate-900 text-base leading-none",
                "flex-1 text-center",
                "sm:flex-none sm:text-left"
              )}>
                {isEditMode ? "Edit Ad" : "Post Ad"}
              </h1>
              <div className="w-10 sm:hidden" />
            </div>
          </header>

          <div className="shrink-0 px-4 pt-4 sm:px-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Step {currentStep} of 2
              </span>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                {STEP_LABELS[currentStep - 1]}
              </span>
            </div>
            <div className="flex gap-1">
              {STEP_LABELS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-500",
                    currentStep > i + 1
                      ? "bg-blue-600"
                      : currentStep === i + 1
                      ? "bg-blue-400"
                      : "bg-slate-100"
                  )}
                />
              ))}
            </div>
          </div>

          <main data-post-ad-scroll className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div>
              <div className={cn(currentStep > 1 && "hidden")}>
                <DeviceIdentityFields />
              </div>
              <div className={cn(currentStep <= 1 && "hidden")}>
                <ListingDetailsFields />
              </div>
            </div>
          </main>

          {currentStep > 1 && (
            <div className="shrink-0 border-t border-slate-100 px-4 py-2 sm:px-5 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => prevStep()}
                className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-900 transition-colors h-8 px-2 -ml-2"
              >
                ← Back to Step {currentStep - 1}
              </Button>
            </div>
          )}

          <footer className="shrink-0 bg-white border-t border-slate-100 p-4 sm:px-5 sm:py-4">
            <Button
              type="button"
              onClick={currentStep === 2 ? submitAd : nextStep}
              disabled={isButtonDisabled}
              className={cn(
                "w-full rounded-xl font-bold transition-all active:scale-[0.98]",
                "h-14 text-lg sm:h-12 sm:text-base",
                currentStep === 2 ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
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
          </footer>
        </div>
      </div>
    </PostAdShell>
  );
}

export function PostAdWizard({ navigateTo, editAdId }: PostAdWizardProps) {
  const formHook = usePostAdForm()
  return (
    <FormProvider {...formHook.form}>
      <PostAdProvider
        formHook={formHook}
        editAdId={editAdId}
      >
        <PostAdWizardContent navigateTo={navigateTo} />
      </PostAdProvider>
    </FormProvider>
  )
}

