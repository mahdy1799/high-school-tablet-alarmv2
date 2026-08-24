import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Volume2,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      id="how-it-works-modal-backdrop"
      dir="rtl"
    >
      <div
        id="how-it-works-container"
        className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 my-8 border shadow-2xl transition-all ${
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
          <div className="w-12 h-12 bg-[#FACC15] text-black flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-cairo font-black text-xl sm:text-2xl">
              كيف يعمل المنبه؟ ولماذا صُمم بهذا الشكل؟
            </h2>
            <p className="text-xs sm:text-sm font-mono uppercase tracking-wider opacity-60">
              SYS ARCHITECTURE // DRIFT-CORRECTED OFFLINE ENGINE
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="my-6 space-y-5 text-sm font-tajawal leading-relaxed">
          {/* Why other sites fail */}
          <div className="p-4 bg-amber-400/10 border border-amber-400/30 text-amber-300">
            <h3 className="font-cairo font-black text-base mb-1.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>لماذا تفشل المواقع العادية في إيقاظ الطلاب؟</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              معظم مواقع المنبهات تعتمد على مؤقتات عادية (setTimeout). عندما تغلق شاشة التابلت أو يدخل المتصفح في وضع الخمول، يقوم نظام أندرويد بتجميد الجافاسكريبت لتوفير الطاقة. بالإضافة لسياسة أندرويد التي تمنع تشغيل الصوت تلقائياً بدون تصريح تفاعلي مسبق (Autoplay Policy).
            </p>
          </div>

          {/* What we solved */}
          <div className="space-y-3">
            <h3 className="font-cairo font-black text-base text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#FACC15]" />
              <span>الحلول التقنية المعتمدة في منبه التابلت:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Feature 1 */}
              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#FACC15] uppercase tracking-wider mb-1">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>SCREEN WAKE LOCK // منع الإغلاق</span>
                </div>
                <p className="text-xs text-slate-400">
                  يطلب إذن قفل الشاشة لمنع التابلت من النوم طوال فترة تفعيل المنبه، ويُعاد تفعيله تلقائياً عند الرجوع للصفحة.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#FACC15] uppercase tracking-wider mb-1">
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>WEB AUDIO SYNTH // الصوت التخليقي</span>
                </div>
                <p className="text-xs text-slate-400">
                  الأصوات تُولّد عبر موجات صوتية تُصنع برمجياً بالمعالج داخل المتصفح بدون ملفات خارجية قد تفشل في التحميل.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#FACC15] uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>DRIFT-CORRECTED ENGINE // الدقة المطلقة</span>
                </div>
                <p className="text-xs text-slate-400">
                  يفحص الوقت الحقيقي بالمقارنة مع الساعة المطلقة كل ثانية، ليصحح أي تباطؤ ناتج عن توفير طاقة المعالج فوراً.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-[#FACC15] uppercase tracking-wider mb-1">
                  <WifiOff className="w-4 h-4 shrink-0" />
                  <span>OFFLINE PWA & VIDEO // فيديو وأوفلاين</span>
                </div>
                <p className="text-xs text-slate-400">
                  يعمل بشكل كامل أوفلاين ويحفظ المنبهات وفيديوهات التنبيه (المدمجة والمرفوعة من التابلت) محلياً في ذاكرة التابلت.
                </p>
              </div>
            </div>
          </div>

          {/* Honest limits */}
          <div className="p-4 bg-white/5 border border-white/10">
            <h4 className="font-mono font-bold text-xs text-[#FACC15] uppercase tracking-wider mb-2">
              ⚠️ HARDWARE CONSTRAINTS // تنبيهات مهمة:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              <li>احرص على توصيل الشاحن قبل النوم لضمان عدم نفاد بطارية التابلت ليلاً.</li>
              <li>تأكد من رفع مستوى صوت مكبر التابلت وعدم كتم الصوت من المفاتيح الجانبية.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#FACC15] hover:bg-[#e6bb10] text-black font-mono font-black text-xs uppercase tracking-[0.2em] shadow-md transition-all"
          >
            CONFIRM // فهمت، حسناً
          </button>
        </div>
      </div>
    </div>
  );
};
