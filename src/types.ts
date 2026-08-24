export type SoundType = 'classic' | 'gentle_rise' | 'urgent';

export type AlarmMediaType = 'sound' | 'video';

export interface VideoDefinition {
  id: string;
  titleAr: string;
  subtitleAr: string;
  category: 'quran' | 'motivation' | 'fajr' | 'nature' | 'custom';
  durationText: string;
  thumbnailGradient: string;
  isPreset: boolean;
  videoUrl?: string;
  quranAyah?: string;
  reciter?: string;
  blobKey?: string;
}

export interface CustomVideoItem {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  duration?: number;
  blob: Blob;
}

export interface Alarm {
  id: string;
  label: string;
  time: string; // "HH:MM" 24-hour format
  repeatDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (empty = one-time next occurrence)
  enabled: boolean;
  mediaType: AlarmMediaType; // 'sound' or 'video'
  soundId: SoundType;
  videoId?: string;
  customVideoName?: string;
  volume: number; // 0 to 1
  snoozeMinutes: number;
  vibration: boolean;
  mathChallenge: boolean;
  createdAt: string; // ISO string
}

export interface SoundDefinition {
  id: SoundType;
  nameAr: string;
  descriptionAr: string;
  tag: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultSnoozeMinutes: number;
  defaultSound: SoundType;
  defaultMediaType: AlarmMediaType;
  defaultVideoId: string;
  globalMathChallenge: boolean;
  hasSeenOnboarding: boolean;
}

export interface BatteryState {
  supported: boolean;
  level: number; // 0 to 1
  charging: boolean;
}

export interface WakeLockStatus {
  supported: boolean;
  active: boolean;
  error?: string;
}

export interface MathChallengeProblem {
  question: string;
  answer: number;
  options: number[];
}
