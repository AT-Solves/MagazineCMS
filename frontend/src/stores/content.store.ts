import { create } from 'zustand';

export interface ContentItemData {
  id: string;
  type: 'article' | 'story' | 'quiz' | 'activity' | 'interactive_story';
  title: string;
  slug: string;
  status: 'brief' | 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'archived';
  version: number;
  createdBy: string;
  richText: Record<string, any>;
  contentJson: Record<string, any>;
  metadataJson: Record<string, any>;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImageUrl?: string;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  viewCount: number;
}

interface ContentStore {
  currentContent: ContentItemData | null;
  contentList: ContentItemData[];
  selectedContentIds: Set<string>;
  filter: {
    status?: string;
    type?: string;
    searchQuery?: string;
  };
  loading: boolean;
  error: string | null;

  // Actions
  setCurrentContent: (content: ContentItemData | null) => void;
  updateCurrentContent: (updates: Partial<ContentItemData>) => void;
  setContentList: (content: ContentItemData[]) => void;
  addContent: (content: ContentItemData) => void;
  removeContent: (id: string) => void;
  toggleContentSelection: (id: string) => void;
  clearSelection: () => void;
  setFilter: (filter: Partial<ContentStore['filter']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  currentContent: null,
  contentList: [],
  selectedContentIds: new Set(),
  filter: {},
  loading: false,
  error: null,

  setCurrentContent: (content) => set({ currentContent: content }),

  updateCurrentContent: (updates) =>
    set((state) => ({
      currentContent: state.currentContent
        ? { ...state.currentContent, ...updates }
        : null,
    })),

  setContentList: (content) => set({ contentList: content }),

  addContent: (content) =>
    set((state) => ({
      contentList: [content, ...state.contentList],
    })),

  removeContent: (id) =>
    set((state) => ({
      contentList: state.contentList.filter((c) => c.id !== id),
    })),

  toggleContentSelection: (id) =>
    set((state) => {
      const newSelection = new Set(state.selectedContentIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedContentIds: newSelection };
    }),

  clearSelection: () => set({ selectedContentIds: new Set() }),

  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
