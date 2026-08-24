import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Volume2,
  Play,
  Brain,
  Vibrate,
  Calendar,
  Check,
  Video,
  Upload,
  Sparkles,
  Trash2,
  Film,
} from 'lucide-react';
import { Alarm, AlarmMediaType, SoundType, VideoDefinition } from '../types';
import { generateSafeId } from '../lib/id';
import { SOUND_DEFINITIONS, previewSound, unlockAudioContext } from '../lib/sound';
import {
  getAllVideoDefinitions,
  saveCustomVideo,
  deleteCustomVideo,
  PRESET_VIDEOS,
} from '../lib/videoStorage';
import { VideoPreviewModal } from './VideoPreviewModal';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alarm: Alarm) => void;
  initialAlarm?: Alarm | null;
  isDark: boolean;
}

const DAY_LABELS = [
  { day: 0, name: 'الأحد' },
  { day: 1, name: 'الإثنين' },
  { day: 2, name: 'الثلاثاء' },
  { day: 3, name: 'الأربعاء' },
  { day: 4, name: 'الخميس' },
  { day: 5, name: 'الجمعة' },
  { day: 6, name: 'السبت' },
];

const PRESETS = [
  { label: 'صلاة الفجر والمذاكرة 🌅', time: '04:30' },
  { label: 'جلسة تركيز صباحية 📚', time: '06:00' },
  { label: 'مراجعة فيزياء / كيمياء ⚡', time: '07:30' },
  { label: 'قيلولة سريعة 30 دقيقة 💤', offsetMinutes: 30 },
];

export const AlarmModal: React.FC<AlarmModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAlarm,
  isDark,
}) => {
  const [time, setTime] = useState<string>(initialAlarm ? initialAlarm.time : '06:00');
  const [label, setLabel] = useState<string>(initialAlarm ? initialAlarm.label : '');
  const [repeatDays, setRepeatDays] = useState<number[]>(
    initialAlarm ? initialAlarm.repeatDays : [0, 1, 2, 3, 4, 5, 6]
  );
  const [mediaType, setMediaType] = useState<AlarmMediaType>(
    initialAlarm?.mediaType || 'video'
  );
  const [videoId, setVideoId] = useState<string>(
    initialAlarm?.videoId || 'preset-yusuf'
  );
  const [soundId, setSoundId] = useState<SoundType>(
    initialAlarm ? initialAlarm.soundId : 'classic'
  );
  const [volume, setVolume] = useState<number>(initialAlarm ? initialAlarm.volume : 1);
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(
    initialAlarm ? initialAlarm.snoozeMinutes : 5
  );
  const [vibration, setVibration] = useState<boolean>(
    initialAlarm ? initialAlarm.vibration : true
  );
  const [mathChallenge, setMathChallenge] = useState<boolean>(
    initialAlarm ? initialAlarm.mathChallenge : false
  );

  const [availableVideos, setAvailableVideos] = useState<VideoDefinition[]>(PRESET_VIDEOS);
  const [previewingVideo, setPreviewingVideo] = useState<VideoDefinition | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load all custom videos from IndexedDB
  const refreshVideos = async () => {
    try {
      const all = await getAllVideoDefinitions();
      setAvailableVideos(all);
    } catch (err) {
      console.warn('Failed to load videos:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshVideos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day].sort());
    }
  };

  const setAllDays = () => setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
  const setSchoolDays = () => setRepeatDays([0, 1, 2, 3, 4]);
  const setOnceOnly = () => setRepeatDays([]);

  const handlePreviewSound = async (sId: SoundType) => {
    await previewSound(sId, volume, 2500);
  };

  const handleQuickPreset = (preset: { label: string; time?: string; offsetMinutes?: number }) => {
    setLabel(preset.label);
    if (preset.time) {
      setTime(preset.time);
    } else if (preset.offsetMinutes) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + preset.offsetMinutes);
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTime(`${h}:${m}`);
      setOnceOnly();
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const saved = await saveCustomVideo(file);
      await refreshVideos();
      setVideoId(saved.id);
      setMediaType('video');
      setUploadSuccessMsg(`تم حفظ الفيديو "${saved.name}" في ذاكرة التابلت بنجاح!`);
      setTimeout(() => setUploadSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('تعذر حفظ الفيديو، يرجى المحاولة بملف فيديو أصغر');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomVideo = async (vId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا الفيديو المخصص؟')) {
      await deleteCustomVideo(vId);
      if (videoId === vId) {
        setVideoId('preset-yusuf');
      }
      await refreshVideos();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await unlockAudioContext();

    const currentVideoDef = availableVideos.find((v) => v.id === videoId);

    const alarmToSave: Alarm = {
      id: initialAlarm ? initialAlarm.id : generateSafeId(),
      label: label.trim() || 'منبه المذاكرة',
      time,
      repeatDays,
      enabled: true,
      mediaType,
      soundId,
      videoId,
      customVideoName: currentVideoDef?.titleAr,
      volume,
      snoozeMinutes,
      vibration,
      mathChallenge,
      createdAt: initialAlarm ? initialAlarm.createdAt : new Date().toISOString(),
    };

    onSave(alarmToSave);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
        id="alarm-modal-backdrop"
        onClick={onClose}
      >
        <div
          id="alarm-modal-container"
          className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 my-8 transition-all border shadow-2xl ${
            isDark
              ? 'bg-[#0F0F0F] border-white/15 text-[#F5F5F5]'
              : 'bg-white border-black/15 text-[#0A0A0A]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FACC15] text-black flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cairo font-black text-xl">
                  {initialAlarm ? 'تعديل المنبه' : 'ضبط منبه جديد'}
                </h2>
                <p className="text-[11px] font-mono uppercase tracking-wider opacity-60">
                  CONFIG // VIDEO & AUDIO ALARM
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-colors"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-6">
            {/* Main Time Selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2 opacity-70">
                TARGET TIME // وقت الاستيقاظ
              </label>
              <div className="flex items-center justify-center gap-3 p-5 bg-white/[0.03] border border-white/15">
                <input
                  type="time"
                  id="alarm-time-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="font-cairo font-black text-5xl sm:text-6xl text-center bg-transparent text-[#0A0A0A] dark:text-[#F5F5F5] focus:outline-none cursor-pointer tracking-wider"
                />
              </div>

              {/* Quick Presets */}
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPreset(p)}
                    className="text-xs font-mono px-3 py-1 bg-white/5 hover:bg-[#FACC15] hover:text-black transition-colors border border-white/10"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alarm Label / Subject Name */}
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2 opacity-70"
                htmlFor="alarm-label-input"
              >
                LABEL // اسم المادة أو الهدف
              </label>
              <input
                type="text"
                id="alarm-label-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثال: مراجعة فيزياء، صلاة الفجر، سورة يوسف..."
                className="w-full px-4 py-3 bg-white/5 border border-white/15 font-tajawal text-sm text-[#0A0A0A] dark:text-white placeholder-slate-500 focus:border-[#FACC15] focus:outline-none"
              />
            </div>

            {/* Media Type Switch: Video Alarm vs. Tone Alarm */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2 opacity-70">
                ALARM TYPE // نوع التنبيه
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="alarm-type-video-btn"
                  onClick={() => setMediaType('video')}
                  className={`p-4 border text-right transition-all flex items-start gap-3 ${
                    mediaType === 'video'
                      ? 'bg-[#FACC15] text-black border-[#FACC15] shadow-lg'
                      : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 ${mediaType === 'video' ? 'bg-black text-[#FACC15]' : 'bg-white/10 text-white'}`}>
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-cairo font-black text-sm">
                      منبه بالفيديو 🎬
                    </div>
                    <div className={`text-[11px] font-tajawal mt-0.5 ${mediaType === 'video' ? 'text-black/80 font-bold' : 'text-slate-400'}`}>
                      تشغيل فيديو كامل مع الصوت
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  id="alarm-type-sound-btn"
                  onClick={() => setMediaType('sound')}
                  className={`p-4 border text-right transition-all flex items-start gap-3 ${
                    mediaType === 'sound'
                      ? 'bg-[#FACC15] text-black border-[#FACC15] shadow-lg'
                      : 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 ${mediaType === 'sound' ? 'bg-black text-[#FACC15]' : 'bg-white/10 text-white'}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-cairo font-black text-sm">
                      نغمة صوتية فقط 🎵
                    </div>
                    <div className={`text-[11px] font-tajawal mt-0.5 ${mediaType === 'sound' ? 'text-black/80 font-bold' : 'text-slate-400'}`}>
                      جرس تخليقي بدون فيديو
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* IF VIDEO SELECTED: Video Gallery & Custom Upload */}
            {mediaType === 'video' && (
              <div className="space-y-4 p-4 border border-[#FACC15]/30 bg-[#FACC15]/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#FACC15] flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    <span>SELECT VIDEO // اختر الفيديو المطلوب:</span>
                  </label>

                  {/* Upload video from tablet */}
                  <label
                    htmlFor="custom-video-upload"
                    className="cursor-pointer px-3 py-1.5 bg-[#FACC15] hover:bg-[#e6bb10] text-black font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'جاري الحفظ...' : 'رفع فيديو من التابلت 📁'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="custom-video-upload"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadSuccessMsg && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs font-tajawal flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}

                {/* Video Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {availableVideos.map((vid) => {
                    const isSelected = videoId === vid.id;
                    return (
                      <div
                        key={vid.id}
                        onClick={() => setVideoId(vid.id)}
                        className={`relative p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#FACC15]/20 border-[#FACC15] ring-1 ring-[#FACC15]'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-black/40 border border-white/10 text-[#FACC15] font-bold">
                              {vid.category.toUpperCase()}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 bg-[#FACC15] text-black flex items-center justify-center text-xs font-bold">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          <div className="font-cairo font-black text-sm text-white mb-0.5">
                            {vid.titleAr}
                          </div>
                          <div className="text-xs text-slate-400 font-tajawal line-clamp-2">
                            {vid.subtitleAr}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                          {/* Preview Video Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewingVideo(vid);
                            }}
                            className="px-2.5 py-1 border border-[#FACC15]/40 hover:bg-[#FACC15] hover:text-black text-[#FACC15] text-xs font-mono transition-all flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>معاينة الفيديو 👁️</span>
                          </button>

                          {/* If custom video: allow delete */}
                          {!vid.isPreset && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomVideo(vid.id, e)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                              title="حذف الفيديو المخصص"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* IF SOUND SELECTED: Synth Sounds */}
            {mediaType === 'sound' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2 flex items-center gap-1.5 opacity-70">
                  <Volume2 className="w-4 h-4 text-[#FACC15]" />
                  <span>SYNTH AUDIO TONE // نغمة الرنين</span>
                </label>
                <div className="space-y-2">
                  {SOUND_DEFINITIONS.map((s) => {
                    const isSelected = soundId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSoundId(s.id)}
                        className={`flex items-center justify-between p-3.5 border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#FACC15]/10 border-[#FACC15] text-[#0A0A0A] dark:text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 border flex items-center justify-center ${
                              isSelected
                                ? 'border-[#FACC15] bg-[#FACC15]'
                                : 'border-slate-500'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 bg-black" />}
                          </div>
                          <div>
                            <div className="font-cairo font-black text-sm flex items-center gap-2">
                              <span>{s.nameAr}</span>
                              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-white/10 text-slate-300">
                                {s.tag}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-tajawal mt-0.5">
                              {s.descriptionAr}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewSound(s.id);
                          }}
                          className="px-3 py-1.5 border border-white/15 bg-white/5 hover:bg-[#FACC15] hover:text-black text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>LISTEN</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Repeat Days Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-[0.2em] font-bold flex items-center gap-1.5 opacity-70">
                  <Calendar className="w-4 h-4 text-[#FACC15]" />
                  <span>REPEAT DAYS // التكرار</span>
                </label>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={setAllDays}
                    className="px-2 py-0.5 border border-white/10 hover:border-[#FACC15] text-slate-300"
                  >
                    ALL
                  </button>
                  <button
                    type="button"
                    onClick={setSchoolDays}
                    className="px-2 py-0.5 border border-white/10 hover:border-[#FACC15] text-slate-300"
                  >
                    STUDY
                  </button>
                  <button
                    type="button"
                    onClick={setOnceOnly}
                    className="px-2 py-0.5 border border-white/10 hover:border-[#FACC15] text-slate-300"
                  >
                    ONCE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 font-mono">
                {DAY_LABELS.map(({ day, name }) => {
                  const isSelected = repeatDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-2.5 px-1 font-mono text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-[#FACC15] text-black border-[#FACC15]'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Snooze & Vibration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
              <div>
                <label className="block text-xs font-mono uppercase tracking-[0.2em] font-bold mb-2 opacity-70">
                  SNOOZE // مدة الغفوة
                </label>
                <select
                  value={snoozeMinutes}
                  onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/15 text-sm font-mono text-[#0A0A0A] dark:text-white focus:outline-none"
                >
                  <option value={3} className="bg-[#0A0A0A] text-white">
                    3 MINUTES
                  </option>
                  <option value={5} className="bg-[#0A0A0A] text-white">
                    5 MINUTES (RECOMMENDED)
                  </option>
                  <option value={10} className="bg-[#0A0A0A] text-white">
                    10 MINUTES
                  </option>
                  <option value={15} className="bg-[#0A0A0A] text-white">
                    15 MINUTES
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/15">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-[#FACC15]" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold">
                    VIBRATION // اهتزاز
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={vibration}
                  onChange={(e) => setVibration(e.target.checked)}
                  className="w-4 h-4 accent-[#FACC15] cursor-pointer"
                />
              </div>
            </div>

            {/* Math Challenge Switch */}
            <div className="p-4 bg-[#FACC15]/5 border border-[#FACC15]/20 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#FACC15] text-black flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-cairo font-black text-sm text-[#FACC15]">
                    تحدي الرياضيات الذهنية لإيقاف المنبه
                  </div>
                  <div className="text-xs text-slate-400 font-tajawal mt-1">
                    لن يتوقف المنبه إلا بعد حل مسألة حسابية سريعة لضمان يقظة العقل التامة!
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                id="math-challenge-toggle"
                checked={mathChallenge}
                onChange={(e) => setMathChallenge(e.target.checked)}
                className="w-5 h-5 accent-[#FACC15] cursor-pointer shrink-0 mt-1"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
              >
                CANCEL // إلغاء
              </button>
              <button
                type="submit"
                id="save-alarm-btn"
                className="px-6 py-2.5 bg-[#FACC15] hover:bg-[#e6bb10] active:scale-95 text-black text-xs font-mono uppercase tracking-[0.2em] font-black shadow-lg transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>SAVE ALARM // حفظ</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Video Preview Modal */}
      <VideoPreviewModal
        isOpen={!!previewingVideo}
        onClose={() => setPreviewingVideo(null)}
        videoDef={previewingVideo}
        isDark={isDark}
      />
    </>
  );
};
