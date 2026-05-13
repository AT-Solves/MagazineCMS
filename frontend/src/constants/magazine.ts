export const CONTENT_TYPES = [
  { value: 'feature_article', label: 'Feature Article' },
  { value: 'cover_story', label: 'Cover Story' },
  { value: 'interview', label: 'Interview' },
  { value: 'opinion', label: 'Opinion / Editorial' },
  { value: 'news_brief', label: 'News Brief' },
  { value: 'review', label: 'Review' },
  { value: 'how_to', label: 'How-To Guide' },
  { value: 'profile', label: 'Profile' },
  { value: 'photo_essay', label: 'Photo Essay' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'activity', label: 'Activity' },
  { value: 'story', label: 'Story' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'video', label: 'Video' },
] as const;

export const CONTENT_STATUSES = [
  { value: 'brief',     label: 'Brief',      color: 'default'   },
  { value: 'draft',     label: 'Draft',      color: 'warning'   },
  { value: 'in_review', label: 'In Review',  color: 'info'      },
  { value: 'approved',  label: 'Approved',   color: 'success'   },
  { value: 'scheduled', label: 'Scheduled',  color: 'secondary' },
  { value: 'published', label: 'Published',  color: 'success'   },
  { value: 'archived',  label: 'Archived',   color: 'default'   },
] as const;

export const CATEGORIES = [
  'Science & Nature',
  'Technology',
  'Arts & Creativity',
  'History & Culture',
  'Sports & Adventure',
  'Health & Wellness',
  'Environment',
  'Mathematics',
  'Language & Literature',
  'Social Studies',
  'Music',
  'Animals & Wildlife',
  'Space & Astronomy',
  'Food & Cooking',
  'Travel & Geography',
] as const;

export const AGE_GROUPS = [
  { value: '3-5',  label: '3–5 years (Pre-K)'       },
  { value: '6-8',  label: '6–8 years (Early Reader)' },
  { value: '9-11', label: '9–11 years (Middle Grade)' },
  { value: '12-14',label: '12–14 years (Young Teen)'  },
  { value: '15-18',label: '15–18 years (Teen)'        },
  { value: 'all',  label: 'All Ages'                  },
] as const;

export const READING_LEVELS = [
  { value: 'beginner',     label: 'Beginner'     },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced'     },
] as const;

export const LOCALES = [
  { value: 'en', label: 'English'    },
  { value: 'es', label: 'Spanish'    },
  { value: 'fr', label: 'French'     },
  { value: 'de', label: 'German'     },
  { value: 'zh', label: 'Chinese'    },
  { value: 'ar', label: 'Arabic'     },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese'   },
] as const;

export const PLATFORMS = [
  { value: 'web',     label: 'Web'        },
  { value: 'app',     label: 'App'        },
  { value: 'web_app', label: 'Web + App'  },
  { value: 'print',   label: 'Print'      },
  { value: 'all',     label: 'All Channels' },
] as const;

export const PRIORITIES = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const READ_TIME_TARGETS = [
  { value: 'short',  label: 'Short (< 3 min)',  wordTarget: 450  },
  { value: 'medium', label: 'Medium (3–7 min)', wordTarget: 1000 },
  { value: 'long',   label: 'Long (7–15 min)',  wordTarget: 2200 },
  { value: 'deep',   label: 'Deep (15+ min)',   wordTarget: 4000 },
] as const;

export const WORKFLOW_STAGES = [
  'brief', 'draft', 'in_review', 'approved', 'scheduled', 'published',
] as const;

export type ContentStatus = typeof CONTENT_STATUSES[number]['value'];
export type WorkflowStage = typeof WORKFLOW_STAGES[number];
export type ContentTypeValue = typeof CONTENT_TYPES[number]['value'];
export type Category = typeof CATEGORIES[number];
export type Locale = typeof LOCALES[number]['value'];
export type Platform = typeof PLATFORMS[number]['value'];

export const STATUS_COLOR_MAP: Record<string, 'default' | 'warning' | 'info' | 'success' | 'secondary' | 'error'> = {
  brief:     'default',
  draft:     'warning',
  in_review: 'info',
  approved:  'success',
  scheduled: 'secondary',
  published: 'success',
  archived:  'default',
};

export const NEXT_STAGE: Record<WorkflowStage, WorkflowStage | null> = {
  brief:     'draft',
  draft:     'in_review',
  in_review: 'approved',
  approved:  'scheduled',
  scheduled: 'published',
  published: null,
};

export const PREV_STAGE: Record<WorkflowStage, WorkflowStage | null> = {
  brief:     null,
  draft:     'brief',
  in_review: 'draft',
  approved:  'in_review',
  scheduled: 'approved',
  published: 'scheduled',
};
