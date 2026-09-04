import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useOtpTimer } from '../useOtpTimer';

describe('useOtpTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('initializes with default cooldown and decrements each second', () => {
    const { result } = renderHook(() => useOtpTimer(60));

    expect(result.current.secondsLeft).toBe(60);
    expect(result.current.formattedTimer).toBe('0:60');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.secondsLeft).toBe(55);
    expect(result.current.formattedTimer).toBe('0:55');
  });

  it('re-computes remaining time when app transitions to active state', () => {
    let appStateCallback: ((state: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateCallback = listener;
      return { remove: jest.fn() } as any;
    });

    const { result } = renderHook(() => useOtpTimer(60));

    // Fast-forward real time past 15 seconds
    act(() => {
      jest.advanceTimersByTime(15000);
    });
    expect(result.current.secondsLeft).toBe(45);

    // Simulate backgrounding and resuming after 20 more seconds
    act(() => {
      jest.advanceTimersByTime(20000);
      if (appStateCallback) {
        appStateCallback('active');
      }
    });

    expect(result.current.secondsLeft).toBe(25);
  });

  it('resets timer when resetTimer is called', () => {
    const { result } = renderHook(() => useOtpTimer(60));

    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(result.current.secondsLeft).toBe(30);

    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.secondsLeft).toBe(60);
    expect(result.current.formattedTimer).toBe('0:60');
  });
});
