import { Alarm, AppSettings } from '../types';

export const STORAGE_KEY_ALARMS = 'tablet_alarm_v1_alarms';
export const STORAGE_KEY_SETTINGS = 'tablet_alarm_v1_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultSnoozeMinutes: 5,
  defaultSound: 'classic',
  defaultMediaType: 'video',
  defaultVideoId: 'preset-yusuf',
  globalMathChallenge: false,
  hasSeenOnboarding: false,
};

export const INITIAL_SAMPLE_ALARMS: Alarm[] = [
  {
    id: 'fajr-preset',
    label: 'صلاة الفجر وبداية المذاكرة 🌅',
    time: '04:45',
    repeatDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    enabled: true,
    mediaType: 'video',
    soundId: 'gentle_rise',
    videoId: 'preset-yusuf',
    volume: 1,
    snoozeMinutes: 5,
    vibration: true,
    mathChallenge: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'morning-study',
    label: 'جلسة تركيز فيزياء / كيمياء 📚',
    time: '06:30',
    repeatDays: [0, 1, 2, 3, 4], // Weekdays
    enabled: false,
    mediaType: 'video',
    soundId: 'classic',
    videoId: 'preset-motivation',
    volume: 1,
    snoozeMinutes: 5,
    vibration: true,
    mathChallenge: true,
    createdAt: new Date().toISOString(),
  },
];

let memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Fallback to memory
  }
  return memoryStorage[key] ?? null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Fallback to memory
  }
  memoryStorage[key] = value;
}

export function getAlarms(): Alarm[] {
  try {
    const raw = safeGetItem(STORAGE_KEY_ALARMS);
    if (!raw) {
      safeSetItem(STORAGE_KEY_ALARMS, JSON.stringify(INITIAL_SAMPLE_ALARMS));
      return INITIAL_SAMPLE_ALARMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((a: Partial<Alarm>) => ({
        ...a,
        mediaType: a.mediaType || 'sound',
        videoId: a.videoId || 'preset-yusuf',
      })) as Alarm[];
    }
    return INITIAL_SAMPLE_ALARMS;
  } catch (err) {
    console.error('Failed to read alarms from localStorage:', err);
    return INITIAL_SAMPLE_ALARMS;
  }
}

export function saveAlarms(alarms: Alarm[]): void {
  try {
    safeSetItem(STORAGE_KEY_ALARMS, JSON.stringify(alarms));
  } catch (err) {
    console.error('Failed to save alarms to localStorage:', err);
  }
}

export function saveAlarm(alarm: Alarm): Alarm[] {
  const current = getAlarms();
  const index = current.findIndex((a) => a.id === alarm.id);
  let updated: Alarm[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = alarm;
  } else {
    updated = [alarm, ...current];
  }
  saveAlarms(updated);
  return updated;
}

export function deleteAlarm(id: string): Alarm[] {
  const current = getAlarms();
  const updated = current.filter((a) => a.id !== id);
  saveAlarms(updated);
  return updated;
}

export function toggleAlarm(id: string, forceState?: boolean): Alarm[] {
  const current = getAlarms();
  const updated = current.map((a) => {
    if (a.id === id) {
      return {
        ...a,
        enabled: forceState !== undefined ? forceState : !a.enabled,
      };
    }
    return a;
  });
  saveAlarms(updated);
  return updated;
}

export function getSettings(): AppSettings {
  try {
    const raw = safeGetItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    safeSetItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Calculates the exact next Date when the given alarm will ring.
 * Takes repeat days into account or calculates next occurrence today/tomorrow.
 */
export function getNextTriggerDate(alarm: Alarm, fromDate: Date = new Date()): Date {
  const [hours, minutes] = alarm.time.split(':').map(Number);
  const candidate = new Date(fromDate.getTime());
  candidate.setHours(hours, minutes, 0, 0);

  // If time already passed today
  if (candidate <= fromDate) {
    candidate.setDate(candidate.getDate() + 1);
  }

  // If repeat days are set, advance until finding matching day of week
  if (alarm.repeatDays && alarm.repeatDays.length > 0) {
    // Check up to 7 days ahead
    let daysChecked = 0;
    while (!alarm.repeatDays.includes(candidate.getDay()) && daysChecked < 8) {
      candidate.setDate(candidate.getDate() + 1);
      daysChecked++;
    }
  }

  return candidate;
}

/**
 * Returns the earliest upcoming enabled alarm and its trigger time.
 */
export function getEarliestNextAlarm(alarms: Alarm[]): { alarm: Alarm; triggerDate: Date } | null {
  const enabledAlarms = alarms.filter((a) => a.enabled);
  if (enabledAlarms.length === 0) return null;

  const now = new Date();
  let earliest: { alarm: Alarm; triggerDate: Date } | null = null;

  for (const alarm of enabledAlarms) {
    const trigger = getNextTriggerDate(alarm, now);
    if (!earliest || trigger.getTime() < earliest.triggerDate.getTime()) {
      earliest = { alarm, triggerDate: trigger };
    }
  }

  return earliest;
}

/**
 * Formats a remaining time duration in friendly Arabic text.
 */
export function formatTimeRemainingArabic(targetDate: Date, now: Date = new Date()): string {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) return 'الآن';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    if (minutes <= 1) return 'خلال أقل من دقيقة';
    if (minutes === 2) return 'خلال دقيقتين';
    if (minutes >= 3 && minutes <= 10) return `خلال ${minutes} دقائق`;
    return `خلال ${minutes} دقيقة`;
  }

  const hoursText =
    hours === 1
      ? 'ساعة واحدة'
      : hours === 2
      ? 'ساعتين'
      : hours >= 3 && hours <= 10
      ? `${hours} ساعات`
      : `${hours} ساعة`;

  if (minutes === 0) {
    return `بعد ${hoursText}`;
  }

  const minsText =
    minutes === 1
      ? 'دقيقة واحدة'
      : minutes === 2
      ? 'دقيقتين'
      : minutes >= 3 && minutes <= 10
      ? `${minutes} دقائق`
      : `${minutes} دقيقة`;

  return `بعد ${hoursText} و ${minsText}`;
}
