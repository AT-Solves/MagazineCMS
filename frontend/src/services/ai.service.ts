// ─── Types ────────────────────────────────────────────────────────────────────

export interface AITitleSuggestion {
  title: string;
  score: number;
  reason: string;
}

export interface AIOutlineSection {
  heading: string;
  description: string;
  wordTarget: number;
  existing: boolean; // true = detected in current body
}

export interface AIReadabilityResult {
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  score: number;
  gradeLevel: string;
  avgSentenceLen: number;
  longWordPct: number;
  passiveCount: number;
  tips: string[];
}

export interface AIToneResult {
  detected: string;
  brandAlignment: number;
  recommendations: string[];
}

export interface AIContentSuggestions {
  titles: AITitleSuggestion[];
  outline: AIOutlineSection[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  readability: AIReadabilityResult;
  tone: AIToneResult;
  analyzedWordCount: number; // words in body that were actually analyzed
}

export interface AIImproveResult {
  improved: string;
  changes: string[];
}

// ─── Text Analysis Utilities ───────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'this','that','these','those','it','its','we','our','you','your','they',
  'their','he','his','she','her','i','me','my','us','not','no','so','if',
  'about','after','before','also','more','up','can','all','than','then','when',
  'what','which','who','how','there','here','into','out','just','like','very',
]);

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sentences(text: string): string[] {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
}

function words(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s'-]/g, '').split(/\s+/).filter((w) => w.length > 1);
}

function extractKeywords(title: string, body: string, topN = 10): string[] {
  const bodyText = stripHtml(body);
  const allText = `${title} ${title} ${bodyText}`; // double title for weight
  const ws = words(allText).filter((w) => !STOP_WORDS.has(w) && w.length > 3);
  const freq: Record<string, number> = {};
  for (const w of ws) freq[w] = (freq[w] ?? 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

function existingHeadings(body: string): string[] {
  const matches = body.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/gi) ?? [];
  return matches.map((m) => m.replace(/<[^>]*>/g, '').trim()).filter(Boolean);
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const vowels = word.match(/[aeiouy]+/g);
  return Math.max(1, vowels ? vowels.length : 1);
}

function analyzeReadability(body: string): AIReadabilityResult {
  const text = stripHtml(body);
  if (!text.trim()) {
    return { level: 'Beginner', score: 80, gradeLevel: 'Grade 3–5', avgSentenceLen: 0, longWordPct: 0, passiveCount: 0, tips: ['Start writing your content to receive readability analysis.'] };
  }

  const sents = sentences(text);
  const ws = words(text);
  const avgSentenceLen = sents.length > 0 ? Math.round(ws.length / sents.length) : 15;
  const longWords = ws.filter((w) => countSyllables(w) >= 3);
  const longWordPct = ws.length > 0 ? Math.round((longWords.length / ws.length) * 100) : 0;

  // Flesch-Kincaid grade approximation
  const fkGrade = avgSentenceLen * 0.39 + longWordPct * 0.11 - 15.59;
  const score = Math.max(10, Math.min(100, Math.round(100 - fkGrade * 6)));

  const passivePatterns = /(was|were|is|are|been)\s+\w+ed\b/gi;
  const passiveCount = (text.match(passivePatterns) ?? []).length;

  const level: AIReadabilityResult['level'] = score >= 70 ? 'Beginner' : score >= 45 ? 'Intermediate' : 'Advanced';
  const gradeLevel = score >= 70 ? 'Grade 3–5' : score >= 45 ? 'Grade 6–8' : 'Grade 9+';

  const tips: string[] = [];
  if (avgSentenceLen > 20) tips.push(`Average sentence length is ${avgSentenceLen} words — aim for under 18 for young readers.`);
  if (longWordPct > 20) tips.push(`${longWordPct}% of words have 3+ syllables — replace complex words with simpler alternatives.`);
  if (passiveCount > 2) tips.push(`Found ${passiveCount} passive constructions — switch to active voice for better engagement.`);
  if (sents.length < 3) tips.push('Write more content to get a meaningful readability score.');
  if (tips.length === 0) tips.push('Great readability! Content is clear and well-paced for your target audience.');

  return { level, score, gradeLevel, avgSentenceLen, longWordPct, passiveCount, tips };
}

function buildTitles(title: string, body: string, type: string, category: string, ageGroup: string): AITitleSuggestion[] {
  const keywords = extractKeywords(title, body, 6);
  const topKw = keywords[0] ?? title.split(' ')[0] ?? 'Topic';
  const kw2 = keywords[1] ?? category;
  const bodyText = stripHtml(body);
  const hasStat = /\d+%|\d+ (species|types|ways|steps|facts|tips)/i.test(bodyText);
  const isYoung = ageGroup.startsWith('3') || ageGroup.startsWith('6');
  const titleWords = title.trim() || topKw;

  const patterns: AITitleSuggestion[] = [
    {
      title: type === 'how_to'
        ? `How to ${titleWords.replace(/^how to /i, '')}: A Step-by-Step Guide for ${isYoung ? 'Kids' : 'Young Readers'}`
        : `${titleWords}: What Every ${isYoung ? 'Child' : 'Young Reader'} Should Know`,
      score: 94,
      reason: `Uses your exact topic "${topKw}" with an audience-specific promise`,
    },
    {
      title: hasStat
        ? `${titleWords} — ${bodyText.match(/\d+\s+\w+/)?.[0] ?? keywords.slice(0, 2).join(' & ')} You Need to Know`
        : `The Complete Guide to ${titleWords}: ${kw2} Explained Simply`,
      score: 89,
      reason: hasStat ? 'Numeric hook extracted from your content boosts click-through' : 'Complete guide framing sets authority and scope',
    },
    {
      title: `Inside ${titleWords}: ${keywords.slice(1, 3).join(', ') || category} Explored`,
      score: 85,
      reason: `"Inside" framing with your key themes "${keywords.slice(1, 3).join(', ')}" signals depth`,
    },
    {
      title: `Why ${titleWords} ${type === 'quiz' ? 'Challenges Everything You Think You Know' : `Matters More Than You Think`}`,
      score: 82,
      reason: 'Curiosity gap using your topic drives higher open rates',
    },
    {
      title: `${keywords.slice(0, 3).join(', ')}: The ${new Date().getFullYear()} Guide for ${category} Lovers`,
      score: 78,
      reason: `Multi-keyword title using "${keywords.slice(0, 3).join(', ')}" from your content — strong for SEO`,
    },
  ];

  return patterns;
}

function buildOutline(type: string, category: string, body: string): AIOutlineSection[] {
  const existing = existingHeadings(body);
  const bodyText = stripHtml(body);
  const hasContent = bodyText.length > 50;

  const templates: Record<string, AIOutlineSection[]> = {
    how_to: [
      { heading: 'Introduction — Why This Matters', description: 'Hook with a relatable scenario and the main benefit readers will gain.', wordTarget: 120, existing: false },
      { heading: 'What You Will Need', description: 'List materials, prerequisites, or background knowledge.', wordTarget: 80, existing: false },
      { heading: 'Step 1 — Getting Started', description: 'First concrete action with clear instructions.', wordTarget: 180, existing: false },
      { heading: 'Step 2 — The Core Process', description: 'Main technique or procedure; use numbered sub-steps.', wordTarget: 300, existing: false },
      { heading: 'Step 3 — Finishing & Checking', description: 'Quality checks and common refinements.', wordTarget: 180, existing: false },
      { heading: 'Troubleshooting Common Problems', description: 'Address the top 3 issues readers encounter.', wordTarget: 150, existing: false },
      { heading: 'What to Try Next', description: 'Related activities and further reading links.', wordTarget: 100, existing: false },
    ],
    interview: [
      { heading: 'Meet the Expert', description: `Brief bio and why their perspective on ${category} is unique.`, wordTarget: 150, existing: false },
      { heading: 'Their Journey', description: 'How they arrived at their field; personal stories.', wordTarget: 220, existing: false },
      { heading: `Deep Dive: ${category}`, description: 'Core interview questions on the main topic.', wordTarget: 400, existing: false },
      { heading: 'Challenges & Lessons', description: 'Honest reflections on setbacks and what they learned.', wordTarget: 200, existing: false },
      { heading: 'Advice for Young Readers', description: 'Practical advice and inspiration for the audience.', wordTarget: 150, existing: false },
    ],
    quiz: [
      { heading: 'Introduction & Challenge', description: 'Set up the quiz topic and what readers will test.', wordTarget: 100, existing: false },
      { heading: 'Warm-Up Questions (1–3)', description: 'Easier questions to build confidence.', wordTarget: 150, existing: false },
      { heading: 'Main Questions (4–8)', description: 'Core knowledge questions on the topic.', wordTarget: 300, existing: false },
      { heading: 'Challenge Round (9–10)', description: 'Harder questions for advanced readers.', wordTarget: 150, existing: false },
      { heading: 'Answers & Explanations', description: 'Correct answers with brief explanations that teach.', wordTarget: 200, existing: false },
    ],
    story: [
      { heading: 'Opening Scene', description: 'Hook readers immediately — start in the middle of the action.', wordTarget: 200, existing: false },
      { heading: 'Meet the Characters', description: 'Introduce protagonist and key characters naturally through action.', wordTarget: 250, existing: false },
      { heading: 'The Problem', description: 'Establish the central conflict or challenge.', wordTarget: 200, existing: false },
      { heading: 'Rising Action', description: 'Complications that build tension and stakes.', wordTarget: 400, existing: false },
      { heading: 'Climax', description: 'The decisive moment — the most exciting part of the story.', wordTarget: 300, existing: false },
      { heading: 'Resolution', description: 'How things are resolved; what the character learns.', wordTarget: 200, existing: false },
    ],
  };

  const defaultSections: AIOutlineSection[] = [
    { heading: 'Introduction', description: `Set the scene — why ${category} matters right now and what readers will discover.`, wordTarget: 150, existing: false },
    { heading: 'Background & Context', description: 'Give readers the essential knowledge needed to follow along.', wordTarget: 280, existing: false },
    { heading: `Key Facts About ${category}`, description: 'The main findings or insights, supported by evidence.', wordTarget: 350, existing: false },
    { heading: 'Real-World Examples', description: 'Two or three concrete examples that bring the topic to life.', wordTarget: 280, existing: false },
    { heading: 'Expert Perspectives', description: 'Quotes or data from credible sources.', wordTarget: 180, existing: false },
    { heading: 'What You Can Do', description: 'Practical takeaways and actions readers can take.', wordTarget: 160, existing: false },
    { heading: 'Conclusion', description: 'Recap the main message and leave readers with something to think about.', wordTarget: 120, existing: false },
  ];

  const sections = (templates[type] ?? defaultSections).map((section) => ({
    ...section,
    existing: existing.some((h) => h.toLowerCase().includes(section.heading.split(' ')[0].toLowerCase()) || section.heading.toLowerCase().includes(h.toLowerCase().split(' ')[0])),
  }));

  // If body has content but no headings, note that structure could be added
  if (hasContent && existing.length === 0) {
    sections[0] = { ...sections[0], description: sections[0].description + ' (Your current opening paragraph can anchor this section.)' };
  }

  return sections;
}

function buildTags(title: string, body: string, category: string, type: string): string[] {
  const keywords = extractKeywords(title, body, 12);

  const typeExtra: Record<string, string[]> = {
    feature_article: ['feature', 'in-depth'],
    cover_story:     ['cover', 'exclusive'],
    interview:       ['interview', 'q&a'],
    how_to:          ['how-to', 'guide', 'tutorial'],
    quiz:            ['quiz', 'interactive', 'test-yourself'],
    review:          ['review', 'recommendation'],
    story:           ['story', 'fiction'],
    activity:        ['activity', 'hands-on', 'project'],
  };

  const categoryBase: Record<string, string[]> = {
    'Science & Nature':    ['science', 'nature', 'stem'],
    'Technology':          ['technology', 'digital', 'innovation'],
    'Arts & Creativity':   ['arts', 'creativity', 'design'],
    'History & Culture':   ['history', 'culture', 'heritage'],
    'Sports & Adventure':  ['sports', 'adventure', 'fitness'],
    'Health & Wellness':   ['health', 'wellness'],
    'Environment':         ['environment', 'sustainability', 'eco'],
    'Mathematics':         ['maths', 'stem', 'logic'],
    'Space & Astronomy':   ['space', 'astronomy', 'science'],
    'Language & Literature':['reading', 'literature', 'writing'],
    'Animals & Wildlife':  ['animals', 'wildlife', 'nature'],
  };

  const fromContent = keywords.filter((k) => k.length > 3 && !STOP_WORDS.has(k));
  const fromCategory = categoryBase[category] ?? [];
  const fromType = typeExtra[type] ?? ['article'];

  return [...new Set([...fromContent.slice(0, 7), ...fromCategory.slice(0, 3), ...fromType])].slice(0, 12);
}

function buildSeoDescription(title: string, body: string, category: string, ageGroup: string): string {
  const text = stripHtml(body);
  const firstSentence = sentences(text)[0] ?? '';
  const ageLabel = ageGroup === 'all' ? 'all ages' : `ages ${ageGroup}`;

  if (firstSentence.length > 60) {
    return `${firstSentence.slice(0, 120).trimEnd()}… Perfect for curious readers ${ageLabel}.`.slice(0, 160);
  }
  const keywords = extractKeywords(title, body, 3).join(', ');
  return `Explore ${title.toLowerCase()} — ${category.toLowerCase()} content covering ${keywords}. Written for readers ${ageLabel}.`.slice(0, 160);
}

function applyInstruction(text: string, instruction: string, type: string): AIImproveResult {
  const lower = instruction.toLowerCase();
  const plainText = stripHtml(text);

  // ── Simplify ───────────────────────────────────────────────────────────────
  if (/simpl|easy|young|kid|child|6.year|7.year|8.year|beginner|basic/i.test(lower)) {
    const sents = sentences(plainText);
    const simplified = sents.map((s) => {
      const ws = s.split(' ');
      if (ws.length > 15) {
        const mid = Math.floor(ws.length / 2);
        return `${ws.slice(0, mid).join(' ')}. ${ws.slice(mid).join(' ')}`;
      }
      return s;
    }).join('. ');
    return {
      improved: simplified,
      changes: [
        'Split sentences longer than 15 words into two',
        'Simplified structure for younger readers',
        'Maintained core message while reducing complexity',
      ],
    };
  }

  // ── Shorten / Summarise ────────────────────────────────────────────────────
  if (/short|brief|concis|summar|compact|trim/i.test(lower)) {
    const sents = sentences(plainText);
    const kept = sents.filter((_, i) => i % 2 === 0 || i === sents.length - 1);
    return {
      improved: kept.join('. ') + '.',
      changes: [
        `Reduced from ${sents.length} to ${kept.length} sentences`,
        'Retained opening and closing for context',
        'Removed supporting detail — add back selectively as needed',
      ],
    };
  }

  // ── More engaging / exciting ───────────────────────────────────────────────
  if (/engag|excit|lively|dynamic|energet|compell|hook/i.test(lower)) {
    const sents = sentences(plainText);
    let improved = sents[0]
      ? `Did you know? ${sents[0]}!`
      : '';
    improved += sents.slice(1, -1).join('. ');
    improved += sents.length > 1 ? ` Here's what makes this incredible: ${sents[sents.length - 1]}` : '';
    return {
      improved: improved || plainText,
      changes: [
        'Added curiosity hook to opening sentence',
        'Converted closing statement to a discovery reveal',
        'Increased energy through direct address and exclamation',
      ],
    };
  }

  // ── Active voice ───────────────────────────────────────────────────────────
  if (/active|passive|voice|direct/i.test(lower)) {
    const improved = plainText
      .replace(/\b(was|were)\s+(\w+ed)\b/g, (_, _aux, verb) => verb)
      .replace(/\b(is|are)\s+being\s+(\w+ed)\b/g, (_, _aux, verb) => verb + 's');
    return {
      improved,
      changes: [
        'Removed auxiliary verbs from passive constructions',
        'Reframed sentences to lead with the subject acting',
        'Review each change — some may need manual adjustment',
      ],
    };
  }

  // ── SEO optimise ──────────────────────────────────────────────────────────
  if (/seo|search|keyword|optimis|rank/i.test(lower)) {
    const kws = extractKeywords(text, '', 3);
    const improved = `${kws[0] ? kws[0].charAt(0).toUpperCase() + kws[0].slice(1) + ': ' : ''}${plainText}`;
    return {
      improved,
      changes: [
        `Added primary keyword "${kws[0]}" to the opening`,
        'Ensure keyword appears naturally 2–3 more times in the full article',
        `Secondary keywords detected: ${kws.slice(1).join(', ')}`,
      ],
    };
  }

  // ── Formal / professional ─────────────────────────────────────────────────
  if (/formal|professional|academ|scholar/i.test(lower)) {
    const improved = plainText
      .replace(/\bdon't\b/g, 'do not')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bwon't\b/g, 'will not')
      .replace(/\bit's\b/g, 'it is')
      .replace(/\bthat's\b/g, 'that is')
      .replace(/\bI'm\b/g, 'I am');
    return {
      improved,
      changes: [
        'Expanded contractions to formal equivalents',
        'Maintained content structure and argument',
        'Review tone throughout for consistency',
      ],
    };
  }

  // ── Add examples ──────────────────────────────────────────────────────────
  if (/example|illustrat|case studi|instance|show/i.test(lower)) {
    const kws = extractKeywords(text, '', 2);
    const improved = `${plainText}\n\nFor example, consider how ${kws[0] ?? 'this concept'} appears in everyday life. When ${kws[1] ?? 'we look closely'}, we can see clear patterns that make ${kws[0] ?? 'the topic'} both relevant and fascinating.`;
    return {
      improved,
      changes: [
        'Added example paragraph using keywords from your content',
        'Connected abstract ideas to real-world context',
        'Expand the example with a specific scenario from your research',
      ],
    };
  }

  // ── Headline / Title rewrite ───────────────────────────────────────────────
  if (/headline|title|heading|subject line/i.test(lower)) {
    const kws = extractKeywords(text, '', 4);
    const headline = `${kws[0]?.charAt(0).toUpperCase()}${kws[0]?.slice(1) ?? 'Your Topic'}: ${kws.slice(1, 3).join(' & ')} Explained for ${type === 'how_to' ? 'Beginners' : 'Young Readers'}`;
    return {
      improved: headline,
      changes: [
        `Extracted top keywords from content: "${kws.slice(0, 4).join('", "')}"`,
        'Applied headline formula: Primary Keyword + Secondary Keywords + Audience',
        'Test multiple versions with your editorial team',
      ],
    };
  }

  // ── Default: general polish ────────────────────────────────────────────────
  const sents = sentences(plainText);
  const polished = sents.map((s, i) => {
    if (i === 0) return s.trim().charAt(0).toUpperCase() + s.trim().slice(1);
    return s.trim();
  }).join('. ');

  return {
    improved: polished || plainText,
    changes: [
      'Applied capitalisation and punctuation consistency',
      'Trimmed trailing whitespace and formatting artefacts',
      `Tip: Try a more specific instruction like "make it simpler for 8-year-olds", "shorten to 3 sentences", or "use active voice".`,
    ],
  };
}

// ─── Field-level suggestion helpers ──────────────────────────────────────────

export interface AIFieldSuggestion {
  value: string;
  reason: string;
}

type FieldContext = {
  title?: string;
  subtitle?: string;
  body?: string;
  category?: string;
  type?: string;
  tags?: string[];
  ageGroup?: string;
  filename?: string;
  platform?: string;
  videoId?: string;
};

function suggestField(fieldType: string, _currentValue: string, ctx: FieldContext): AIFieldSuggestion {
  const {
    title = '', subtitle = '', body = '', category = '',
    type = 'feature_article', ageGroup = 'all',
    filename = '', platform = '', videoId = '',
  } = ctx;

  switch (fieldType) {
    case 'title': {
      const s = buildTitles(title || 'Your Topic', body, type, category, ageGroup);
      return { value: s[0].title, reason: s[0].reason };
    }
    case 'subtitle': {
      const kws = extractKeywords(title, body, 3);
      const topic = title.toLowerCase() || kws[0] || 'this topic';
      const cat = category.toLowerCase() || 'learning';
      return {
        value: `Discover how ${topic} is shaping the world of ${cat} today.`,
        reason: 'Deck expands the headline promise and connects to category context',
      };
    }
    case 'byline': {
      const deptMap: Record<string, string> = {
        'Science & Nature': 'Science', 'Technology': 'Technology',
        'Arts & Creativity': 'Arts & Culture', 'History & Culture': 'History',
        'Sports & Adventure': 'Sports', 'Health & Wellness': 'Health',
        'Environment': 'Environment', 'Mathematics': 'Maths',
        'Space & Astronomy': 'Science', 'Animals & Wildlife': 'Nature',
      };
      const dept = deptMap[category] ?? 'Editorial';
      return { value: `By the ${dept} Team`, reason: 'Standard byline for magazine editorial content' };
    }
    case 'pull_quote': {
      const sents = sentences(stripHtml(body));
      if (!sents.length) {
        return { value: `${title || 'This topic'} is one of the most fascinating subjects in ${category || 'our world'}.`, reason: 'Generated from title — edit when body is written' };
      }
      const best = [...sents].sort((a, b) => {
        const score = (s: string) => (s.includes('!') ? 2 : 0) + (s.split(' ').length > 10 ? 1 : 0) + (s.toLowerCase().includes('discover') || s.toLowerCase().includes('incredible') ? 1 : 0);
        return score(b) - score(a);
      })[0];
      return { value: best, reason: 'Most engaging sentence extracted from your body content' };
    }
    case 'seo_title': {
      const base = title || 'Your Article';
      return { value: `${base} | ${category || 'Magazine'}`.slice(0, 60), reason: 'Format: Article Title | Category (max 60 chars)' };
    }
    case 'seo_description':
      return { value: buildSeoDescription(title, body, category, ageGroup), reason: 'Built from title and first sentence of your body' };
    case 'focus_keyword': {
      const kws = extractKeywords(title, body, 1);
      const fallback = title.split(/\s+/).find((w) => !STOP_WORDS.has(w.toLowerCase()) && w.length > 3) ?? category.split(' ')[0];
      return { value: kws[0] ?? fallback?.toLowerCase() ?? '', reason: 'Most frequent significant keyword from title and body' };
    }
    case 'alt_text': {
      const clean = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
      return { value: clean || `${category || 'Magazine'} article illustration`, reason: 'Cleaned filename — add specific visual details for better accessibility' };
    }
    case 'caption': {
      const subj = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
      return { value: `${subj ? subj.charAt(0).toUpperCase() + subj.slice(1) : 'Image'} — ${category || 'editorial'} content`, reason: 'Subject + section context caption format' };
    }
    case 'image_title': {
      const kws = extractKeywords(title, body, 2);
      const suggestion = title || kws.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' ') || category;
      return { value: suggestion, reason: 'Derived from article title or top content keywords' };
    }
    case 'image_subtitle':
      return { value: subtitle || category || 'Magazine Content', reason: 'Article subtitle or category used for image overlay' };
    case 'video_title': {
      const base = title || `${category || 'Educational'} Content`;
      if (platform && videoId) {
        return { value: `${base} — ${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`, reason: 'Title format: article context + platform' };
      }
      return { value: `Video: ${base}`, reason: 'Standard video asset title format' };
    }
    case 'tags': {
      const generated = buildTags(title, body, category, type);
      return { value: generated.slice(0, 6).join(', '), reason: `Extracted from content keywords and ${category} category tags` };
    }
    default:
      return { value: _currentValue, reason: 'No suggestion available for this field type' };
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API_BASE  = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function generateSuggestions(params: {
  title: string;
  body: string;
  type: string;
  category: string;
  ageGroup?: string;
}): Promise<AIContentSuggestions> {
  const { title, body, type, category, ageGroup = 'all' } = params;

  if (DEMO_MODE) {
    await delay(900 + Math.random() * 500);
    const bodyText = stripHtml(body);
    const keywords = extractKeywords(title, body, 4);
    const seoTitle = `${title || 'Your Content'} | ${category}`.slice(0, 60);

    return {
      titles:           buildTitles(title, body, type, category, ageGroup),
      outline:          buildOutline(type, category, body),
      tags:             buildTags(title, body, category, type),
      seoTitle,
      seoDescription:   buildSeoDescription(title, body, category, ageGroup),
      readability:      analyzeReadability(body),
      analyzedWordCount: words(bodyText).length,
      tone: {
        detected: words(bodyText).length < 50
          ? 'Insufficient content to detect tone'
          : keywords.some((k) => ['discover','explore','amazing','incredible'].includes(k))
            ? 'Exploratory & Engaging'
            : 'Informative & Factual',
        brandAlignment: words(bodyText).length < 30 ? 0 : Math.min(100, 72 + Math.floor(words(bodyText).length / 15)),
        recommendations: [
          words(bodyText).length < 100
            ? 'Write at least 150 words before tone analysis becomes meaningful.'
            : 'Add one personal anecdote or direct reader address ("you") per 200 words.',
          'Use second-person ("you", "your") to increase reader connection.',
        ],
      },
    };
  }

  const res = await fetch(`${API_BASE}/ai/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('AI service unavailable');
  return res.json();
}

export async function suggestFieldValue(params: {
  fieldType: string;
  currentValue: string;
  context: FieldContext;
}): Promise<AIFieldSuggestion> {
  const { fieldType, currentValue, context } = params;

  if (DEMO_MODE) {
    await delay(250 + Math.random() * 300);
    return suggestField(fieldType, currentValue, context);
  }

  const res = await fetch(`${API_BASE}/ai/suggest-field`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('AI field suggestion unavailable');
  return res.json();
}

export async function improveText(params: {
  text: string;
  instruction: string;
  type: string;
  ageGroup?: string;
}): Promise<AIImproveResult> {
  const { text, instruction, type } = params;

  if (DEMO_MODE) {
    await delay(600 + Math.random() * 400);
    if (!text.trim()) {
      return {
        improved: '',
        changes: ['No content to improve. Start writing in the body editor first.'],
      };
    }
    return applyInstruction(text, instruction, type);
  }

  const res = await fetch(`${API_BASE}/ai/improve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('AI service unavailable');
  return res.json();
}
