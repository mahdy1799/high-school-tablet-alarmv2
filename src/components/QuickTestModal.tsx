import React, { useState, useEffect } from 'react';
import {
  Flame,
  Volume2,
  Film,
  Play,
  Clock,
  X,
  Sparkles,
} from 'lucide-react';
import { AlarmMediaType, SoundType, VideoDefinition } from '../types';
import { SOUND_DEFINITIONS } from '../lib/sound';
import { getAllVideoDefinitions, PRESET_VIDEOS } from '../lib/videoStorage';

interface QuickTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTestAlarm: (options: {
    mediaType: AlarmMediaType;
    soundId: SoundType;
    videoId: string;
    mathChallenge: boolean;
  }) => void;
  isDark: boolean;
}

export const QuickTestModal: React.FC<QuickTestModalProps> = ({
  isOpen,
  onClose,
  onTriggerTestAlarm,
  isDark,
}) => {
  const [mediaType, setMediaType] = useState<AlarmMediaType>('video');
  const [selectedSound, setSelectedSound] = useState<SoundType>('classic');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('preset-yusuf');
  const [testMathChallenge, setTestMathChallenge] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [videoList, setVideoList] = useState<VideoDefinition[]>(PRESET_VIDEOS);

  useEffect(() => {
    if (isOpen) {
      getAllVideoDefinitions().then(setVideoList).catch(console.warn);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: number | null = null;
    if (countdown !== null && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      onClose();
      onTriggerTestAlarm({
        mediaType,
        soundId: selectedSound,
        videoId: selectedVideoId,
        mathChallenge: testMathChallenge,
      });
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, onClose, onTriggerTestAlarm, mediaType, selectedSound, selectedVideoId, testMathChallenge]);

  if (!isOpen) return null;

  const handleStartImmediate = () => {
    onClose();
    onTriggerTestAlarm({
      mediaType,
      soundId: selectedSound,
      videoId: selectedVideoId,
      mathChallenge: testMathChallenge,
    });
  };

  const handleStart5s = () => {
    setCountdown(5);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      id="test-modal-backdrop"
      dir="rtl"
    >
      <div
        id="test-modal-container"
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-7 my-8 border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#0F0F0F] border-white/15 text-[#F5F5F5]'
            : 'bg-white border-black/15 text-[#0A0A0A]'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10 dark:border-white/10">
          <div className="w-11 h-11 bg-[#FACC15] text-black flex items-center justify-center font-bold shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-cairo font-black text-xl">
              فحص وتجربة المنبه // TEST
            </h2>
            <p className="text-[11px] font-mono uppercase tracking-wider opacity-60">
              TEST FULLSCREEN VIDEO & AUDIO ENGINE
            </p>
          </div>
        </div>

        {countdown !== null ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-[#FACC15] text-black font-mono font-black text-5xl flex items-center justify-center shadow-2xl mb-3">
              {countdown}
            </div>
            <p className="font-cairo font-black text-lg text-white">
              جاري تشغيل المنبه التجريبي...
            </p>
            <p className="text-xs font-mono uppercase tracking-wider opacity-60 mt-1">
              COUNTDOWN ACTIVE // STAND BY
            </p>
            <button
              onClick={() => setCountdown(null)}
              className="mt-4 px-4 py-1.5 border border-white/20 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white"
            >
              ABORT // إلغاء
            </button>
          </div>
        ) : (
          <div className="my-5 space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`py-2.5 px-3 border font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mediaType === 'video'
                    ? 'bg-[#FACC15] text-black border-[#FACC15]'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>منبه فيديو 🎬</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('sound')}
                className={`py-2.5 px-3 border font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  mediaType === 'sound'
                    ? 'bg-[#FACC15] text-black border-[#FACC15]'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>نغمة صوتية 🎵</span>
              </button>
            </div>

            {/* Video List if video */}
            {mediaType === 'video' ? (
              <div>
                <label className="block text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2 opacity-70">
                  CHOOSE VIDEO // اختر الفيديو:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {videoList.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVideoId(v.id)}
                      className={`p-2.5 border cursor-pointer text-xs font-tajawal flex items-center justify-between transition-colors ${
                        selectedVideoId === v.id
                          ? 'bg-[#FACC15]/20 border-[#FACC15] text-white font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white">{v.titleAr}</div>
                        <div className="text-[11px] text-slate-400">{v.subtitleAr}</div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-black/40 text-[#FACC15]">
                        {v.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Sound Selector for Test */
              <div>
                <label className="block text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2 opacity-70">
                  SELECT TONE // النغمة المراد تجربتها:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SOUND_DEFINITIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSound(s.id)}
                      className={`py-2 px-2 font-mono text-xs font-bold transition-all border text-center ${
                        selectedSound === s.id
                          ? 'bg-[#FACC15] text-black border-[#FACC15]'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {s.nameAr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Test math challenge checkbox */}
            <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider font-bold">
                MATH CHALLENGE // مسألة ذكاء
              </span>
              <input
                type="checkbox"
                checked={testMathChallenge}
                onChange={(e) => setTestMathChallenge(e.target.checked)}
                className="w-4 h-4 accent-[#FACC15] cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                id="start-immediate-test-btn"
                onClick={handleStartImmediate}
                className="w-full py-3.5 px-4 bg-[#FACC15] hover:bg-[#e6bb10] active:scale-95 text-black font-mono uppercase tracking-[0.2em] font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>TRIGGER NOW // رنين فوري</span>
              </button>

              <button
                id="start-5s-test-btn"
                onClick={handleStart5s}
                className="w-full py-3.5 px-4 bg-transparent hover:bg-white/10 border border-white/20 active:scale-95 text-white font-mono uppercase tracking-[0.2em] font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>TRIGGER IN 5 SEC (LOCK TEST)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
