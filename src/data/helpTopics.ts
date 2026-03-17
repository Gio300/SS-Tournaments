/**
 * ButtonMasherz Chatbot help topics - system help, not just tournament rules.
 * SML is one tournament among many. Keywords map to answers.
 */

export interface HelpTopic {
  keywords: string[];
  answer: string;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    keywords: ['how', 'work', 'what', 'buttonmasherz', 'platform', 'site', 'system', 'explain', 'overview', 'intro'],
    answer: `**ButtonMasherz** is a social platform for competitive gaming. It lets you:
• **Create a profile** – Set your username, bio, and save YouTube links
• **Make reels** – Combine clips into highlight reels (manual or auto-add from saved links)
• **Join clans** – Connect with groups, apply to join, or browse clan profiles
• **Watch live** – Multi-view streams with Auto, Manual, or Pro switching
• **Enter tournaments** – SML (Striker Mode League) is one of many tournaments; browse under Tournaments
• **Tiers** – Free, Pro ($4.95/mo), Elite ($19.95/mo), Clan Ultra ($49.99/mo) for ad-free, extra features`,
  },
  {
    keywords: ['profile', 'account', 'username', 'bio', 'edit', 'create profile', 'my profile'],
    answer: `**Profiles:** Go to **Profile** in the nav. You can:
• Set your username and bio
• Save YouTube links – these power **Auto-add** when creating reels
• View your reels and manage saved links
• Sign out`,
  },
  {
    keywords: ['reel', 'reels', 'highlight', 'create reel', 'make reel', 'clip', 'clips'],
    answer: `**Reels** are highlight videos you create from clips:
• **Manual:** Add YouTube URLs one by one, or upload 4–8 video files to combine
• **Auto-add:** If you saved YouTube links in your Profile, use "Auto-add all saved" to add them in one click
• Go to **Reels** → **Create Highlight** or use the link in your Profile`,
  },
  {
    keywords: ['auto', 'auto-add', 'autoadd', 'saved', 'saved links', 'one click'],
    answer: `**Auto-add** lets you add all your saved YouTube links to a reel in one click.
• First, save YouTube URLs in your **Profile** (My YouTube Sources)
• When creating a reel, the "Auto-add all saved" button appears
• Click it to add every saved link as a clip (full video, no trim)
• **Manual** = add clips one by one with URL or file upload`,
  },
  {
    keywords: ['tier', 'tiers', 'pro', 'elite', 'free', 'subscription', 'upgrade', 'premium'],
    answer: `**Tiers:**
• **Free** – Full access, may see ads
• **Pro** ($4.95/mo) – Ad-free, Pro Live features
• **Elite** ($19.95/mo) – All Pro + Elite features
• **Clan Ultra** ($49.99/mo) – Clan-level upgrade, benefits all members`,
  },
  {
    keywords: ['clan', 'clans', 'join', 'apply', 'board', 'server'],
    answer: `**Clans** are groups you can join:
• Browse under **Clans** (boards)
• Some are **open** (join directly), others require **apply** (submit a message)
• Clan profiles show members, reels, and activity
• Clan Ultra is a paid upgrade for clans`,
  },
  {
    keywords: ['tournament', 'tournaments', 'sml', 'striker', 'league', 'rules'],
    answer: `**Tournaments:** ButtonMasherz hosts multiple tournaments. **SML (Striker Mode League)** is one of them.
• Browse all under **More** → **Tournaments**
• For SML-specific rules, see **Rules** and **FAQ**
• Each tournament can have its own rules and format`,
  },
  {
    keywords: ['live', 'stream', 'streaming', 'multi', 'view'],
    answer: `**Live** lets you watch multiple streams:
• **Manual** – Switch views yourself
• **Auto** – Rotate between streams on a timer (15/30/45/60 sec)
• **Pro** – Advanced switching (Pro tier)
• Add streams by YouTube URL`,
  },
  {
    keywords: ['match', 'matches'],
    answer: `**Matches** group reels and streams around a specific event. Create matches to organize content.`,
  },
  {
    keywords: ['community', 'chat', 'discuss'],
    answer: `**Community** is the discussion board. Post and reply – it's social! Note: Community posts are not official rulings; use Rules and FAQ for that.`,
  },
];

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function getHelpReply(userMessage: string): string | null {
  const tokens = tokenize(userMessage);
  if (tokens.length === 0) return null;

  let bestScore = 0;
  let bestTopic: HelpTopic | null = null;

  for (const topic of HELP_TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (tokens.some((t) => t.includes(kw) || kw.includes(t))) score += 2;
      if (userMessage.toLowerCase().includes(kw)) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  if (bestTopic && bestScore >= 2) return bestTopic.answer;
  return null;
}
