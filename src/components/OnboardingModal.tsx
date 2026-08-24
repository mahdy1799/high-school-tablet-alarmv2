import React from 'react';
import {
  CheckCircle2,
  PlugZap,
  Volume2,
  Smartphone,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { unlockAudioContext } from '../lib/sound';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  if (!isOpen) return null;

  const handleStart = async () => {
    // Unlock AudioContext on start
    await unlockAudioContext();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      id="onboarding-modal-backdrop"
      dir="rtl"
    >
      <div
        id="onboarding-modal-container"
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 my-8 border shadow-2xl transition-all ${
          isDark
            ? 'bg-[#0F0F0F] border-white/15 text-[#F5F5F5]'
            : 'bg-white border-black/15 text-[#0A0A0A]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-white/10 dark:border-white/10">
          <BrandLogo size="lg" isDark={isDark} showTagline={true} />
          <h2 className="font-cairo font-black text-xl sm:text-2xl mt-4 text-[#0A0A0A] dark:text-white">
            أهلاً بك يا بطل الثانوية العامة! 👋
          </h2>
          <p className="text-xs font-mono uppercase tracking-wider opacity-60 mt-1 max-w-sm">
            SYSTEM BOOT // OPTIMIZED FOR MOE TABLET BROWSER
          </p>
        </div>

        {/* 3 Golden Rules */}
        <div className="my-6 space-y-4">
          <div className="text-xs font-mono uppercase tracking-[0.2em] font-bold text-[#FACC15] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>3 PROTOCOLS // إرشادات الضمان المطلق:</span>
          </div>

          {/* Step 1 */}
          <div className="flex items-start gap-3.5 p-4 bg-white/5 border border-white/10">
            <div className="w-9 h-9 bg-[#FACC15] text-black font-mono font-black text-base flex items-center justify-center shrink-0">
              01
            </div>
            <div>
              <h3 className="font-cairo font-black text-sm text-[#0A0A0A] dark:text-white">
                اترك هذه الصفحة مفتوحة قبل النوم
              </h3>
              <p className="text-xs text-slate-400 font-tajawal mt-1 leading-relaxed">
                يقوم التطبيق بتفعيل قفل الشاشة (Screen Wake Lock) تلقائياً لمنع التابلت من الدخول في وضع السكون وإيقاف المنبه.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 p-4 bg-white/5 border border-white/10">
            <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-black text-base flex items-center justify-center shrink-0">
              02
            </div>
            <div>
              <h3 className="font-cairo font-black text-sm text-[#0A0A0A] dark:text-white flex items-center gap-1.5">
                <PlugZap className="w-4 h-4 text-emerald-400" />
                <span>وصّل الشاحن وتأكد من رفع الصوت</span>
              </h3>
              <p className="text-xs text-slate-400 font-tajawal mt-1 leading-relaxed">
                تأكد أن مستوى صوت التابلت مرتفع وليس في وضع الصامت (DND)، ووصّل الشاحن لضمان عدم نفاد البطارية ليلاً.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 p-4 bg-white/5 border border-white/10">
            <div className="w-9 h-9 bg-sky-500/20 text-sky-400 border border-sky-500/40 font-mono font-black text-base flex items-center justify-center shrink-0">
              03
            </div>
            <div>
              <h3 className="font-cairo font-black text-sm text-[#0A0A0A] dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>أضف التطبيق للشاشة الرئيسية (PWA)</span>
              </h3>
              <p className="text-xs text-slate-400 font-tajawal mt-1 leading-relaxed">
                من قائمة المتصفح اضغط "إضافة إلى الشاشة الرئيسية" لتفتحه كأيقونة سريعة تعمل حتى عند انقطاع الإنترنت!
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          id="start-app-btn"
          onClick={handleStart}
          className="w-full py-4 px-6 bg-[#FACC15] hover:bg-[#e6bb10] active:scale-95 text-black font-mono uppercase tracking-[0.2em] font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <span>ENTER APP // ابدأ الآن</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
