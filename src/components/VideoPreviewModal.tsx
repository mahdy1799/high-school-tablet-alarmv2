import React, { useState } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { VideoDefinition } from '../types';
import { AlarmVideoDisplay } from './AlarmVideoDisplay';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoDef: VideoDefinition | null;
  isDark: boolean;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  videoDef,
  isDark,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);

  if (!isOpen || !videoDef) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg h-[80vh] max-h-[680px] flex flex-col border shadow-2xl overflow-hidden ${
          isDark ? 'bg-[#0A0A0A] border-white/20 text-white' : 'bg-white border-black/20 text-black'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-black/50 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FACC15] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#FACC15]">
              VIDEO PREVIEW // {videoDef.titleAr}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 border border-white/20 text-white hover:bg-white/10 transition-colors"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#FACC15]" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 border border-white/20 text-white hover:bg-white/10 transition-colors"
              aria-label="إغلاق المعاينة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Display Area */}
        <div className="relative flex-1 w-full h-full bg-black">
          <AlarmVideoDisplay
            videoDef={videoDef}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            showControls={true}
            autoplay={true}
          />
        </div>

        {/* Footer info & close */}
        <div className="p-3 bg-[#0F0F0F] border-t border-white/10 flex items-center justify-between z-20">
          <div className="text-xs font-tajawal text-slate-300">
            {videoDef.subtitleAr || 'هذا الفيديو سيعمل كمنبه مرئي وصوتي بكامل الشاشة عند حلول الموعد'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#FACC15] text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e6bb10]"
          >
            DONE // إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
