import { CustomVideoItem, VideoDefinition } from '../types';

const DB_NAME = 'munabbih_tablet_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_videos';

export const PRESET_VIDEOS: VideoDefinition[] = [
  {
    id: 'preset-yusuf',
    titleAr: 'سورة يوسف (الآية ٩٠)',
    subtitleAr: 'القارئ الشيخ محمد صديق المنشاوي',
    category: 'quran',
    durationText: '0:22',
    thumbnailGradient: 'from-amber-900/60 via-slate-900 to-black',
    isPreset: true,
    videoUrl: '/video/final_quran.mp4',
    reciter: 'الشيخ محمد صديق المنشاوي',
    quranAyah: 'إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
  },
  {
    id: 'preset-fajr',
    titleAr: 'أذان الفجر وشروق النور',
    subtitleAr: 'أذان خاشع مع نداء الصلاة خير من النوم',
    category: 'fajr',
    durationText: '0:35',
    thumbnailGradient: 'from-sky-950 via-slate-900 to-black',
    isPreset: true,
    reciter: 'أذان الحرم المكي الشريف',
    quranAyah: 'أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ',
  },
  {
    id: 'preset-motivation',
    titleAr: 'همة وعزيمة الثانوية العامة',
    subtitleAr: 'تحفيز صباحي للتركيز وبلوغ كليات القمة',
    category: 'motivation',
    durationText: '0:25',
    thumbnailGradient: 'from-yellow-950 via-neutral-900 to-black',
    isPreset: true,
    quranAyah: 'وَأَن لَّيْسَ لِلْإِنسَانِ إِلَّا مَا سَعَىٰ • وَأَنَّ سَعْيَهُ سَوْفَ يُرَىٰ',
  },
  {
    id: 'preset-nature',
    titleAr: 'شروق الصباح وتغريد الطيور',
    subtitleAr: 'أصوات طبيعية هادئة للاستيقاظ المريح والنشاط',
    category: 'nature',
    durationText: '0:30',
    thumbnailGradient: 'from-emerald-950 via-slate-900 to-black',
    isPreset: true,
  },
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        try {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        } catch (err) {
          console.warn('DB Upgrade error:', err);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

export async function saveCustomVideo(file: File): Promise<CustomVideoItem> {
  const db = await openDB();
  const id = `custom-vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: CustomVideoItem = {
    id,
    name: file.name.replace(/\.[^/.]+$/, ''),
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve(item);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getCustomVideos(): Promise<CustomVideoItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Failed to load custom videos from IndexedDB:', err);
    return [];
  }
}

export async function getCustomVideoBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result as CustomVideoItem | undefined;
        resolve(item ? item.blob : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('Failed to load custom video blob:', err);
    return null;
  }
}

export async function deleteCustomVideo(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Failed to delete custom video:', err);
  }
}

export async function getAllVideoDefinitions(): Promise<VideoDefinition[]> {
  const customList = await getCustomVideos();
  const customDefs: VideoDefinition[] = customList.map((item) => ({
    id: item.id,
    titleAr: item.name,
    subtitleAr: `فيديو مخصص من التابلت (${(item.size / (1024 * 1024)).toFixed(1)} ميجابايت)`,
    category: 'custom',
    durationText: 'مخصص',
    thumbnailGradient: 'from-amber-950 via-slate-900 to-black',
    isPreset: false,
    blobKey: item.id,
  }));

  return [...PRESET_VIDEOS, ...customDefs];
}

export function getVideoDefinitionById(id: string, allDefs: VideoDefinition[] = PRESET_VIDEOS): VideoDefinition {
  const found = allDefs.find((v) => v.id === id);
  if (found) return found;
  return PRESET_VIDEOS[0];
}
