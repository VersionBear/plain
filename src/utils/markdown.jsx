function parseInlineMarkdown(text, keyPrefix) {
  const pattern =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(_([^_]+)_)/;
  const match = text.match(pattern);

  if (!match) {
    return text;
  }

  const [token] = match;
  const index = match.index ?? 0;
  const before = text.slice(0, index);
  const after = text.slice(index + token.length);
  const nodes = [];

  if (before) {
    nodes.push(...toInlineNodes(before, `${keyPrefix}-before`));
  }

  if (match[2] && match[3]) {
    nodes.push(
      <a
        key={`${keyPrefix}-link-${index}`}
        href={match[3]}
        target="_blank"
        rel="noreferrer"
        className="text-ink underline decoration-accent decoration-2 underline-offset-4 transition hover:decoration-ink"
      >
        {toInlineNodes(match[2], `${keyPrefix}-link-text`)}
      </a>,
    );
  } else if (match[5]) {
    nodes.push(
      <code
        key={`${keyPrefix}-code-${index}`}
        className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[0.92em] text-ink"
      >
        {match[5]}
      </code>,
    );
  } else if (match[7] || match[9]) {
    nodes.push(
      <strong
        key={`${keyPrefix}-strong-${index}`}
        className="font-semibold text-ink"
      >
        {toInlineNodes(match[7] ?? match[9], `${keyPrefix}-strong-text`)}
      </strong>,
    );
  } else if (match[11] || match[13]) {
    nodes.push(
      <em key={`${keyPrefix}-em-${index}`} className="italic">
        {toInlineNodes(match[11] ?? match[13], `${keyPrefix}-em-text`)}
      </em>,
    );
  }

  if (after) {
    nodes.push(...toInlineNodes(after, `${keyPrefix}-after`));
  }

  return nodes;
}

function toInlineNodes(text, keyPrefix) {
  const parsed = parseInlineMarkdown(text, keyPrefix);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function renderParagraph(text, key) {
  return (
    <p key={key} className="text-[15px] leading-8 text-ink md:text-base">
      {toInlineNodes(text, `${key}-inline`)}
    </p>
  );
}

export function renderMarkdown(content) {
  if (!content.trim()) {
    return [
      <p
        key="empty"
        className="text-[15px] italic leading-8 text-muted/80 md:text-base"
      >
        Start typing to see your markdown preview here.
      </p>,
    ];
  }

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fenceMatch = line.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      index += 1;
      const codeLines = [];

      while (index < lines.length && !lines[index].match(/^```\s*$/)) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        <pre
          key={`block-${(key += 1)}`}
          className="overflow-x-auto rounded-[22px] border border-line/80 bg-canvas px-4 py-4 text-sm leading-7 text-ink shadow-panel"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const headingClasses = {
        1: 'text-3xl md:text-4xl',
        2: 'text-2xl md:text-[2rem]',
        3: 'text-xl md:text-2xl',
        4: 'text-lg md:text-xl',
        5: 'text-base md:text-lg',
        6: 'text-sm md:text-base',
      };
      const HeadingTag = `h${level}`;

      blocks.push(
        <HeadingTag
          key={`block-${(key += 1)}`}
          className={`font-serif font-medium tracking-calm text-ink ${headingClasses[level]}`}
        >
          {toInlineNodes(text, `heading-${key}`)}
        </HeadingTag>,
      );
      index += 1;
      continue;
    }

    if (/^([-*_])(?:\s*\1){2,}\s*$/.test(line.trim())) {
      blocks.push(
        <hr
          key={`block-${(key += 1)}`}
          className="border-0 border-t border-line/90"
        />,
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];

      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push(
        <blockquote
          key={`block-${(key += 1)}`}
          className="border-l-2 border-accent pl-5 text-muted"
        >
          <div className="space-y-4">
            {renderMarkdown(quoteLines.join('\n'))}
          </div>
        </blockquote>,
      );
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*+]\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ul
          key={`block-${(key += 1)}`}
          className="list-disc space-y-2 pl-6 marker:text-muted"
        >
          {items.map((item, itemIndex) => (
            <li
              key={`unordered-${itemIndex}`}
              className="pl-1 text-[15px] leading-8 md:text-base"
            >
              {toInlineNodes(item, `unordered-${key}-${itemIndex}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ol
          key={`block-${(key += 1)}`}
          className="list-decimal space-y-2 pl-6 marker:text-muted"
        >
          {items.map((item, itemIndex) => (
            <li
              key={`ordered-${itemIndex}`}
              className="pl-1 text-[15px] leading-8 md:text-base"
            >
              {toInlineNodes(item, `ordered-${key}-${itemIndex}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].match(/^(#{1,6})\s+/) &&
      !lines[index].match(/^```/) &&
      !lines[index].match(/^>\s?/) &&
      !lines[index].match(/^[-*+]\s+/) &&
      !lines[index].match(/^\d+\.\s+/) &&
      !lines[index].trim().match(/^([-*_])(?:\s*\1){2,}\s*$/)
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(
      renderParagraph(paragraphLines.join(' '), `block-${(key += 1)}`),
    );
  }

  return blocks;
}
