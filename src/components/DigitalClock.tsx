import React, { useState, useEffect } from 'react';
import { Bell, Flame, Sparkles } from 'lucide-react';
import { Alarm } from '../types';
import { formatTimeRemainingArabic, getEarliestNextAlarm } from '../lib/storage';

interface DigitalClockProps {
  alarms: Alarm[];
  isDark: boolean;
  onOpenTestModal: () => void;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  alarms,
  isDark,
  onOpenTestModal,
}) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const isAm = hours < 12;

  // Arabic date formatter
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const arabicDateString = new Intl.DateTimeFormat('ar-EG', dateOptions).format(time);

  const nextAlarmInfo = getEarliestNextAlarm(alarms);

  return (
    <div
      id="main-digital-clock"
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 transition-all duration-300 border ${
        isDark
          ? 'bg-[#0F0F0F] border-white/10 text-[#F5F5F5] shadow-2xl'
          : 'bg-white border-black/10 text-[#0A0A0A] shadow-xl'
      }`}
    >
      {/* Background Architectural Watermark Typography */}
      <div className="absolute -bottom-6 -right-6 text-[120px] sm:text-[160px] font-black tracking-tighter opacity-[0.03] select-none pointer-events-none font-mono">
        ALARM
      </div>
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-white/[0.04] dark:bg-white/[0.04] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-white/[0.04] dark:bg-white/[0.04] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Top Technical Metadata Header */}
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-white/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#FACC15] font-bold">
              REAL-TIME CLOCK // CAIRO
            </span>
          </div>

          <div className="text-[11px] sm:text-xs font-mono tracking-wider opacity-70">
            {arabicDateString}
          </div>
        </div>

        {/* Big Bold Display Clock */}
        <div className="flex items-baseline justify-center gap-2 sm:gap-4 my-2">
          <div className="flex items-center font-cairo font-black text-6xl sm:text-8xl md:text-9xl tracking-tighter leading-none">
            <span className={isDark ? 'text-[#F5F5F5]' : 'text-[#0A0A0A]'}>{formattedHours}</span>
            <span className="text-[#FACC15] px-1 animate-pulse">:</span>
            <span className={isDark ? 'text-[#F5F5F5]' : 'text-[#0A0A0A]'}>{formattedMinutes}</span>
            <span className="text-[#FACC15] px-1 animate-pulse">:</span>
            <span className="font-mono text-3xl sm:text-5xl md:text-6xl text-stroke-light dark:text-stroke-light font-black tracking-tight w-16 sm:w-28 text-right opacity-90">
              {formattedSeconds}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-mono font-black px-2 py-1 bg-[#FACC15] text-black uppercase tracking-[0.2em]">
              {isAm ? 'AM // ص' : 'PM // م'}
            </span>
          </div>
        </div>

        {/* Architectural Progress Indicator */}
        <div className="w-full max-w-md my-4 flex flex-col gap-1.5">
          <div className="w-full h-1 bg-white/10 overflow-hidden rounded-none flex">
            <div
              className="h-full bg-[#FACC15] transition-all duration-1000"
              style={{ width: `${((seconds + 1) / 60) * 100}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] opacity-40">
            <span>SEC {formattedSeconds} / 60</span>
            <span>SYSTEM READY</span>
          </div>
        </div>

        {/* Next Alarm Info / Architectural Card */}
        <div className="mt-2 w-full max-w-lg">
          {nextAlarmInfo ? (
            <div
              className={`flex items-center justify-between p-4 border transition-all ${
                isDark
                  ? 'bg-white/[0.03] border-white/15 text-[#F5F5F5]'
                  : 'bg-black/[0.02] border-black/10 text-[#0A0A0A]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FACC15] text-black flex items-center justify-center font-bold shrink-0">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div className="text-right">
                  <div className="font-cairo font-black text-base sm:text-lg flex items-center gap-2">
                    <span>المنبه القادم:</span>
                    <span className="text-[#FACC15] font-mono">{nextAlarmInfo.alarm.time}</span>
                  </div>
                  <div className="text-xs font-mono opacity-70 tracking-wide">
                    {formatTimeRemainingArabic(nextAlarmInfo.triggerDate, time)} • {nextAlarmInfo.alarm.label || 'بدون تسمية'}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
          ) : (
            <div className="p-3 border border-dashed border-white/15 dark:border-white/15 text-xs font-mono tracking-wider opacity-60">
              NO ALARMS ARMED // STANDBY MODE
            </div>
          )}
        </div>

        {/* Quick Test Alarm Trigger */}
        <div className="mt-5 flex items-center gap-3">
          <button
            id="test-alarm-trigger-btn"
            onClick={onOpenTestModal}
            className={`inline-flex items-center gap-2 px-5 py-2.5 bg-transparent active:scale-95 transition-all text-xs font-mono uppercase tracking-[0.2em] font-bold border ${
              isDark
                ? 'border-white/20 hover:bg-white/10 text-white'
                : 'border-black/20 hover:bg-black/5 text-black'
            }`}
          >
            <Flame className="w-4 h-4 text-[#FACC15]" />
            <span>TEST SYSTEM // تجربة فورية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
