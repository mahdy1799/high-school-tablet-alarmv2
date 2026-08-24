import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Brain,
  XCircle,
  Film,
} from 'lucide-react';
import { Alarm, MathChallengeProblem, VideoDefinition } from '../types';
import { generateMathProblem } from '../lib/mathChallenge';
import { getAllVideoDefinitions, getVideoDefinitionById } from '../lib/videoStorage';
import { AlarmVideoDisplay } from './AlarmVideoDisplay';

interface RingingOverlayProps {
  alarm: Alarm;
  onStop: () => void;
  onSnooze: (minutes: number) => void;
}

export const RingingOverlay: React.FC<RingingOverlayProps> = ({
  alarm,
  onStop,
  onSnooze,
}) => {
  const [mathProblem, setMathProblem] = useState<MathChallengeProblem | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [mathError, setMathError] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [videoDef, setVideoDef] = useState<VideoDefinition | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    if (alarm.mathChallenge) {
      setMathProblem(generateMathProblem());
    }

    if (alarm.mediaType === 'video' && alarm.videoId) {
      getAllVideoDefinitions().then((defs) => {
        const found = getVideoDefinitionById(alarm.videoId!, defs);
        setVideoDef(found);
      });
    }

    const updateNow = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    updateNow();
    const interval = setInterval(updateNow, 1000);
    return () => clearInterval(interval);
  }, [alarm]);

  const handleMathAnswer = (option: number) => {
    if (!mathProblem) return;
    setSelectedOption(option);

    if (option === mathProblem.answer) {
      setMathError(false);
      setTimeout(() => {
        onStop();
      }, 300);
    } else {
      setMathError(true);
      setTimeout(() => {
        setMathProblem(generateMathProblem());
        setSelectedOption(null);
        setMathError(false);
      }, 700);
    }
  };

  const handleDirectStop = () => {
    if (alarm.mathChallenge) {
      return;
    }
    onStop();
  };

  const isVideoAlarm = alarm.mediaType === 'video' && videoDef !== null;

  return (
    <div
      id="ringing-takeover-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-[#0A0A0A] text-[#F5F5F5] select-none overflow-y-auto"
      dir="rtl"
    >
      {/* If Video Alarm: Fullscreen Immersive Video Display */}
      {isVideoAlarm ? (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AlarmVideoDisplay
            videoDef={videoDef}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            showControls={true}
            autoplay={true}
            className="w-full h-full"
          />
          {/* Subtle gradient vignette at top and bottom to ensure text and buttons stand out */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/80 pointer-events-none" />
        </div>
      ) : (
        /* Background Architectural Grid Lines for Sound Alarms */
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden bg-grid-pattern">
          <div className="w-[600px] h-[600px] border border-white/10 animate-ping duration-1000" />
          <div className="w-[400px] h-[400px] border border-[#FACC15]/30 animate-pulse" />
        </div>
      )}

      {/* Top Header Tag */}
      <div className="relative z-10 text-center mt-2 sm:mt-4">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#FACC15] text-black font-mono font-black text-xs sm:text-sm uppercase tracking-[0.25em] animate-bounce shadow-2xl">
          {isVideoAlarm ? <Film className="w-4 h-4 text-black" /> : <BellRing className="w-4 h-4 text-black" />}
          <span>{isVideoAlarm ? 'VIDEO ALARM // استيقظ الآن' : 'CRITICAL ALARM // استيقظ الآن'}</span>
        </div>
      </div>

      {/* Center Hero Clock & Information / Math Box */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto max-w-lg w-full">
        {/* Current Time Digits with Big Bold Display */}
        <div className="font-cairo font-black text-5xl sm:text-7xl md:text-8xl tracking-tighter leading-none text-white my-3 drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
          {currentTime || alarm.time}
        </div>

        {/* Alarm Title / Subject Badge */}
        <div className="w-full p-4 border border-white/20 bg-black/75 backdrop-blur-md text-center shadow-2xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#FACC15] font-bold mb-1">
            {isVideoAlarm ? `ACTIVE VIDEO: ${videoDef.titleAr}` : 'SCHEDULED EVENT'}
          </div>
          <h1 className="font-cairo font-black text-xl sm:text-2xl text-white">
            {alarm.label || 'منبه المذاكرة والامتحانات'}
          </h1>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-300 mt-1">
            TARGET ACHIEVED // TIME FOR ACTION
          </p>
        </div>

        {/* Math Challenge Box if enabled */}
        {alarm.mathChallenge && mathProblem && (
          <div className="mt-4 w-full p-5 bg-[#0F0F0F]/95 border-2 border-[#FACC15] shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2">
              <span className="text-[#FACC15] flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>BRAIN WAKE LOCK // حل المسألة للإيقاف:</span>
              </span>
              <span className="px-2 py-0.5 bg-[#FACC15]/20 text-[#FACC15]">ACTIVE</span>
            </div>

            <div className="text-3xl sm:text-4xl font-mono font-black text-white text-center py-2">
              {mathProblem.question} = ?
            </div>

            {mathError && (
              <div className="text-red-400 font-mono text-xs font-bold text-center mb-2 flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>WRONG ANSWER // إجابة خاطئة! جرب مسألة جديدة</span>
              </div>
            )}

            {/* Answer Options Grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              {mathProblem.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMathAnswer(option)}
                  className="py-3 px-4 bg-white/10 hover:bg-[#FACC15] hover:text-black border border-white/20 font-mono font-black text-xl text-white transition-all active:scale-95 shadow-md"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Controls (Huge Touch Targets) */}
      <div className="relative z-10 w-full max-w-lg pb-4 sm:pb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Snooze Button */}
        <button
          id="ringing-snooze-btn"
          onClick={() => onSnooze(alarm.snoozeMinutes || 5)}
          className="flex-1 py-4 sm:py-5 px-6 bg-black/60 hover:bg-white/15 active:scale-95 border border-white/30 text-white font-mono uppercase tracking-[0.2em] font-bold text-xs sm:text-sm backdrop-blur-md transition-all text-center shadow-xl"
        >
          SNOOZE ({alarm.snoozeMinutes || 5} MIN) // غفوة
        </button>

        {/* Stop Button */}
        {!alarm.mathChallenge ? (
          <button
            id="ringing-stop-btn"
            onClick={handleDirectStop}
            className="flex-1 py-4 sm:py-5 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-mono uppercase tracking-[0.2em] font-black text-sm sm:text-base transition-all shadow-2xl text-center"
          >
            DISMISS // إيقاف المنبه
          </button>
        ) : (
          <div className="flex-1 py-4 px-4 bg-black/70 border border-white/20 text-center text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center justify-center backdrop-blur-md">
            SOLVE MATH TO DISMISS ☝️
          </div>
        )}
      </div>
    </div>
  );
};
