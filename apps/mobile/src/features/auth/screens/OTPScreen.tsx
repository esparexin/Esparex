import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, View, BackHandler, Animated } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AppInput, AppButton, AppText, SegmentedOtpInput } from '@esparex/mobile-ui';
import { TEXT_LIMITS, authNameSchema } from '@esparex/contracts';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../../../providers/AuthProvider';
import { navigate } from '../../../navigation/navigationRef';
import { AuthStackParamList, ROUTES } from '../../../navigation/routes';

import { useOtpTimer } from '../hooks/useOtpTimer';
import { useShakeAnimation } from '../hooks/useShakeAnimation';

const RESEND_COOLDOWN_SECONDS = 60;

export const OTPScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.OTP>>();
  const mobile = route.params?.mobile || '';
  const isNewUser = Boolean(route.params?.isNewUser);
  const initialName = route.params?.name || '';

  const [code, setCode] = useState('');
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { shakeAnim, triggerShake } = useShakeAnimation();
  const { verifyOtp, sendOtp, cancelOtp } = useAuth();
  const { secondsLeft, formattedTimer, resetTimer } = useOtpTimer(RESEND_COOLDOWN_SECONDS);

  // Handle complete modal dismissal
  const handleDismiss = useCallback(() => {
    if (mobile) {
      void cancelOtp(mobile);
    }
    const parentNav = navigation.getParent();
    if (parentNav?.canGoBack()) {
      parentNav.goBack();
    } else {
      navigate(ROUTES.MAIN_STACK);
    }
  }, [mobile, cancelOtp, navigation]);

  // Handle Number Change / Cancellation (navigate back to Login)
  const handleChangeNumber = useCallback(async () => {
    if (mobile) {
      void cancelOtp(mobile);
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN });
    }
  }, [mobile, cancelOtp, navigation]);

  // Android Hardware Back Handler
  useEffect(() => {
    const onBackPress = () => {
      void handleChangeNumber();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [handleChangeNumber]);

  const handleCodeChange = (text: string) => {
    const match = text.match(/\b\d{6}\b/);
    const digitsOnly = match ? match[0] : text.replace(/\D/g, '').slice(0, 6);
    setCode(digitsOnly);
    if (error) setError(null);
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || resending || !mobile) return;
    setResending(true);
    setError(null);
    try {
      const res = await sendOtp(mobile);
      if (res.success) {
        resetTimer();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const status = axiosErr?.response?.status;
      const apiError = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message;
      if (status === 423) {
        setError('Too many invalid attempts. Account temporarily locked.');
      } else if (status === 429) {
        setError('Too many OTP requests. Please wait before retrying.');
      } else {
        setError(apiError || 'Failed to resend OTP. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!mobile || code.length !== 6) {
      triggerShake();
      return;
    }
    if (isNewUser) {
      const nameValidation = authNameSchema.safeParse(name.trim());
      if (!nameValidation.success) {
        const errorMsg = nameValidation.error.issues[0]?.message || 'Please enter a valid full name';
        setError(errorMsg);
        triggerShake();
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      await verifyOtp(mobile, code, isNewUser ? name.trim() : undefined);
      const parentNav = navigation.getParent();
      if (parentNav?.canGoBack()) {
        parentNav.goBack();
      } else {
        navigate(ROUTES.MAIN_STACK);
      }
    } catch (err: unknown) {
      triggerShake();
      const axiosErr = err as { response?: { data?: { error?: string; message?: string; details?: { attemptsLeft?: number; lockUntil?: string } }; status?: number } };
      const apiError = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message;
      const details = axiosErr?.response?.data?.details;
      const status = axiosErr?.response?.status;

      if (status === 423) {
        setError('Too many invalid attempts. Account temporarily locked.');
      } else if (status === 429) {
        setError('Too many verification attempts. Please wait before retrying.');
      } else if (details?.attemptsLeft !== undefined && details.attemptsLeft > 0) {
        setError(`Invalid OTP. ${details.attemptsLeft} attempt(s) remaining.`);
      } else if (apiError) {
        setError(apiError);
      } else {
        setError('Verification failed. Please check the code and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isNameValid = !isNewUser || authNameSchema.safeParse(name.trim()).success;
  const isSubmitDisabled =
    code.length !== 6 ||
    !isNameValid ||
    loading;

  return (
    <AuthLayout
      title={isNewUser ? 'Complete Registration' : 'Verify OTP'}
      description={`Enter the 6-digit code sent to +91 ${mobile}`}
      onDismiss={handleDismiss}
      footer={
        <View className="items-center gap-3">
          <TouchableOpacity
            onPress={handleChangeNumber}
            accessibilityRole="button"
            accessibilityLabel="Change mobile number"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppText variant="body" className="text-slate-500 dark:text-slate-400">
              Wrong number? <AppText className="text-brand-600 dark:text-brand-400 font-semibold">Change</AppText>
            </AppText>
          </TouchableOpacity>
        </View>
      }
    >
      {isNewUser && (
        <AppInput
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (error) setError(null);
          }}
          autoFocus={isNewUser}
          autoCapitalize="words"
          maxLength={TEXT_LIMITS.NAME.MAX}
          accessibilityLabel="Full Name"
          accessibilityHint="Required for new account registration"
        />
      )}

      {/* design-token-ignore: dynamic animation transform */}
      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <SegmentedOtpInput
          length={6}
          value={code}
          onChangeText={handleCodeChange}
          error={error || undefined}
          autoFocus={!isNewUser}
          accessibilityLabel="6-Digit Verification Code"
          accessibilityHint="Enter the 6-digit OTP received via SMS"
        />
      </Animated.View>

      <View className="flex-row items-center justify-between mt-1 px-1">
        {secondsLeft > 0 ? (
          <AppText variant="caption" className="text-slate-400 dark:text-slate-500">
            Resend OTP in <AppText variant="caption" className="font-semibold text-slate-600 dark:text-slate-300">{formattedTimer}</AppText>
          </AppText>
        ) : (
          <TouchableOpacity
            onPress={handleResend}
            disabled={resending}
            accessibilityRole="button"
            accessibilityLabel="Resend OTP code"
          >
            <AppText variant="caption" className="text-brand-600 dark:text-brand-400 font-semibold">
              {resending ? 'Sending...' : 'Resend OTP'}
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      <AppButton
        label={isNewUser ? 'Verify & Register' : 'Verify & Sign In'}
        onPress={handleVerify}
        loading={loading}
        className="mt-4"
        disabled={isSubmitDisabled}
        accessibilityLabel={isNewUser ? 'Verify and Register Button' : 'Verify and Sign In Button'}
      />
    </AuthLayout>
  );
};
