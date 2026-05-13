import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MediaAsset {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  url: string;
  altText: string;
  caption: string;
  usageCount: number;
  uploadedBy: string;
  createdAt: string;
}

interface MediaStore {
  assets: MediaAsset[];
  search: string;
  setSearch: (s: string) => void;
  addAsset: (a: Omit<MediaAsset, 'id' | 'createdAt'>) => void;
  updateAsset: (id: string, patch: Partial<MediaAsset>) => void;
  deleteAsset: (id: string) => void;
  filteredAssets: () => MediaAsset[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SEED_ASSETS: MediaAsset[] = [
  { id: 'm1', filename: 'hero-banner.jpg',        mimeType: 'image/jpeg', size: 1258291, width: 1920, height: 1080, url: '', altText: 'Hero Banner',          caption: '', usageCount: 3, uploadedBy: 'Admin User',  createdAt: '2025-04-01T09:00:00Z' },
  { id: 'm2', filename: 'science-experiment.png', mimeType: 'image/png',  size: 876544,  width: 1200, height: 800,  url: '', altText: 'Science Experiment', caption: '', usageCount: 1, uploadedBy: 'Demo Editor', createdAt: '2025-04-10T09:00:00Z' },
  { id: 'm3', filename: 'ocean-quiz-cover.jpg',   mimeType: 'image/jpeg', size: 751616,  width: 1200, height: 675,  url: '', altText: 'Ocean Quiz',          caption: '', usageCount: 2, uploadedBy: 'Admin User',  createdAt: '2025-04-15T09:00:00Z' },
  { id: 'm4', filename: 'reading-child.jpg',      mimeType: 'image/jpeg', size: 1572864, width: 1600, height: 900,  url: '', altText: 'Child Reading',       caption: '', usageCount: 5, uploadedBy: 'Demo Editor', createdAt: '2025-04-20T09:00:00Z' },
  { id: 'm5', filename: 'activity-guide.png',     mimeType: 'image/png',  size: 2201600, width: 2400, height: 1600, url: '', altText: 'Activity Guide',      caption: '', usageCount: 0, uploadedBy: 'Admin User',  createdAt: '2025-04-25T09:00:00Z' },
  { id: 'm6', filename: 'eco-champion.jpg',       mimeType: 'image/jpeg', size: 694272,  width: 800,  height: 600,  url: '', altText: 'Eco Champion',        caption: '', usageCount: 1, uploadedBy: 'Demo Editor', createdAt: '2025-05-01T09:00:00Z' },
  { id: 'm7', filename: 'math-fun.png',           mimeType: 'image/png',  size: 455680,  width: 1024, height: 768,  url: '', altText: 'Math Fun',            caption: '', usageCount: 2, uploadedBy: 'Demo Editor', createdAt: '2025-05-05T09:00:00Z' },
  { id: 'm8', filename: 'space-adventure.jpg',    mimeType: 'image/jpeg', size: 1887437, width: 1920, height: 1200, url: '', altText: 'Space Adventure',      caption: '', usageCount: 3, uploadedBy: 'Admin User',  createdAt: '2025-05-08T09:00:00Z' },
];

export { formatSize };

export const useMediaStore = create<MediaStore>()(
  persist(
    (set, get) => ({
      assets: SEED_ASSETS,
      search: '',
      setSearch: (search) => set({ search }),
      addAsset: (a) =>
        set((s) => ({
          assets: [{ ...a, id: Math.random().toString(36).slice(2, 10), createdAt: new Date().toISOString() }, ...s.assets],
        })),
      updateAsset: (id, patch) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),
      filteredAssets: () => {
        const { assets, search } = get();
        if (!search) return assets;
        const q = search.toLowerCase();
        return assets.filter((a) => a.filename.toLowerCase().includes(q) || a.altText.toLowerCase().includes(q));
      },
    }),
    { name: 'media-store-v1', partialize: (s) => ({ assets: s.assets }) },
  ),
);
