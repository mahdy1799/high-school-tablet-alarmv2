import React, { useEffect, useRef, useState } from 'react';
import { VideoDefinition } from '../types';
import { getCustomVideoBlob } from '../lib/videoStorage';
import { Volume2, VolumeX, Sparkles, BookOpen, Sun, Flame, Play } from 'lucide-react';
import { getAudioContext } from '../lib/sound';

interface AlarmVideoDisplayProps {
  videoDef: VideoDefinition;
  isMuted?: boolean;
  onToggleMute?: () => void;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
  interactive?: boolean;
}

export const AlarmVideoDisplay: React.FC<AlarmVideoDisplayProps> = ({
  videoDef,
  isMuted = false,
  onToggleMute,
  className = '',
  showControls = true,
  autoplay = true,
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoplay);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioStopRef = useRef<(() => void) | null>(null);
  const createdBlobUrlRef = useRef<string | null>(null);

  // Determine video source: preset videoUrl OR custom blob from IndexedDB
  useEffect(() => {
    let active = true;

    // Clean up old blob URL
    if (createdBlobUrlRef.current) {
      URL.revokeObjectURL(createdBlobUrlRef.current);
      createdBlobUrlRef.current = null;
    }

    // Case 1: Preset video with a real video file URL
    if (videoDef.isPreset && videoDef.videoUrl) {
      setVideoSrc(videoDef.videoUrl);
      return;
    }

    // Case 2: Custom video stored in IndexedDB
    if (!videoDef.isPreset && videoDef.blobKey) {
      getCustomVideoBlob(videoDef.blobKey).then((blob) => {
        if (!active) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          createdBlobUrlRef.current = url;
          setVideoSrc(url);
        } else {
          setVideoSrc(null);
        }
      }).catch(() => {
        if (active) setVideoSrc(null);
      });
      return;
    }

    // Case 3: Preset without videoUrl → will use canvas fallback
    setVideoSrc(null);

    return () => {
      active = false;
      if (createdBlobUrlRef.current) {
        URL.revokeObjectURL(createdBlobUrlRef.current);
        createdBlobUrlRef.current = null;
      }
      if (audioStopRef.current) {
        audioStopRef.current();
        audioStopRef.current = null;
      }
    };
  }, [videoDef]);

  // Audio synthesizer for preset videos WITHOUT a real video file
  useEffect(() => {
    // If we have a real video source, the <video> element handles audio — skip synth
    if (videoSrc || isMuted || !isPlaying) {
      if (audioStopRef.current) {
        audioStopRef.current();
        audioStopRef.current = null;
      }
      return;
    }

    // Preset video synthesized acoustic track (only for presets without videoUrl)
    let ctx: AudioContext | null = null;
    try {
      ctx = getAudioContext();
    } catch {
      return;
    }
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    let isTerminated = false;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, ctx.currentTime);
    masterGain.connect(ctx.destination);

    let intervalId: number | null = null;

    if (videoDef.id === 'preset-yusuf') {
      const notes = [220, 247.5, 264, 297, 330, 352, 396, 440];
      let noteIdx = 0;
      intervalId = window.setInterval(() => {
        if (isTerminated) return;
        const t = ctx!.currentTime;
        const osc1 = ctx!.createOscillator();
        const osc2 = ctx!.createOscillator();
        const noteGain = ctx!.createGain();

        const freq = notes[noteIdx % notes.length];
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 1.5, t);

        noteGain.gain.setValueAtTime(0.001, t);
        noteGain.gain.linearRampToValueAtTime(0.35, t + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

        osc1.connect(noteGain);
        osc2.connect(noteGain);
        noteGain.connect(masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 1.9);
        osc2.stop(t + 1.9);

        noteIdx++;
      }, 1200);
    } else if (videoDef.id === 'preset-fajr') {
      const notes = [196, 220, 261.6, 293.6, 329.6];
      let step = 0;
      intervalId = window.setInterval(() => {
        if (isTerminated) return;
        const t = ctx!.currentTime;
        const osc = ctx!.createOscillator();
        const sub = ctx!.createOscillator();
        const g = ctx!.createGain();

        const f = notes[step % notes.length];
        osc.type = 'sine';
        sub.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        sub.frequency.setValueAtTime(f / 2, t);

        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

        osc.connect(g);
        sub.connect(g);
        g.connect(masterGain);

        osc.start(t);
        sub.start(t);
        osc.stop(t + 2.3);
        sub.stop(t + 2.3);
        step++;
      }, 1500);
    } else {
      const notes = [261.63, 329.63, 392.0, 523.25];
      let step = 0;
      intervalId = window.setInterval(() => {
        if (isTerminated) return;
        const t = ctx!.currentTime;
        const osc = ctx!.createOscillator();
        const g = ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[step % notes.length], t);

        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.3, t + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 1.0);
        step++;
      }, 600);
    }

    audioStopRef.current = () => {
      isTerminated = true;
      if (intervalId !== null) clearInterval(intervalId);
      try {
        masterGain.disconnect();
      } catch {
        // Ignored
      }
    };

    return () => {
      if (audioStopRef.current) {
        audioStopRef.current();
        audioStopRef.current = null;
      }
    };
  }, [videoDef, videoSrc, isMuted, isPlaying]);

  // Animated Canvas particle & light rendering for preset visualizer (NO video file)
  useEffect(() => {
    if (videoSrc) return; // Has a real video — skip canvas

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let t = 0;

    const particles: Array<{ x: number; y: number; size: number; speed: number; opacity: number }> = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.0015 + 0.0005,
        opacity: Math.random() * 0.7 + 0.2,
      });
    }

    const render = () => {
      t += 0.02;
      setCurrentTime(t);
      const w = (canvas.width = canvas.parentElement?.clientWidth || 400);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 600);

      // Background atmospheric study gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
      if (videoDef.id === 'preset-yusuf') {
        bgGrad.addColorStop(0, '#1c150c');
        bgGrad.addColorStop(0.5, '#0d0b08');
        bgGrad.addColorStop(1, '#050403');
      } else if (videoDef.id === 'preset-fajr') {
        bgGrad.addColorStop(0, '#0a1d3b');
        bgGrad.addColorStop(0.5, '#050f24');
        bgGrad.addColorStop(1, '#02050d');
      } else if (videoDef.id === 'preset-motivation') {
        bgGrad.addColorStop(0, '#241a05');
        bgGrad.addColorStop(0.5, '#120d02');
        bgGrad.addColorStop(1, '#050400');
      } else {
        bgGrad.addColorStop(0, '#06201a');
        bgGrad.addColorStop(0.5, '#03120e');
        bgGrad.addColorStop(1, '#010504');
      }

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle atmospheric study desk bokeh circle
      const bokehX = w / 2 + Math.sin(t * 0.5) * 40;
      const bokehY = h * 0.35 + Math.cos(t * 0.4) * 30;
      const bokehGrad = ctx.createRadialGradient(bokehX, bokehY, 0, bokehX, bokehY, 180);
      bokehGrad.addColorStop(0, 'rgba(250, 204, 21, 0.12)');
      bokehGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = bokehGrad;
      ctx.beginPath();
      ctx.arc(bokehX, bokehY, 180, 0, Math.PI * 2);
      ctx.fill();

      // Draw floating golden/luminous particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = 1;
        const px = p.x * w + Math.sin(t + p.y * 10) * 15;
        const py = p.y * h;

        ctx.fillStyle = `rgba(250, 204, 21, ${p.opacity * (0.6 + Math.sin(t * 2 + p.x * 5) * 0.3)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle architectural scanlines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [videoSrc, videoDef]);

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  // Determine if we have a real video to play
  const hasRealVideo = !!videoSrc;

  return (
    <div
      id={`alarm-video-display-${videoDef.id}`}
      className={`relative w-full h-full overflow-hidden bg-black flex items-center justify-center select-none ${className}`}
    >
      {/* Real video player: for presets with videoUrl OR custom uploaded videos */}
      {hasRealVideo ? (
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          autoPlay={autoplay}
          loop
          muted={isMuted}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Preset Interactive Video Canvas (fallback when no video file) */
        <div className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-8">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Surah / Category Top Header */}
          <div className="relative z-10 w-full flex flex-col items-center text-center pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15] font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.2em] shadow-lg backdrop-blur-md">
              {videoDef.category === 'quran' ? (
                <BookOpen className="w-4 h-4 text-[#FACC15]" />
              ) : videoDef.category === 'fajr' ? (
                <Sun className="w-4 h-4 text-[#FACC15]" />
              ) : (
                <Flame className="w-4 h-4 text-[#FACC15]" />
              )}
              <span>{videoDef.titleAr}</span>
            </div>

            <div className="text-xs font-mono text-slate-300 mt-2 opacity-80">
              {videoDef.subtitleAr}
            </div>
          </div>

          {/* Main Glowing Calligraphy / Verse Area */}
          <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-xl px-4">
            {videoDef.quranAyah ? (
              <div className="space-y-4">
                {/* Quran Verse in Large Classical Naskh / Amiri style */}
                <div className="text-2xl sm:text-3xl md:text-4xl font-amiri font-bold text-white leading-relaxed drop-shadow-[0_4px_25px_rgba(250,204,21,0.4)] tracking-wide">
                  « {videoDef.quranAyah} »
                </div>

                {/* English Subtitles with Gold Accents */}
                {videoDef.id === 'preset-yusuf' && (
                  <div className="text-xs sm:text-sm font-mono text-[#FACC15] tracking-wider italic opacity-90 max-w-md mx-auto">
                    Surely whoever is mindful of Allah and patient, then surely Allah never wastes the reward of the good-doers.
                  </div>
                )}
                {videoDef.id === 'preset-motivation' && (
                  <div className="text-xs sm:text-sm font-mono text-[#FACC15] tracking-wider italic opacity-90">
                    And that a human being will only have the result of their own efforts.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-3xl sm:text-4xl font-cairo font-black text-white leading-tight">
                  {videoDef.titleAr}
                </div>
                <div className="text-sm font-mono text-[#FACC15] tracking-wider">
                  صباح التوفيق والنشاط، خطوة نحو حلمك 🌟
                </div>
              </div>
            )}

            {/* Reciter Badge */}
            {videoDef.reciter && (
              <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/15 text-slate-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>{videoDef.reciter}</span>
              </div>
            )}
          </div>

          {/* Video Progress Line */}
          <div className="relative z-10 w-full max-w-md pb-2">
            <div className="w-full h-1 bg-white/20 overflow-hidden">
              <div
                className="h-full bg-[#FACC15] transition-all duration-300"
                style={{ width: `${((currentTime % 22) / 22) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Mute and Playback Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {onToggleMute && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="p-2.5 bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all active:scale-95"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#FACC15]" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
