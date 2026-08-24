import { WakeLockStatus } from '../types';

let wakeLockSentinel: any = null;
let isRequested = false;

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export async function requestWakeLock(): Promise<WakeLockStatus> {
  if (!isWakeLockSupported()) {
    return {
      supported: false,
      active: false,
      error: 'متصفحك لا يدعم خاصية Screen Wake Lock، تأكد من تحديث المتصفح.',
    };
  }

  try {
    isRequested = true;
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      return { supported: true, active: true };
    }
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');

    wakeLockSentinel.addEventListener('release', () => {
      // Released by OS or tab visibility change
      if (isRequested && document.visibilityState === 'visible') {
        // Attempt re-acquire
        requestWakeLock();
      }
    });

    return { supported: true, active: true };
  } catch (err: any) {
    console.warn('Wake Lock request error:', err);
    return {
      supported: true,
      active: false,
      error: err?.message || 'تعذر تفعيل قفل الشاشة.',
    };
  }
}

export async function releaseWakeLock(): Promise<void> {
  isRequested = false;
  if (wakeLockSentinel && !wakeLockSentinel.released) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // ignore
    }
    wakeLockSentinel = null;
  }
}

/**
 * Initializes automatic re-acquisition on visibilitychange.
 * When the student switches back to the tab, the screen wake lock is immediately restored.
 */
export function setupWakeLockAutoReacquire(shouldBeActive: () => boolean): () => void {
  const handler = () => {
    if (document.visibilityState === 'visible' && shouldBeActive()) {
      requestWakeLock();
    }
  };

  document.addEventListener('visibilitychange', handler);
  window.addEventListener('focus', handler);

  return () => {
    document.removeEventListener('visibilitychange', handler);
    window.removeEventListener('focus', handler);
  };
}
