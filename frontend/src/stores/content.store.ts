import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentStatus, ContentTypeValue } from '../constants/magazine';

export interface ContentItem {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  type: ContentTypeValue;
  status: ContentStatus;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  ageGroup: string;
  readingLevel: string;
  locale: string;
  platform: string;
  priority: string;
  readTimeTarget: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  focusKeyword: string;
  pullQuote: string;
  byline: string;
  isFeatured: boolean;
  isCoverStory: boolean;
  issueVolume: string;
  issueNumber: string;
  wordCount: number;
  views: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  deadline?: string;
}

interface ContentFilter {
  search: string;
  status: string;
  type: string;
  category: string;
  author: string;
}

interface ContentStore {
  items: ContentItem[];
  filter: ContentFilter;
  loading: boolean;
  error: string | null;
  addItem: (item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'completionRate'>) => ContentItem;
  updateItem: (id: string, patch: Partial<ContentItem>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => ContentItem | undefined;
  setFilter: (patch: Partial<ContentFilter>) => void;
  clearFilter: () => void;
  filteredItems: () => ContentItem[];
  moveStage: (id: string, status: ContentStatus) => void;
}

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

export function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function countWords(html: string): number {
  return html.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
}

const SEED: ContentItem[] = [
  {
    id: 'seed-1', title: 'Ocean Conservation: Why Every Drop Counts',
    subtitle: 'How young readers can help protect our seas',
    body: '<p>Our oceans cover more than 70% of the Earth\'s surface and are home to millions of species. Yet human activity threatens these vital ecosystems every day.</p>',
    type: 'feature_article', status: 'published', category: 'Environment',
    tags: ['ocean', 'conservation', 'environment', 'science'], author: 'Admin User', authorId: 'demo-admin',
    ageGroup: '9-11', readingLevel: 'intermediate', locale: 'en', platform: 'web_app',
    priority: 'high', readTimeTarget: 'medium', seoTitle: 'Ocean Conservation | Environment | MagazineCMS',
    seoDescription: 'Discover why ocean conservation matters and how young readers can make a real difference.',
    slug: 'ocean-conservation-why-every-drop-counts', focusKeyword: 'ocean conservation',
    pullQuote: 'Every piece of litter we pick up is one less threat to a sea creature.', byline: '',
    isFeatured: true, isCoverStory: true, issueVolume: '12', issueNumber: '5',
    wordCount: 1240, views: 3500, completionRate: 82,
    createdAt: '2025-04-01T09:00:00Z', updatedAt: '2025-05-07T09:00:00Z', publishedAt: '2025-05-07T09:00:00Z',
  },
  {
    id: 'seed-2', title: 'Science Experiments at Home: Volume 3',
    subtitle: 'Safe, fun experiments for curious minds',
    body: '<p>You don\'t need a laboratory to be a scientist. These experiments use everyday household items to explore chemistry, physics, and biology.</p>',
    type: 'how_to', status: 'published', category: 'Science & Nature',
    tags: ['science', 'experiments', 'stem', 'how-to'], author: 'Demo Editor', authorId: 'demo-editor',
    ageGroup: '6-8', readingLevel: 'beginner', locale: 'en', platform: 'web_app',
    priority: 'medium', readTimeTarget: 'medium', seoTitle: 'Science Experiments at Home Vol 3',
    seoDescription: 'Safe and fun science experiments kids can do at home with simple household items.',
    slug: 'science-experiments-at-home-vol-3', focusKeyword: 'science experiments kids',
    pullQuote: 'The best laboratory is your own kitchen.', byline: '',
    isFeatured: false, isCoverStory: false, issueVolume: '12', issueNumber: '4',
    wordCount: 890, views: 2890, completionRate: 71,
    createdAt: '2025-04-10T09:00:00Z', updatedAt: '2025-05-07T09:00:00Z', publishedAt: '2025-05-07T09:00:00Z',
  },
  {
    id: 'seed-3', title: 'Interview: Dr. Maya Patel on Space Exploration',
    subtitle: 'The astrophysicist making science accessible to all',
    body: '<p>Dr. Maya Patel has spent twenty years making the cosmos understandable to children everywhere.</p>',
    type: 'interview', status: 'in_review', category: 'Space & Astronomy',
    tags: ['space', 'interview', 'science', 'inspiration'], author: 'Admin User', authorId: 'demo-admin',
    ageGroup: '12-14', readingLevel: 'advanced', locale: 'en', platform: 'web',
    priority: 'high', readTimeTarget: 'long', seoTitle: 'Interview: Dr Maya Patel on Space Exploration',
    seoDescription: 'Astrophysicist Dr. Maya Patel shares her passion for making space science accessible to young readers.',
    slug: 'interview-dr-maya-patel-space-exploration', focusKeyword: 'space exploration kids',
    pullQuote: 'Every child who looks up at the night sky is already an astronomer.', byline: 'By Editorial Staff',
    isFeatured: true, isCoverStory: false, issueVolume: '12', issueNumber: '6',
    wordCount: 2100, views: 0, completionRate: 0,
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T09:00:00Z', deadline: '2025-05-20T00:00:00Z',
  },
  {
    id: 'seed-4', title: 'Creative Writing Workshop: Finding Your Voice',
    subtitle: 'Tips and exercises for young writers',
    body: '<p>Every great writer started exactly where you are now — staring at a blank page.</p>',
    type: 'how_to', status: 'approved', category: 'Arts & Creativity',
    tags: ['writing', 'creativity', 'workshop', 'tips'], author: 'Demo Editor', authorId: 'demo-editor',
    ageGroup: '12-14', readingLevel: 'intermediate', locale: 'en', platform: 'web_app',
    priority: 'medium', readTimeTarget: 'medium', seoTitle: 'Creative Writing Workshop | Arts | MagazineCMS',
    seoDescription: 'Practical writing tips and creative exercises to help young writers find their unique voice.',
    slug: 'creative-writing-workshop-finding-your-voice', focusKeyword: 'creative writing kids',
    pullQuote: 'Your story matters. Start writing it today.', byline: '',
    isFeatured: false, isCoverStory: false, issueVolume: '12', issueNumber: '6',
    wordCount: 1580, views: 0, completionRate: 0,
    createdAt: '2025-05-03T09:00:00Z', updatedAt: '2025-05-11T09:00:00Z', deadline: '2025-05-22T00:00:00Z',
  },
  {
    id: 'seed-5', title: 'Math Puzzles: The Number Detective',
    subtitle: 'Can you crack these brain-bending challenges?',
    body: '<p>Detective work is all about looking for clues and patterns — and so is mathematics!</p>',
    type: 'quiz', status: 'draft', category: 'Mathematics',
    tags: ['maths', 'puzzle', 'quiz', 'logic', 'stem'], author: 'Demo Editor', authorId: 'demo-editor',
    ageGroup: '9-11', readingLevel: 'intermediate', locale: 'en', platform: 'app',
    priority: 'low', readTimeTarget: 'short', seoTitle: 'Math Puzzles: The Number Detective Quiz',
    seoDescription: 'Brain-bending maths puzzles for kids 9–11. Can you solve them all?',
    slug: 'math-puzzles-the-number-detective', focusKeyword: 'maths puzzles kids',
    pullQuote: '', byline: '', isFeatured: false, isCoverStory: false, issueVolume: '12', issueNumber: '6',
    wordCount: 420, views: 0, completionRate: 0,
    createdAt: '2025-05-08T09:00:00Z', updatedAt: '2025-05-12T09:00:00Z',
  },
  {
    id: 'seed-6', title: 'Healthy Eating Guide for Kids',
    subtitle: 'Building lifelong healthy habits through food',
    body: '<p>What we eat shapes who we become. This guide breaks down the building blocks of nutrition in a fun way.</p>',
    type: 'feature_article', status: 'scheduled', category: 'Health & Wellness',
    tags: ['health', 'nutrition', 'food', 'wellness'], author: 'Admin User', authorId: 'demo-admin',
    ageGroup: '6-8', readingLevel: 'beginner', locale: 'en', platform: 'web_app',
    priority: 'medium', readTimeTarget: 'medium', seoTitle: 'Healthy Eating Guide for Kids | Health | MagazineCMS',
    seoDescription: 'A fun and practical guide to healthy eating habits for children, covering nutrition basics.',
    slug: 'healthy-eating-guide-for-kids', focusKeyword: 'healthy eating children',
    pullQuote: 'Food is fuel — choose the premium kind.', byline: '',
    isFeatured: false, isCoverStory: false, issueVolume: '12', issueNumber: '6',
    wordCount: 980, views: 0, completionRate: 0,
    createdAt: '2025-05-06T09:00:00Z', updatedAt: '2025-05-12T09:00:00Z', scheduledAt: '2025-05-15T09:00:00Z',
  },
  {
    id: 'seed-7', title: 'The Secret Life of Insects',
    subtitle: 'Tiny creatures, enormous impact',
    body: '',
    type: 'feature_article', status: 'brief', category: 'Animals & Wildlife',
    tags: ['insects', 'nature', 'wildlife', 'biology'], author: 'Demo Editor', authorId: 'demo-editor',
    ageGroup: '6-8', readingLevel: 'beginner', locale: 'en', platform: 'web_app',
    priority: 'low', readTimeTarget: 'short', seoTitle: 'The Secret Life of Insects',
    seoDescription: 'Discover the fascinating world of insects and why these tiny creatures matter.',
    slug: 'the-secret-life-of-insects', focusKeyword: 'insects for kids',
    pullQuote: '', byline: '', isFeatured: false, isCoverStory: false, issueVolume: '12', issueNumber: '7',
    wordCount: 0, views: 0, completionRate: 0,
    createdAt: '2025-05-12T09:00:00Z', updatedAt: '2025-05-12T09:00:00Z',
  },
  {
    id: 'seed-8', title: 'Summer Reading List 2025',
    subtitle: '20 books every young reader should explore this summer',
    body: '<p>Summer is the perfect time to dive into a great book. Our editors have curated the ultimate 2025 reading list.</p>',
    type: 'feature_article', status: 'scheduled', category: 'Language & Literature',
    tags: ['reading', 'books', 'literature', 'summer'], author: 'Admin User', authorId: 'demo-admin',
    ageGroup: 'all', readingLevel: 'intermediate', locale: 'en', platform: 'web_app',
    priority: 'high', readTimeTarget: 'medium', seoTitle: 'Summer Reading List 2025 | MagazineCMS',
    seoDescription: '20 must-read books for young readers in summer 2025, curated by our editorial team.',
    slug: 'summer-reading-list-2025', focusKeyword: 'summer reading kids 2025',
    pullQuote: 'A reader lives a thousand lives before they die.', byline: '',
    isFeatured: true, isCoverStory: false, issueVolume: '12', issueNumber: '6',
    wordCount: 1350, views: 0, completionRate: 0,
    createdAt: '2025-05-05T09:00:00Z', updatedAt: '2025-05-12T09:00:00Z', scheduledAt: '2025-05-20T10:00:00Z',
  },
];

const DEFAULT_FILTER: ContentFilter = { search: '', status: '', type: '', category: '', author: '' };

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      items: SEED,
      filter: DEFAULT_FILTER,
      loading: false,
      error: null,

      addItem: (partial) => {
        const item: ContentItem = {
          ...partial,
          id: uid(),
          wordCount: countWords(partial.body),
          views: 0,
          completionRate: 0,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ items: [item, ...s.items] }));
        return item;
      },

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...patch,
                  wordCount: patch.body !== undefined ? countWords(patch.body) : item.wordCount,
                  updatedAt: now(),
                }
              : item,
          ),
        })),

      deleteItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      getItem: (id) => get().items.find((i) => i.id === id),

      setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),

      clearFilter: () => set({ filter: DEFAULT_FILTER }),

      filteredItems: () => {
        const { items, filter } = get();
        return items.filter((item) => {
          if (filter.search) {
            const q = filter.search.toLowerCase();
            if (!item.title.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q) && !item.author.toLowerCase().includes(q)) return false;
          }
          if (filter.status && item.status !== filter.status) return false;
          if (filter.type && item.type !== filter.type) return false;
          if (filter.category && item.category !== filter.category) return false;
          if (filter.author && item.author !== filter.author) return false;
          return true;
        });
      },

      moveStage: (id, status) => {
        const patch: Partial<ContentItem> = { status };
        if (status === 'published') patch.publishedAt = now();
        get().updateItem(id, patch);
      },
    }),
    {
      name: 'content-store-v2',
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

export function newContentItem(): Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'completionRate'> {
  return {
    title: '', subtitle: '', body: '', type: 'feature_article', status: 'draft',
    category: 'Science & Nature', tags: [], author: '', authorId: '',
    ageGroup: '9-11', readingLevel: 'intermediate', locale: 'en', platform: 'web_app',
    priority: 'medium', readTimeTarget: 'medium', seoTitle: '', seoDescription: '',
    slug: '', focusKeyword: '', pullQuote: '', byline: '',
    isFeatured: false, isCoverStory: false, issueVolume: '12', issueNumber: '6', wordCount: 0,
  };
}
