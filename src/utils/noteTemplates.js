import { PLAN_TIERS, hasPlanAccess } from './planFeatures';
import { markdownToHtml } from './noteMarkdown';
import { makeEmptyNote } from './notes';

function formatDailyNoteTitle(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export const NOTE_TEMPLATES = [
  {
    id: 'daily-note',
    label: 'Daily Note',
    description: 'A calm daily page for priorities, notes, momentum, and tomorrow.',
    defaultTitle: ({ date }) => formatDailyNoteTitle(date),
    tags: ['daily'],
    highlights: ['Focus', 'Wins', 'Tomorrow'],
    markdown: `
> Start with what matters most today, then leave your future self a clear runway.

## Focus

- Top priority:
- If today goes well, what gets finished?

## Notes

- Key detail:
- Decision to remember:
- Loose thought worth keeping:

## Wins

- What moved forward today?
- What felt easier than expected?

## Tomorrow

- First thing to pick up:
- One thing to protect time for:
`.trim(),
    minPlan: PLAN_TIERS.PRO,
  },
  {
    id: 'meeting-notes',
    label: 'Meeting Notes',
    description: 'Keep meetings sharp with clear agenda, decisions, and next steps.',
    defaultTitle: () => 'Meeting notes',
    tags: ['meeting'],
    highlights: ['Agenda', 'Decisions', 'Action items'],
    markdown: `
> Capture the turning points, not every sentence.

## Agenda

- Goal of the meeting:
- Topics to cover:

## Discussion

- Main ideas:
- Decisions made:
- Risks or blockers:

## Action items

- [ ] Owner -
- [ ] Owner -
`.trim(),
    minPlan: PLAN_TIERS.PRO,
  },
  {
    id: 'project-brief',
    label: 'Project Brief',
    description: 'Frame a project clearly before the work starts to sprawl.',
    defaultTitle: () => 'Project brief',
    tags: ['project'],
    highlights: ['Goal', 'Scope', 'Checklist'],
    markdown: `
> Get the shape of the work right before you optimize the details.

## Goal

- What are we trying to achieve?
- What changes when this is done?

## Scope

- In scope:
- Out of scope:

## Open questions

- What still needs an answer?
- What assumption feels risky?

## Checklist

- [ ] Define success
- [ ] Confirm owners
- [ ] Ship first version
`.trim(),
    minPlan: PLAN_TIERS.PRO,
  },
  {
    id: 'reading-notes',
    label: 'Reading Notes',
    description: 'Turn articles, books, and essays into reusable thinking instead of scraps.',
    defaultTitle: () => 'Reading notes',
    tags: ['reading'],
    highlights: ['Key ideas', 'Quotes', 'Follow-ups'],
    markdown: `
> Save what changed your mind, not just what sounded clever.

## Source

- Title:
- Author:
- Link or reference:

## Key ideas

- Idea 1:
- Idea 2:
- Why it matters:

## Quotes

> Add the line you want to remember here.

## Follow-ups

- [ ] Revisit
- [ ] Share
- [ ] Turn into a note or project
`.trim(),
    minPlan: PLAN_TIERS.PRO,
  },
  {
    id: 'weekly-review',
    label: 'Weekly Review',
    description: 'Step back, notice the pattern of the week, and plan the next one well.',
    defaultTitle: () => 'Weekly review',
    tags: ['review'],
    highlights: ['Wins', 'Lessons', 'Next week'],
    markdown: `
> Reflection is useful when it leads to a better next week, not just a longer note.

## Wins

- What actually moved?
- What felt meaningful?

## Lessons

- What would you repeat?
- What would you do earlier?

## Blockers

- What slowed things down?
- What needs a decision or support?

## Next week

- [ ] Protect time for the most important work
- [ ] Follow up on one open loop
- [ ] Start the week with a clear first step
`.trim(),
    minPlan: PLAN_TIERS.PRO,
  },
];

const templatesById = new Map(
  NOTE_TEMPLATES.map((template) => [template.id, template]),
);

export function getNoteTemplate(templateId) {
  return templatesById.get(templateId) || null;
}

export function hasTemplateAccess(templateId, planTier = PLAN_TIERS.FREE) {
  const template = getNoteTemplate(templateId);

  if (!template) {
    return false;
  }

  return !template.minPlan || hasPlanAccess(planTier, template.minPlan);
}

export function createNoteFromTemplate(templateId, options = {}) {
  const template = getNoteTemplate(templateId);

  if (!template) {
    return makeEmptyNote();
  }

  const title =
    typeof template.defaultTitle === 'function'
      ? template.defaultTitle(options)
      : template.defaultTitle || '';

  return makeEmptyNote({
    title,
    content: markdownToHtml(template.markdown),
    tags: template.tags,
  });
}
