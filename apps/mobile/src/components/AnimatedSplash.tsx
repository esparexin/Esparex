import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Image, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash visible until we explicitly hide it.
// Call this once at the top of App.tsx, outside the component.
SplashScreen.preventAutoHideAsync().catch(() => {});

type Props = {
  onFinish: () => void;
  logo: number; // require('./assets/logo-esparex.png')
  backgroundColor?: string;
};

/**
 * Renders on top of the app immediately after the native (static) splash
 * hides, and plays a cheap fade+scale-in on the logo before revealing the
 * app underneath. Uses useNativeDriver so the animation runs on the UI
 * thread — it does not block JS-thread work like data fetching or
 * navigation setup happening in parallel.
 */
export default function AnimatedSplash({ onFinish, logo, backgroundColor = '#0A0C0B' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Native splash is already gone by the time this mounts — hide it here
    // so there's no gap/flash between native splash and this screen.
    SplashScreen.hideAsync().catch(() => {});

    Animated.timing(opacity, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();

    Animated.timing(scale, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start(() => {
      // Hold briefly so the logo doesn't just flash, then cross-fade out.
      setTimeout(() => {
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(onFinish);
      }, 350);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { backgroundColor, opacity: containerOpacity }]}>
      <Animated.Image
        source={logo}
        style={[styles.logo, { opacity, transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 89, // matches the 512x206 wordmark aspect ratio
  },
});
