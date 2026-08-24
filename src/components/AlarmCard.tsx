import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Volume2,
  Brain,
  Edit2,
  Trash2,
  Play,
  Square,
  Film,
  Video,
} from 'lucide-react';
import { Alarm, VideoDefinition } from '../types';
import { SOUND_DEFINITIONS, previewSound } from '../lib/sound';
import { formatTimeRemainingArabic, getNextTriggerDate } from '../lib/storage';
import { getAllVideoDefinitions, getVideoDefinitionById } from '../lib/videoStorage';
import { VideoPreviewModal } from './VideoPreviewModal';

interface AlarmCardProps {
  alarm: Alarm;
  onToggle: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
  isDark: boolean;
}

const DAY_NAMES_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onToggle,
  onEdit,
  onDelete,
  isDark,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewingVideoDef, setPreviewingVideoDef] = useState<VideoDefinition | null>(null);
  const [videoDef, setVideoDef] = useState<VideoDefinition | null>(null);

  const soundDef = SOUND_DEFINITIONS.find((s) => s.id === alarm.soundId) || SOUND_DEFINITIONS[0];

  useEffect(() => {
    if (alarm.mediaType === 'video' && alarm.videoId) {
      getAllVideoDefinitions().then((defs) => {
        const found = getVideoDefinitionById(alarm.videoId!, defs);
        setVideoDef(found);
      });
    }
  }, [alarm.mediaType, alarm.videoId]);

  const handleAudioPreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingPreview) return;
    setIsPlayingPreview(true);
    await previewSound(alarm.soundId, alarm.volume, 2500);
    setIsPlayingPreview(false);
  };

  const handleOpenVideoPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoDef) {
      setPreviewingVideoDef(videoDef);
    }
  };

  const nextTrigger = getNextTriggerDate(alarm);
  const timeRemaining = formatTimeRemainingArabic(nextTrigger);

  const [h, m] = alarm.time.split(':').map(Number);
  const isAm = h < 12;
  const displayHours = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const formatted12h = `${displayHours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  return (
    <>
      <div
        id={`alarm-card-${alarm.id}`}
        className={`group relative rounded-2xl p-5 sm:p-6 transition-all border duration-200 ${
          alarm.enabled
            ? isDark
              ? 'bg-[#0F0F0F] border-white/20 text-[#F5F5F5] shadow-xl'
              : 'bg-white border-black/15 text-[#0A0A0A] shadow-md'
            : isDark
            ? 'bg-[#0A0A0A]/70 border-white/5 opacity-50'
            : 'bg-slate-50 border-black/5 opacity-50'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left Side: Time, Label, Remaining */}
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <span className="font-cairo font-black text-4xl sm:text-5xl tracking-tighter leading-none">
                {alarm.time}
              </span>
              <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-[#FACC15] text-black">
                {isAm ? 'AM' : 'PM'} ({formatted12h})
              </span>
            </div>

            {/* Alarm Label */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="font-cairo font-black text-lg">
                {alarm.label || 'منبه بدون تسمية'}
              </span>
            </div>

            {/* Time Remaining when active */}
            {alarm.enabled && (
              <div className="mt-1 flex items-center gap-2 text-xs font-mono tracking-wider text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>TRIGGER IN {timeRemaining}</span>
              </div>
            )}

            {/* Repeat Days Badges */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 font-mono">
              {alarm.repeatDays.length === 0 ? (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border border-white/10 bg-white/5">
                  ONCE // مرة واحدة
                </span>
              ) : alarm.repeatDays.length === 7 ? (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-[#FACC15] text-black">
                  DAILY // يومياً 🔁
                </span>
              ) : (
                DAY_NAMES_SHORT.map((dayName, idx) => {
                  const isSelected = alarm.repeatDays.includes(idx);
                  return (
                    <span
                      key={dayName}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 border ${
                        isSelected
                          ? 'bg-[#FACC15] text-black border-[#FACC15]'
                          : 'bg-white/5 text-slate-500 border-white/10'
                      }`}
                    >
                      {dayName}
                    </span>
                  );
                })
              )}
            </div>

            {/* Media & Features Meta Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-mono">
              {/* If Video Alarm */}
              {alarm.mediaType === 'video' ? (
                <button
                  type="button"
                  onClick={handleOpenVideoPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FACC15]/10 hover:bg-[#FACC15] hover:text-black border border-[#FACC15]/40 text-[#FACC15] text-[11px] uppercase tracking-wider font-bold transition-all"
                  title="معاينة فيديو المنبه"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>🎬 فيديو: {videoDef ? videoDef.titleAr : alarm.customVideoName || 'سورة يوسف'}</span>
                </button>
              ) : (
                /* Sound Pill & Preview Button */
                <button
                  type="button"
                  onClick={handleAudioPreview}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[11px] uppercase tracking-wider font-bold transition-colors ${
                    isPlayingPreview
                      ? 'bg-[#FACC15] border-[#FACC15] text-black animate-pulse'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                  title="معاينة نغمة المنبه"
                >
                  {isPlayingPreview ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>AUDIO: {soundDef.nameAr}</span>
                </button>
              )}

              {/* Math challenge tag if enabled */}
              {alarm.mathChallenge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-mono uppercase tracking-wider font-bold">
                  <Brain className="w-3 h-3" />
                  <span>MATH LOCK // مسألة ذكاء</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Toggle Switch & Actions */}
          <div className="flex flex-col items-end gap-4 shrink-0">
            {/* Main On/Off Switch */}
            <button
              id={`toggle-alarm-${alarm.id}`}
              onClick={() => onToggle(alarm.id)}
              role="switch"
              aria-checked={alarm.enabled}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer border transition-colors duration-200 ease-in-out focus:outline-none ${
                alarm.enabled
                  ? 'bg-[#FACC15] border-[#FACC15]'
                  : 'bg-white/10 border-white/20'
              }`}
            >
              <span className="sr-only">تفعيل أو إيقاف المنبه</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform bg-black transition duration-200 ease-in-out my-auto ${
                  alarm.enabled ? '-translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>

            {/* Action Buttons: Edit, Delete */}
            <div className="flex items-center gap-1">
              <button
                id={`edit-alarm-${alarm.id}`}
                onClick={() => onEdit(alarm)}
                className="p-2 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-colors"
                title="تعديل المنبه"
                aria-label="تعديل المنبه"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {showDeleteConfirm ? (
                <div className="flex items-center gap-1 bg-red-500/10 p-1 border border-red-500/30">
                  <button
                    id={`confirm-delete-${alarm.id}`}
                    onClick={() => onDelete(alarm.id)}
                    className="px-2.5 py-1 bg-red-500 text-white text-xs font-mono font-bold hover:bg-red-600 transition-colors"
                  >
                    DELETE
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    ESC
                  </button>
                </div>
              ) : (
                <button
                  id={`delete-alarm-${alarm.id}`}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="حذف المنبه"
                  aria-label="حذف المنبه"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={!!previewingVideoDef}
        onClose={() => setPreviewingVideoDef(null)}
        videoDef={previewingVideoDef}
        isDark={isDark}
      />
    </>
  );
};
