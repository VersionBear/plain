import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  GripVertical,
  Maximize2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ImageViewer from '../components/editor/ImageViewer';

const DEFAULT_WIDTH = 72;
const MIN_WIDTH = 30;
const MAX_WIDTH = 100;
const DEFAULT_ALIGN = 'center';
const WIDTH_PRESETS = [
  { label: 'S', value: 40, title: 'Small image' },
  { label: 'M', value: 58, title: 'Medium image' },
  { label: 'L', value: 72, title: 'Large image' },
  { label: 'F', value: 100, title: 'Full width image' },
];
const VALID_ALIGNMENTS = new Set(['left', 'center', 'right']);

function clampWidth(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_WIDTH;
  }

  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(numericValue)));
}

function normalizeAlign(value) {
  return VALID_ALIGNMENTS.has(value) ? value : DEFAULT_ALIGN;
}

function parseWidthValue(...values) {
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) {
      continue;
    }

    const match = value.match(/(\d+(?:\.\d+)?)\s*%/);

    if (match) {
      return clampWidth(match[1]);
    }

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      return clampWidth(numericValue);
    }
  }

  return DEFAULT_WIDTH;
}

function getImageAttributes(element) {
  const figure =
    element.tagName === 'FIGURE' ? element : element.closest('figure');
  const image =
    element.tagName === 'IMG' ? element : figure?.querySelector('img');
  const caption =
    figure?.querySelector('figcaption')?.textContent?.trim() ?? '';

  return {
    src: image?.getAttribute('src') || '',
    alt: image?.getAttribute('alt') || caption,
    caption,
    width: parseWidthValue(
      figure?.getAttribute('data-width'),
      figure?.style.getPropertyValue('--plain-image-width'),
      image?.style.width,
    ),
    align: normalizeAlign(
      figure?.getAttribute('data-align') ||
        (figure?.classList.contains('plain-image-align-left')
          ? 'left'
          : figure?.classList.contains('plain-image-align-right')
            ? 'right'
            : DEFAULT_ALIGN),
    ),
  };
}

function PlainImageView({ node, updateAttributes, selected, editor }) {
  const { src, alt, caption, width, align } = node.attrs;
  const normalizedWidth = clampWidth(width);
  const normalizedAlign = normalizeAlign(align);
  const isEditable = editor.isEditable;
  const wrapperRef = useRef(null);
  const resizeStateRef = useRef(null);
  const commitWidthRef = useRef(() => undefined);
  const [draftWidth, setDraftWidth] = useState(normalizedWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    setDraftWidth(normalizedWidth);
  }, [normalizedWidth]);

  const commitWidth = (nextWidth) => {
    const clampedWidth = clampWidth(nextWidth);
    setDraftWidth(clampedWidth);

    if (clampedWidth !== normalizedWidth) {
      updateAttributes({ width: clampedWidth });
    }
  };

  commitWidthRef.current = commitWidth;

  const handlePointerMove = useCallback((event) => {
    const resizeState = resizeStateRef.current;

    if (!resizeState) {
      return;
    }

    const deltaX = event.clientX - resizeState.startX;
    const deltaY = event.clientY - resizeState.startY;
    const nextWidthPx = Math.max(
      0,
      resizeState.startWidthPx + deltaX + deltaY * 0.45,
    );
    const nextWidthPercent = (nextWidthPx / resizeState.containerWidth) * 100;

    setDraftWidth(clampWidth(nextWidthPercent));
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!resizeStateRef.current) {
      return;
    }

    const { currentWidth } = resizeStateRef.current;

    resizeStateRef.current = null;
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    commitWidthRef.current(currentWidth);
  }, [handlePointerMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const setAlign = (nextAlign) => {
    updateAttributes({ align: normalizeAlign(nextAlign) });
  };

  const setWidthPreset = (nextWidth) => {
    commitWidth(nextWidth);
  };

  const setCaption = (event) => {
    updateAttributes({ caption: event.target.value });
  };

  const startResize = (event) => {
    if (!isEditable || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const wrapper = wrapperRef.current;
    const parent = wrapper?.parentElement;
    const wrapperRect = wrapper?.getBoundingClientRect();
    const containerRect = parent?.getBoundingClientRect();

    if (!wrapperRect?.width || !containerRect?.width) {
      return;
    }

    const currentWidth = clampWidth(draftWidth);

    resizeStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidthPx: wrapperRect.width,
      containerWidth: containerRect.width,
      currentWidth,
    };

    setIsResizing(true);
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  if (resizeStateRef.current) {
    resizeStateRef.current.currentWidth = draftWidth;
  }

  return (
    <NodeViewWrapper
      as="figure"
      ref={wrapperRef}
      data-type="plain-image"
      data-align={normalizedAlign}
      data-width={draftWidth}
      style={{ '--plain-image-width': `${draftWidth}%` }}
      className={[
        'plain-image-block',
        `plain-image-align-${normalizedAlign}`,
        selected ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isEditable ? (
        <div contentEditable={false} className="plain-image-controls">
          <button
            type="button"
            className="plain-image-drag-button"
            data-drag-handle
            title="Drag image block"
          >
            <GripVertical size={14} />
          </button>

          <div className="plain-image-segmented-control plain-image-control-group">
            <button
              type="button"
              className={`plain-image-icon-button ${normalizedAlign === 'left' ? 'is-active' : ''}`}
              onClick={() => setAlign('left')}
              title="Align left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              className={`plain-image-icon-button ${normalizedAlign === 'center' ? 'is-active' : ''}`}
              onClick={() => setAlign('center')}
              title="Align center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              className={`plain-image-icon-button ${normalizedAlign === 'right' ? 'is-active' : ''}`}
              onClick={() => setAlign('right')}
              title="Align right"
            >
              <AlignRight size={14} />
            </button>
          </div>

          <div className="plain-image-segmented-control plain-image-preset-group">
            {WIDTH_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`plain-image-preset-button ${draftWidth === preset.value ? 'is-active' : ''}`}
                onClick={() => setWidthPreset(preset.value)}
                title={preset.title}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="plain-image-icon-button"
            onClick={() => setViewerOpen(true)}
            title="View fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      ) : null}

      <div className="plain-image-frame" contentEditable={false}>
        {isEditable && isResizing ? (
          <div className="plain-image-size-tooltip">{draftWidth}%</div>
        ) : null}
        <img
          src={src}
          alt={alt || caption || 'Image'}
          className="plain-image-element"
          draggable="false"
          style={{ cursor: 'pointer' }}
          onClick={() => setViewerOpen(true)}
        />
        {isEditable ? (
          <button
            type="button"
            className="plain-image-resize-handle"
            onPointerDown={startResize}
            title="Resize image"
            aria-label="Resize image"
          />
        ) : null}
      </div>

      {isEditable || caption ? (
        <figcaption className="plain-image-caption-shell">
          {isEditable ? (
            <input
              type="text"
              value={caption}
              onChange={setCaption}
              placeholder="Add a caption"
              className="plain-image-caption-input"
            />
          ) : (
            <span className="plain-image-caption-text">{caption}</span>
          )}
        </figcaption>
      ) : null}

      {viewerOpen && (
        <ImageViewer
          src={src}
          alt={alt || caption || 'Image'}
          caption={caption}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </NodeViewWrapper>
  );
}

const PlainImage = Node.create({
  name: 'plainImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: '',
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
      width: {
        default: DEFAULT_WIDTH,
        parseHTML: (element) => getImageAttributes(element).width,
        renderHTML: (attributes) => ({
          'data-width': clampWidth(attributes.width),
        }),
      },
      align: {
        default: DEFAULT_ALIGN,
        parseHTML: (element) => getImageAttributes(element).align,
        renderHTML: (attributes) => ({
          'data-align': normalizeAlign(attributes.align),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="plain-image"]',
        getAttrs: (element) => getImageAttributes(element),
      },
      {
        tag: 'img[src]',
        getAttrs: (element) => getImageAttributes(element),
      },
    ];
  },

  renderHTML({ node }) {
    const width = clampWidth(node.attrs.width);
    const align = normalizeAlign(node.attrs.align);
    const caption =
      typeof node.attrs.caption === 'string' ? node.attrs.caption.trim() : '';

    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'plain-image',
        'data-width': String(width),
        'data-align': align,
        class: `plain-image-block plain-image-align-${align}`,
        style: `--plain-image-width: ${width}%;`,
      }),
      [
        'img',
        {
          src: node.attrs.src,
          alt: node.attrs.alt || caption || 'Image',
          class: 'plain-image-element',
        },
      ],
      ...(caption
        ? [['figcaption', { class: 'plain-image-caption-text' }, caption]]
        : []),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlainImageView);
  },
});

export default PlainImage;
