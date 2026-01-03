/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API when available
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 10],
  error: [50, 100, 50],
  warning: [20, 50, 20, 50, 20],
};

/**
 * Trigger haptic feedback on supported devices
 * @param pattern - The type of haptic feedback
 * @returns boolean indicating if vibration was triggered
 */
export const hapticFeedback = (pattern: HapticPattern = 'light'): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  if ('vibrate' in navigator) {
    try {
      const vibrationPattern = patterns[pattern];
      navigator.vibrate(vibrationPattern);
      return true;
    } catch (e) {
      console.warn('Haptic feedback failed:', e);
      return false;
    }
  }
  
  return false;
};

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * React hook for haptic feedback
 */
export const useHaptic = () => {
  return {
    trigger: hapticFeedback,
    isSupported: isHapticSupported(),
  };
};
