import { describe, expect, it } from 'vitest';
import {
  defaultExportSettings,
  mergeExportSettings,
} from '../src/store/useExportStore';
import {
  buildHtmlExportDocument,
  getPdfMarginMm,
  resolveHtmlExportOptions,
  resolvePdfExportOptions,
} from '../src/utils/export';

describe('export settings helpers', () => {
  it('merges new html and pdf defaults into persisted settings', () => {
    const mergedSettings = mergeExportSettings({
      darkMode: true,
      formatSettings: {
        html: { darkMode: true },
        pdf: { pageFormat: 'letter' },
      },
    });

    expect(mergedSettings.darkMode).toBe(true);
    expect(mergedSettings.formatSettings.html).toEqual({
      ...defaultExportSettings.formatSettings.html,
      darkMode: true,
    });
    expect(mergedSettings.formatSettings.pdf).toEqual({
      ...defaultExportSettings.formatSettings.pdf,
      pageFormat: 'letter',
    });
  });

  it('builds html export markup with title and width controls', () => {
    const html = buildHtmlExportDocument(
      {
        title: 'Ship list',
        content: '<p>Hello team.</p>',
      },
      { includeTitle: false, pageWidth: 'compact' },
    );

    expect(html).not.toContain('<h1>Ship list</h1>');
    expect(html).toContain('max-width: 720px;');
    expect(html).toContain('<div class="content"><p>Hello team.</p></div>');
  });

  it('normalizes html and pdf advanced export options', () => {
    expect(resolveHtmlExportOptions({})).toEqual({
      darkMode: false,
      includeTitle: true,
      pageWidth: 'comfortable',
    });

    expect(
      resolvePdfExportOptions({
        pageFormat: 'letter',
        orientation: 'landscape',
        margin: 'wide',
        includeTitle: false,
        pageNumbers: true,
      }),
    ).toEqual({
      scale: 2,
      darkMode: false,
      pageFormat: 'letter',
      orientation: 'landscape',
      margin: 'wide',
      includeTitle: false,
      pageNumbers: true,
    });

    expect(getPdfMarginMm('narrow')).toBe(8);
    expect(getPdfMarginMm('standard')).toBe(14);
    expect(getPdfMarginMm('wide')).toBe(20);
  });
});
