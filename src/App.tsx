import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Moon,
  Sun,
  Bell,
  Clock,
  Sparkles,
  HelpCircle,
  GraduationCap,
  Shield,
  BookOpen,
  Volume2,
  Flame,
} from 'lucide-react';
import { Alarm, AppSettings, SoundType, WakeLockStatus } from './types';
import { generateSafeId } from './lib/id';
import {
  getAlarms,
  saveAlarm,
  deleteAlarm,
  toggleAlarm,
  getSettings,
  saveSettings,
  getNextTriggerDate,
} from './lib/storage';
import {
  playAlarmSound,
  unlockAudioContext,
  isAudioReady,
} from './lib/sound';
import {
  requestWakeLock,
  releaseWakeLock,
  setupWakeLockAutoReacquire,
  isWakeLockSupported,
} from './lib/wakelock';
import {
  requestNotificationPermission,
  showAlarmNotification,
  startAlarmVibration,
  stopAlarmVibration,
} from './lib/notifications';
import { BrandLogo } from './components/BrandLogo';
import { DigitalClock } from './components/DigitalClock';
import { StatusStrip } from './components/StatusStrip';
import { AlarmCard } from './components/AlarmCard';
import { AlarmModal } from './components/AlarmModal';
import { RingingOverlay } from './components/RingingOverlay';
import { OnboardingModal } from './components/OnboardingModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { QuickTestModal } from './components/QuickTestModal';

export default function App() {
  const [alarms, setAlarms] = useState<Alarm[]>(() => getAlarms());
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<Alarm | null>(null);

  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState<boolean>(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(
    () => !getSettings().hasSeenOnboarding
  );
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);

  const [wakeLockStatus, setWakeLockStatus] = useState<WakeLockStatus>({
    supported: isWakeLockSupported(),
    active: false,
  });

  const stopSoundCallbackRef = useRef<(() => void) | null>(null);
  const lastFiredMinuteRef = useRef<string>('');

  const isDark = settings.theme === 'dark';

  // Synchronize document theme class
  useEffect(() => {
    try {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.backgroundColor = '#0A0A0A';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.backgroundColor = '#FAFAFA';
      }
    } catch {
      // Ignore in non-browser context
    }
  }, [settings.theme]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme as 'light' | 'dark' };
    setSettings(updated);
    saveSettings(updated);
  };

  // Close onboarding and remember
  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    const updated = { ...settings, hasSeenOnboarding: true };
    setSettings(updated);
    saveSettings(updated);
  };

  // Request Wake Lock helper
  const handleRequestWakeLock = useCallback(async () => {
    const hasEnabled = alarms.some((a) => a.enabled);
    if (hasEnabled) {
      const res = await requestWakeLock();
      setWakeLockStatus(res);
    } else {
      await releaseWakeLock();
      setWakeLockStatus({ supported: isWakeLockSupported(), active: false });
    }
  }, [alarms]);

  // Set up Screen Wake Lock & Auto-Reacquire on Visibility Change
  useEffect(() => {
    handleRequestWakeLock();

    const cleanup = setupWakeLockAutoReacquire(() => {
      return alarms.some((a) => a.enabled);
    });

    return () => {
      cleanup();
    };
  }, [handleRequestWakeLock, alarms]);

  // Register Service Worker on mount for offline PWA
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        let isTopWindow = false;
        try {
          isTopWindow = window.self === window.top;
        } catch {
          isTopWindow = false;
        }
        if (isTopWindow) {
          navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('Service Worker registration skipped:', err);
          });
        }
      }
    } catch {
      // Ignore cross-origin iframe security restriction
    }

    // Attempt gentle initial unlock on any first user touch/click
    const handleFirstTouch = () => {
      unlockAudioContext();
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch);
    window.addEventListener('touchstart', handleFirstTouch);

    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  // Main Drift-Corrected Alarm Check Engine (Evaluated roughly every second)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRingingAlarm) return; // Already ringing

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentDay = now.getDay(); // 0 = Sunday
      const timeKey = `${now.toDateString()}-${currentHours}:${currentMinutes}`;

      if (lastFiredMinuteRef.current === timeKey) {
        // Prevent duplicate firing in the same minute
        return;
      }

      const enabledAlarms = alarms.filter((a) => a.enabled);

      for (const alarm of enabledAlarms) {
        const [aHours, aMinutes] = alarm.time.split(':');
        if (aHours === currentHours && aMinutes === currentMinutes) {
          // Check repeat days match
          if (alarm.repeatDays.length === 0 || alarm.repeatDays.includes(currentDay)) {
            lastFiredMinuteRef.current = timeKey;
            triggerAlarm(alarm);
            break;
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, activeRingingAlarm]);

  // Trigger an alarm
  const triggerAlarm = (alarm: Alarm) => {
    // 1. Play procedural sound only if it is a sound-type alarm (video alarms manage their own video/audio stream)
    if (alarm.mediaType !== 'video') {
      const stopAudio = playAlarmSound(alarm.soundId, alarm.volume);
      stopSoundCallbackRef.current = stopAudio;
    }

    // 2. Start vibration if enabled
    if (alarm.vibration) {
      startAlarmVibration();
    }

    // 3. Show system notification
    showAlarmNotification(
      `منبه تابلت: ${alarm.label || 'حان وقت الاستيقاظ!'} ⏰`,
      'اضغط لإيقاف المنبه أو أخذ غفوة للمذاكرة'
    );

    // 4. Request wake lock actively
    requestWakeLock();

    // 5. Open takeover screen
    setActiveRingingAlarm(alarm);
  };

  // Stop Ringing Alarm
  const handleStopRinging = () => {
    if (stopSoundCallbackRef.current) {
      stopSoundCallbackRef.current();
      stopSoundCallbackRef.current = null;
    }
    stopAlarmVibration();

    if (activeRingingAlarm) {
      // If alarm was one-time only (empty repeatDays), disable it
      if (activeRingingAlarm.repeatDays.length === 0) {
        const updated = toggleAlarm(activeRingingAlarm.id, false);
        setAlarms(updated);
      }
    }
    setActiveRingingAlarm(null);
  };

  // Snooze Ringing Alarm
  const handleSnooze = (minutes: number) => {
    if (stopSoundCallbackRef.current) {
      stopSoundCallbackRef.current();
      stopSoundCallbackRef.current = null;
    }
    stopAlarmVibration();

    if (activeRingingAlarm) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + minutes);
      const snoozeHours = now.getHours().toString().padStart(2, '0');
      const snoozeMinutes = now.getMinutes().toString().padStart(2, '0');

      const snoozedAlarm: Alarm = {
        id: generateSafeId(),
        label: `غفوة: ${activeRingingAlarm.label || 'منبه'} (${minutes} دقايق)`,
        time: `${snoozeHours}:${snoozeMinutes}`,
        repeatDays: [],
        enabled: true,
        mediaType: activeRingingAlarm.mediaType || 'sound',
        soundId: activeRingingAlarm.soundId,
        videoId: activeRingingAlarm.videoId,
        customVideoName: activeRingingAlarm.customVideoName,
        volume: activeRingingAlarm.volume,
        snoozeMinutes: minutes,
        vibration: activeRingingAlarm.vibration,
        mathChallenge: activeRingingAlarm.mathChallenge,
        createdAt: new Date().toISOString(),
      };

      const updated = saveAlarm(snoozedAlarm);
      setAlarms(updated);
    }
    setActiveRingingAlarm(null);
  };

  // Alarm CRUD handlers
  const handleSaveAlarm = (alarmToSave: Alarm) => {
    requestNotificationPermission();
    const updated = saveAlarm(alarmToSave);
    setAlarms(updated);
    setEditingAlarm(null);
  };

  const handleToggleAlarm = (id: string) => {
    unlockAudioContext();
    const updated = toggleAlarm(id);
    setAlarms(updated);
  };

  const handleDeleteAlarm = (id: string) => {
    const updated = deleteAlarm(id);
    setAlarms(updated);
  };

  const handleOpenCreateModal = () => {
    unlockAudioContext();
    setEditingAlarm(null);
    setIsAlarmModalOpen(true);
  };

  const handleOpenEditModal = (alarm: Alarm) => {
    unlockAudioContext();
    setEditingAlarm(alarm);
    setIsAlarmModalOpen(true);
  };

  // Test Alarm Handler
  const handleTriggerTestAlarm = (options: {
    mediaType: 'sound' | 'video';
    soundId: SoundType;
    videoId: string;
    mathChallenge: boolean;
  }) => {
    unlockAudioContext();
    const testAlarm: Alarm = {
      id: 'test-alarm',
      label: options.mediaType === 'video' ? 'تجربة منبه الفيديو الفوري 🎬' : 'تجربة النغمة والفحص الفوري ⚡',
      time: '00:00',
      repeatDays: [],
      enabled: true,
      mediaType: options.mediaType,
      soundId: options.soundId,
      videoId: options.videoId,
      volume: 1,
      snoozeMinutes: 5,
      vibration: true,
      mathChallenge: options.mathChallenge,
      createdAt: new Date().toISOString(),
    };
    triggerAlarm(testAlarm);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative ${
        isDark ? 'bg-[#0A0A0A] text-[#F5F5F5] bg-grid-pattern' : 'bg-[#FAFAFA] text-[#0A0A0A] bg-grid-pattern-light'
      }`}
      dir="rtl"
      id="munabbih-app-root"
    >
      {/* Top Application Header */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors ${
          isDark
            ? 'bg-[#0A0A0A]/90 border-white/10'
            : 'bg-white/90 border-black/10 shadow-sm'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <BrandLogo size="md" isDark={isDark} showTagline={true} />

          {/* Header Action Tools with Bold Typographic hierarchy */}
          <div className="flex items-center gap-2.5">
            {/* How It Works Button */}
            <button
              id="header-how-it-works-btn"
              onClick={() => setIsHowItWorksOpen(true)}
              className="px-3 py-2 border border-white/10 dark:border-white/10 hover:border-[#FACC15] text-slate-300 dark:text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.15em] font-bold"
              title="كيف يعمل المنبه والضمانات التقنية"
            >
              <HelpCircle className="w-4 h-4 text-[#FACC15]" />
              <span className="hidden sm:inline">GUIDE // شرح</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={handleToggleTheme}
              className="p-2 border border-white/10 dark:border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-colors"
              title={isDark ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع الليلي'}
              aria-label="تبديل المظهر"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#FACC15]" />
              ) : (
                <Moon className="w-4 h-4 text-[#0A0A0A]" />
              )}
            </button>

            {/* Quick Add Alarm Button in Header */}
            <button
              id="header-add-alarm-btn"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#FACC15] hover:bg-[#e6bb10] active:scale-95 text-black font-cairo font-black text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة منبه</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Main Live Digital Clock with Countdown & Test Trigger */}
        <DigitalClock
          alarms={alarms}
          isDark={isDark}
          onOpenTestModal={() => setIsTestModalOpen(true)}
        />

        {/* Reliability & Hardware Status Strip */}
        <StatusStrip
          alarms={alarms}
          wakeLockStatus={wakeLockStatus}
          onRequestWakeLock={handleRequestWakeLock}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          isDark={isDark}
        />

        {/* Alarms Management Section */}
        <section id="alarms-list-section" className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#FACC15] text-black flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cairo font-black text-xl sm:text-2xl tracking-tight text-[#0A0A0A] dark:text-[#F5F5F5]">
                  المنبهات المضبوطة ({alarms.length})
                </h2>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
                  SYSTEM ALARM REGISTRY
                </div>
              </div>
            </div>

            <button
              id="add-alarm-main-btn"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-transparent hover:bg-white/10 border border-white/20 dark:border-white/20 text-[#0A0A0A] dark:text-[#F5F5F5] active:scale-95 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3] text-[#FACC15]" />
              <span>NEW ALARM +</span>
            </button>
          </div>

          {/* Alarms Grid / List */}
          {alarms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggleAlarm}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteAlarm}
                  isDark={isDark}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 sm:p-14 text-center border border-dashed border-white/15 dark:border-white/15 bg-white/[0.02]">
              <div className="w-16 h-16 bg-[#FACC15]/10 text-[#FACC15] flex items-center justify-center mx-auto mb-4 border border-[#FACC15]/20">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="font-cairo font-black text-xl text-[#0A0A0A] dark:text-white">
                لا يوجد أي منبه مضبوط حالياً
              </h3>
              <p className="text-xs sm:text-sm font-mono opacity-60 mt-1 max-w-sm mx-auto uppercase tracking-wider">
                NO ACTIVE ALARMS // CONFIGURE ALARM FOR FAJR OR MORNING STUDY
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-6 px-6 py-2.5 bg-[#FACC15] hover:bg-[#e6bb10] text-black font-cairo font-black text-sm tracking-wide shadow-md transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول منبه الآن</span>
              </button>
            </div>
          )}
        </section>

        {/* Motivational Card for Thanaweya Amma Students */}
        <section
          id="study-tip-card"
          className={`p-6 border transition-all ${
            isDark
              ? 'bg-[#0F0F0F] border-white/10 text-slate-200'
              : 'bg-white border-black/10 text-[#0A0A0A]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#FACC15] text-black flex items-center justify-center shrink-0 font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-cairo font-black text-base sm:text-lg">
                  نصيحة التفوق لطلاب الثانوية العامة
                </h3>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-[#FACC15]/20 text-[#FACC15] font-bold">
                  EVIDENCE-BASED
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-tajawal mt-2 leading-relaxed max-w-3xl">
                الاستيقاظ المبكر والمذاكرة في ساعات الفجر الأولى (من 4:30 حتى 7:30 صباحاً) يضاعف قدرة الدماغ على تثبيت وحفظ المعادلات والمفاهيم المعقدة بنسبة تتجاوز 40% مقارنة بالسهر الليلي المجهد. اضبط منبهك ونام مطمّن!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Architectural Coordinates and Era markers */}
      <footer
        className={`mt-16 py-8 border-t transition-colors ${
          isDark
            ? 'border-white/10 text-slate-500 bg-[#0A0A0A]'
            : 'border-black/10 text-slate-500 bg-white'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex flex-col gap-1 text-right md:text-right">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">PLATFORM // TARGET</span>
            <span className="text-xs font-mono font-bold text-slate-300">TABLET MOE EGYPT // WEB PWA</span>
          </div>

          <div className="flex flex-col gap-1 text-center items-center">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">CURRENT ERA</span>
            <span className="text-xs font-mono font-bold text-[#FACC15]">THANAWEYA AMMA 2026</span>
          </div>

          <div className="flex flex-col gap-1 text-left md:text-left">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50">PRECISION ENGINE</span>
            <span className="text-xs font-mono text-slate-300">DRIFT-CORRECTED 100% OFFLINE</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => {
          setIsAlarmModalOpen(false);
          setEditingAlarm(null);
        }}
        onSave={handleSaveAlarm}
        initialAlarm={editingAlarm}
        isDark={isDark}
      />

      {activeRingingAlarm && (
        <RingingOverlay
          alarm={activeRingingAlarm}
          onStop={handleStopRinging}
          onSnooze={handleSnooze}
        />
      )}

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
        isDark={isDark}
      />

      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        isDark={isDark}
      />

      <QuickTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onTriggerTestAlarm={handleTriggerTestAlarm}
        isDark={isDark}
      />
    </div>
  );
}
