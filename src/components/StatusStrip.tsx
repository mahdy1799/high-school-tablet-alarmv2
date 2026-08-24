import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Volume2,
  VolumeX,
  Lock,
  WifiOff,
  HelpCircle,
} from 'lucide-react';
import { Alarm, BatteryState, WakeLockStatus } from '../types';
import { isAudioReady, unlockAudioContext } from '../lib/sound';

interface StatusStripProps {
  alarms: Alarm[];
  wakeLockStatus: WakeLockStatus;
  onRequestWakeLock: () => void;
  onOpenHowItWorks: () => void;
  isDark: boolean;
}

export const StatusStrip: React.FC<StatusStripProps> = ({
  alarms,
  wakeLockStatus,
  onRequestWakeLock,
  onOpenHowItWorks,
  isDark,
}) => {
  const [battery, setBattery] = useState<BatteryState>({
    supported: false,
    level: 1,
    charging: true,
  });
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(isAudioReady());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const enabledCount = alarms.filter((a) => a.enabled).length;

  useEffect(() => {
    // Battery Status API (standard on Chrome/Android)
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      // @ts-expect-error Battery API
      navigator.getBattery().then((batt: any) => {
        const updateBatt = () => {
          setBattery({
            supported: true,
            level: batt.level,
            charging: batt.charging,
          });
        };
        updateBatt();
        batt.addEventListener('levelchange', updateBatt);
        batt.addEventListener('chargingchange', updateBatt);
      }).catch(() => {});
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setAudioUnlocked(isAudioReady());
    }, 1500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleAudioUnlockClick = async () => {
    await unlockAudioContext();
    setAudioUnlocked(isAudioReady());
  };

  const isLowBattery = battery.supported && battery.level <= 0.2 && !battery.charging;

  return (
    <div
      id="reliability-status-strip"
      className={`rounded-2xl p-4 sm:p-5 transition-all border ${
        isDark
          ? 'bg-[#0F0F0F] border-white/10 text-[#F5F5F5]'
          : 'bg-white border-black/10 text-[#0A0A0A] shadow-sm'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Main Status Headline */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 flex items-center justify-center shrink-0 border ${
              enabledCount > 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30'
            }`}
          >
            {enabledCount > 0 ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 font-cairo font-black text-sm sm:text-base">
              <span>
                {enabledCount > 0
                  ? `المنبه شغال ومؤمّن (${enabledCount} منبه نشط)`
                  : 'في وضع الاستعداد — اضبط منبهك للمذاكرة'}
              </span>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider opacity-60">
              SYS MONITOR // KEEP TAB OPEN FOR GUARANTEED WAKE
            </div>
          </div>
        </div>

        {/* Indicators Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs font-mono">
          {/* Wake Lock Indicator */}
          <button
            id="status-wakelock-pill"
            onClick={onRequestWakeLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 border uppercase tracking-wider text-[11px] font-bold transition-all ${
              wakeLockStatus.active
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title="Screen Wake Lock يمنع إغلاق شاشة التابلت أثناء تفعيل المنبه"
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{wakeLockStatus.active ? 'WAKE LOCK: ACTIVE' : 'WAKE LOCK: RE-ARM'}</span>
          </button>

          {/* Audio Autoplay Indicator */}
          <button
            id="status-audio-pill"
            onClick={handleAudioUnlockClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 border uppercase tracking-wider text-[11px] font-bold transition-all ${
              audioUnlocked
                ? 'bg-[#FACC15]/10 border-[#FACC15]/30 text-[#FACC15]'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse hover:bg-amber-500/20'
            }`}
            title="حالة ترخيص الصوت في المتصفح"
          >
            {audioUnlocked ? <Volume2 className="w-3.5 h-3.5 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 shrink-0" />}
            <span>{audioUnlocked ? 'AUDIO: UNLOCKED' : 'AUDIO: UNLOCK'}</span>
          </button>

          {/* Battery Status Indicator */}
          {battery.supported && (
            <div
              id="status-battery-pill"
              className={`flex items-center gap-1.5 px-3 py-1.5 border uppercase tracking-wider text-[11px] font-bold ${
                isLowBattery
                  ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-bounce'
                  : battery.charging
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 opacity-80'
              }`}
            >
              {battery.charging ? (
                <BatteryCharging className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              ) : isLowBattery ? (
                <BatteryWarning className="w-3.5 h-3.5 shrink-0 text-red-400" />
              ) : (
                <Battery className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                BATT {Math.round(battery.level * 100)}% {battery.charging ? '(CHRG)' : ''}
              </span>
            </div>
          )}

          {/* Offline Ready Pill */}
          <div
            id="status-offline-pill"
            className="flex items-center gap-1.5 px-3 py-1.5 border bg-white/5 border-white/10 opacity-70 uppercase tracking-wider text-[11px]"
            title="المنبه مبرمج ليعمل ذاتياً بدون الحاجة للإنترنت"
          >
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>OFFLINE PWA</span>
          </div>

          {/* How It Works Button */}
          <button
            id="how-it-works-btn"
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#FACC15]/40 bg-[#FACC15]/10 text-[#FACC15] hover:bg-[#FACC15]/20 uppercase tracking-wider text-[11px] font-bold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>INFO // شرح</span>
          </button>
        </div>
      </div>

      {/* Battery Warning Banner if low & not charging */}
      {isLowBattery && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono flex items-center gap-2">
          <BatteryWarning className="w-4 h-4 shrink-0 text-red-400" />
          <span>
            CRITICAL BATTERY ({Math.round(battery.level * 100)}%): Connect tablet charger before sleeping to ensure alarm sounds.
          </span>
        </div>
      )}
    </div>
  );
};
