import { semantic } from '@esparex/design-tokens';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. If omitted, the built-in fallback is used. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * AppErrorBoundary — catches unhandled render-phase errors in any child tree
 * and replaces the crashed subtree with a recovery UI.
 *
 * Placement:
 *   App.tsx wraps the entire tree so no screen can crash the whole app silently.
 *
 * Accessibility:
 *   The fallback uses semantic text and a labelled button so users can recover
 *   via keyboard or assistive technology.
 *
 * Does NOT:
 *   - Catch promise rejections (those are handled by QueryProvider / useEffect)
 *   - Catch errors in event handlers (those surface via Alert or in-component state)
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production you would forward this to your crash-reporting service.
    // Using console.error here keeps the dependency list zero.
    // eslint-disable-next-line no-console
    console.error('[AppErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Custom fallback wins over built-in
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <View style={styles.container} accessibilityRole="alert">
        <View style={styles.iconWrapper}>
          <Text style={styles.icon} aria-hidden>⚠️</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Something went wrong
        </Text>
        <Text style={styles.body}>
          The app encountered an unexpected error. Your data is safe.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={this.handleReset}
          accessibilityLabel="Retry — dismiss error and reload screen"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.light.foreground, // formerly #020617
    padding: 32,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: semantic.light.destructive, // replaced #fef2f2 with destructive token
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: semantic.light.background, // formerly #f1f5f9
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: semantic.light.muted, // formerly #94a3b8
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    backgroundColor: semantic.light.primary, // formerly #0ea5e9
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: semantic.light['primary-foreground'],
    fontWeight: '600',
    fontSize: 15,
  },
});
