const writingPrompts = [
  {
    eyebrow: 'Writing prompt',
    title: 'Write about a small decision that changed your week.',
    body: 'Start with the moment itself, then follow the ripple effects it had on your mood, schedule, or relationships.',
  },
  {
    eyebrow: 'Writing prompt',
    title: 'Describe a room you know by memory alone.',
    body: 'Focus on texture, light, sound, and the tiny details you would miss if you were only listing furniture.',
  },
  {
    eyebrow: 'Writing prompt',
    title: 'Capture a thought you keep returning to lately.',
    body: 'Write it out plainly first, then ask what makes it sticky, urgent, or unfinished.',
  },
  {
    eyebrow: 'Writing prompt',
    title: 'Make a note for your future self one month from now.',
    body: 'Include what you hope is different, what should stay the same, and one thing not to forget.',
  },
];

const dailyTips = [
  {
    eyebrow: 'Tip of the day',
    title: 'Use markdown shortcuts to move faster.',
    body: 'Try `#` for headings, `-` for lists, `[]` for tasks, and `>` for quotes right inside the editor.',
  },
  {
    eyebrow: 'Tip of the day',
    title: 'Pin notes that should stay close.',
    body: 'Pinned notes rise to the top, which is handy for daily logs, active projects, or reference docs.',
  },
  {
    eyebrow: 'Tip of the day',
    title: 'Turn rough ideas into structure early.',
    body: 'A few headings or checklist items can make a note easier to keep going than a single long paragraph.',
  },
  {
    eyebrow: 'Tip of the day',
    title: 'Connect a folder if you want files on disk.',
    body: 'Browser-only notes stay in this browser on this device. A folder gives you Markdown files you can manage yourself.',
  },
];

function getDaySeed(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return year * 10000 + month * 100 + day;
}

export function getDailyEmptyStateMessage(date = new Date()) {
  const seed = getDaySeed(date);
  const usePrompt = seed % 2 === 0;
  const collection = usePrompt ? writingPrompts : dailyTips;
  const item = collection[seed % collection.length];

  return {
    ...item,
    kind: usePrompt ? 'prompt' : 'tip',
  };
}
