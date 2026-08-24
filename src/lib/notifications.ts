export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return Notification.permission;
    }
  }
  return Notification.permission;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function showAlarmNotification(title: string, body: string, iconUrl?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const options: NotificationOptions = {
      body,
      icon: iconUrl || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'tablet-alarm-alert',
      requireInteraction: true,
      silent: false,
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, options).catch(() => {
          new Notification(title, options);
        });
      });
    } else {
      new Notification(title, options);
    }
  } catch (err) {
    console.warn('Could not display system notification:', err);
  }
}

let vibrationInterval: number | null = null;

export function startAlarmVibration(): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

  const pattern = [500, 250, 500, 250, 1000, 500];
  try {
    navigator.vibrate(pattern);
    vibrationInterval = window.setInterval(() => {
      navigator.vibrate(pattern);
    }, 3000);
  } catch (err) {
    console.warn('Vibration API error:', err);
  }
}

export function stopAlarmVibration(): void {
  if (vibrationInterval !== null) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // ignore
    }
  }
}
