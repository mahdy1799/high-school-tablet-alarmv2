import { SoundDefinition, SoundType } from '../types';

export const SOUND_DEFINITIONS: SoundDefinition[] = [
  {
    id: 'classic',
    nameAr: 'كلاسيكي',
    descriptionAr: 'جرس تقليدي بسيط، نغمتين بالتبادل بنقاء عالي.',
    tag: 'نغمة يومية متوازنة',
  },
  {
    id: 'gentle_rise',
    nameAr: 'تصاعدي هادئ',
    descriptionAr: 'بيبدأ هادي وبيقوى تدريجيًا عشان تصحى بروقان وبدون فزع.',
    tag: 'للنوم الخفيف والاستيقاظ التدريجي',
  },
  {
    id: 'urgent',
    nameAr: 'عاجل وحاسم',
    descriptionAr: 'صوت قوي وسريع من أول لحظة، مناسب لو نومك تقيل جداً أو وراك امتحان مهم.',
    tag: 'للنوم الثقيل وأيام الامتحانات',
  },
];

let globalAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

export function getAudioContext(): AudioContext {
  if (!globalAudioCtx && typeof window !== 'undefined') {
    try {
      const AudioContextClass =
        window.AudioContext ||
        // @ts-expect-error webkitAudioContext fallback for older mobile browsers
        window.webkitAudioContext;
      if (AudioContextClass) {
        globalAudioCtx = new AudioContextClass();
      }
    } catch (err) {
      console.warn('AudioContext creation error:', err);
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx!;
}

/**
 * Mobile browsers require a real user gesture (click/tap) to unlock audio playback.
 * Calling this during a user gesture (e.g. Save Alarm, Test Sound, or clicking anywhere)
 * primes the AudioContext so unattended alarm playback is guaranteed.
 */
export async function unlockAudioContext(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    // Play a microscopic silent oscillator buffer to satisfy autoplay policy
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(ctx.currentTime + 0.05);
    isAudioUnlocked = true;
    return true;
  } catch (err) {
    console.warn('AudioContext unlock failed:', err);
    return false;
  }
}

export function isAudioReady(): boolean {
  return isAudioUnlocked || (globalAudioCtx !== null && globalAudioCtx.state === 'running');
}

/**
 * Procedural alarm synthesizer implementing the 3 custom sound modes.
 * Returns a stop callback to immediately cease playback.
 */
export function playAlarmSound(soundId: SoundType, targetVolume = 1): () => void {
  const ctx = getAudioContext();
  let isStopped = false;
  const activeNodes: (AudioNode | number)[] = [];

  const masterGain = ctx.createGain();
  const clampedVol = Math.max(0.05, Math.min(1, targetVolume));
  masterGain.connect(ctx.destination);

  if (soundId === 'classic') {
    // Alternating 800Hz and 1000Hz pulses every 250ms
    masterGain.gain.setValueAtTime(clampedVol * 0.8, ctx.currentTime);
    let step = 0;

    const intervalId = window.setInterval(() => {
      if (isStopped) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(step % 2 === 0 ? 880 : 1046.5, t); // A5 and C6

      // Crisp bell-like envelope
      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.exponentialRampToValueAtTime(clampedVol * 0.9, t + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(t);
      osc.stop(t + 0.23);
      step++;
    }, 250);

    activeNodes.push(intervalId);
  } else if (soundId === 'gentle_rise') {
    // Starts soft at 0.05 gain and ramps up frequency & volume smoothly over 30s
    masterGain.gain.setValueAtTime(0.05, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(clampedVol, ctx.currentTime + 25);

    let tick = 0;
    const intervalId = window.setInterval(() => {
      if (isStopped) return;
      const t = ctx.currentTime;

      // Two harmonic oscillators (sine + triangle)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      const baseFreq = 440 + Math.min(300, tick * 6); // Ramps from 440Hz to 740Hz
      osc1.frequency.setValueAtTime(baseFreq, t);
      osc2.frequency.setValueAtTime(baseFreq * 1.5, t); // Perfect fifth harmony

      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.linearRampToValueAtTime(0.7, t + 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.65);
      osc2.stop(t + 0.65);

      tick++;
    }, 800);

    activeNodes.push(intervalId);
  } else if (soundId === 'urgent') {
    // Rapid urgent sawtooth beeps with frequency chirps at full volume
    masterGain.gain.setValueAtTime(clampedVol, ctx.currentTime);

    let count = 0;
    const intervalId = window.setInterval(() => {
      if (isStopped) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sawtooth';
      subOsc.type = 'square';

      // Urgent high pitch alert (1200Hz - 1500Hz)
      const f = count % 4 === 0 ? 1500 : count % 4 === 1 ? 1250 : count % 4 === 2 ? 1400 : 1600;
      osc.frequency.setValueAtTime(f, t);
      subOsc.frequency.setValueAtTime(f / 2, t);

      noteGain.gain.setValueAtTime(clampedVol, t);
      noteGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(noteGain);
      subOsc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(t);
      subOsc.start(t);
      osc.stop(t + 0.13);
      subOsc.stop(t + 0.13);

      count++;
    }, 150);

    activeNodes.push(intervalId);
  }

  return () => {
    isStopped = true;
    activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      }
    });
    try {
      masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      setTimeout(() => {
        masterGain.disconnect();
      }, 100);
    } catch {
      // Ignored if already disconnected
    }
  };
}

/**
 * Preview sound helper for modal & sound selection. Plays for a fixed duration.
 */
export function previewSound(soundId: SoundType, volume = 1, durationMs = 2500): Promise<void> {
  return new Promise((resolve) => {
    unlockAudioContext();
    const stop = playAlarmSound(soundId, volume);
    setTimeout(() => {
      stop();
      resolve();
    }, durationMs);
  });
}
