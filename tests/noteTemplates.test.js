import { describe, expect, it } from 'vitest';
import { PLAN_TIERS } from '../src/utils/planFeatures';
import {
  NOTE_TEMPLATES,
  createNoteFromTemplate,
  hasTemplateAccess,
} from '../src/utils/noteTemplates';

const templateExpectations = {
  'daily-note': {
    title: 'April 1, 2026',
    tag: 'daily',
    sections: ['Focus', 'Notes', 'Wins', 'Tomorrow'],
  },
  'meeting-notes': {
    title: 'Meeting notes',
    tag: 'meeting',
    sections: ['Agenda', 'Discussion', 'Action items'],
  },
  'project-brief': {
    title: 'Project brief',
    tag: 'project',
    sections: ['Goal', 'Scope', 'Open questions', 'Checklist'],
  },
  'reading-notes': {
    title: 'Reading notes',
    tag: 'reading',
    sections: ['Source', 'Key ideas', 'Quotes', 'Follow-ups'],
  },
  'weekly-review': {
    title: 'Weekly review',
    tag: 'review',
    sections: ['Wins', 'Lessons', 'Blockers', 'Next week'],
  },
};

describe('note template helpers', () => {
  it('requires a paid plan for starter templates', () => {
    expect(hasTemplateAccess('daily-note', PLAN_TIERS.FREE)).toBe(false);
    expect(hasTemplateAccess('daily-note', PLAN_TIERS.PRO)).toBe(true);
    expect(hasTemplateAccess('daily-note', PLAN_TIERS.FOUNDER)).toBe(true);
  });

  it('creates the daily note with the current local date title', () => {
    const note = createNoteFromTemplate('daily-note', {
      date: new Date('2026-04-01T10:00:00.000Z'),
    });

    expect(note.title).toBe('April 1, 2026');
    expect(note.tags).toEqual(['daily']);
  });

  it('creates each starter template with the expected title, tags, and sections', () => {
    for (const template of NOTE_TEMPLATES) {
      const note = createNoteFromTemplate(template.id, {
        date: new Date('2026-04-01T10:00:00.000Z'),
      });
      const expectation = templateExpectations[template.id];

      expect(note.title).toBe(expectation.title);
      expect(note.tags).toEqual([expectation.tag]);

      for (const section of expectation.sections) {
        expect(note.content).toContain(`<h2>${section}</h2>`);
      }
    }
  });
});
