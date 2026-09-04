import React, { useState, useEffect, useCallback } from 'react';
import { TouchableOpacity, View, BackHandler, Animated, Vibration } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AppInput, AppButton, AppText, SegmentedOtpInput } from '@esparex/mobile-ui';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../../../providers/AuthProvider';
import { navigate } from '../../../navigation/navigationRef';
import { AuthStackParamList, ROUTES } from '../../../navigation/routes';

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
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [shakeAnim] = useState(() => new Animated.Value(0));

  const triggerShake = useCallback(() => {
    try {
      Vibration.vibrate(50);
    } catch {
      // Ignore vibration unsupported environments
    }
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const { verifyOtp, sendOtp, cancelOtp } = useAuth();

  // 60-Second Resend Cooldown Timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

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
    const digitsOnly = text.replace(/\D/g, '').slice(0, 6);
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
        setSecondsLeft(60);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const apiError = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message;
      setError(apiError || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!mobile || code.length !== 6) {
      triggerShake();
      return;
    }
    if (isNewUser && (!name || name.trim().length < 2)) {
      setError('Please enter your full name (at least 2 characters)');
      triggerShake();
      return;
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

  const isSubmitDisabled =
    code.length !== 6 ||
    (isNewUser && (!name || name.trim().length < 2)) ||
    loading;

  const formattedTimer = `0:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;

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
          maxLength={50}
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
