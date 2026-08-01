import React from 'react';
import { View } from 'react-native';
import { AppText } from '@esparex/mobile-ui';
import { WIZARD_STEPS, WizardStep } from '../../domain/WizardStep';

interface WizardProgressProps {
  currentStep: WizardStep;
}

/**
 * WizardProgress — stateless step progress indicator.
 *
 * Derives step count and labels directly from the WIZARD_STEPS SSOT.
 * No totalSteps prop needed — adding a step to WIZARD_STEPS automatically
 * updates this component.
 */
export const WizardProgress = ({ currentStep }: WizardProgressProps) => {
  const currentMeta = WIZARD_STEPS[currentStep];

  return (
    <View className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      {/* Step label */}
      <AppText variant="label" className="text-slate-500 dark:text-slate-400 text-center mb-3">
        Step {currentStep + 1} of {WIZARD_STEPS.length} — {currentMeta.label}
      </AppText>

      {/* Progress dots */}
      <View className="flex-row justify-center items-center gap-2">
        {WIZARD_STEPS.map(({ step }) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <View
              key={step}
              className={[
                'h-2 rounded-full',
                isActive
                  ? 'w-8 bg-sky-500'
                  : isCompleted
                  ? 'w-2 bg-sky-300 dark:bg-sky-700'
                  : 'w-2 bg-slate-200 dark:bg-slate-700',
              ].join(' ')}
              accessibilityLabel={`Step ${step + 1}${isCompleted ? ', completed' : isActive ? ', current' : ''}`}
            />
          );
        })}
      </View>
    </View>
  );
};

