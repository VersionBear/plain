import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  Terminal,
  Heading1,
  Heading2,
  Quote,
} from 'lucide-react';
import clsx from 'clsx';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Detect mobile: narrow viewport OR coarse primary pointer (touch device).
 * Runs client-side only.
 */
function getIsMobile() {
  if (typeof window === 'undefined') return false;
  const isNarrow = window.innerWidth < 768;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  return isNarrow || isCoarse;
}

function FormattingBubbleMenu({ editor }) {
  const showFormattingToolbar = useSettingsStore(
    (state) => state.showFormattingToolbar,
  );
  const toolbarRef = useRef(null);
  const tippyRef = useRef(null);
  const debounceRef = useRef(null);
  const [isMobile, setIsMobile] = useState(getIsMobile);

  // ── Mobile detection: re-evaluate on resize and pointer changes ──
  useEffect(() => {
    const check = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', check);
    const mql = window.matchMedia('(pointer: coarse)');
    mql.addEventListener?.('change', check);
    return () => {
      window.removeEventListener('resize', check);
      mql.removeEventListener?.('change', check);
    };
  }, []);

  // ── Mobile: hide bubble on scroll/touchmove ──
  useEffect(() => {
    if (!isMobile) return;

    const hide = () => {
      tippyRef.current?.hide();
      clearTimeout(debounceRef.current);
    };

    document.addEventListener('touchmove', hide, { passive: true });
    // On mobile, we might NOT want to hide on visualViewport resize if we are anchoring to it,
    // but usually, it's safer to hide when the keyboard/orientation changes significantly.
    window.visualViewport?.addEventListener('resize', hide);

    return () => {
      document.removeEventListener('touchmove', hide);
      window.visualViewport?.removeEventListener('resize', hide);
    };
  }, [isMobile]);

  // ── Cleanup debounce timer on unmount ──
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  // ── Keyboard navigation: Tab cycles, Esc closes, Enter/Space activates ──
  const handleToolbarKeyDown = useCallback(
    (e) => {
      const toolbar = toolbarRef.current;
      if (!toolbar) return;

      const buttons = Array.from(toolbar.querySelectorAll('button'));
      const currentIndex = buttons.indexOf(document.activeElement);

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        editor.commands.focus();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (buttons.length === 0) return;
        const next = e.shiftKey
          ? (currentIndex - 1 + buttons.length) % buttons.length
          : (currentIndex + 1) % buttons.length;
        buttons[next].focus();
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement?.tagName === 'BUTTON') {
          e.preventDefault();
          document.activeElement.click();
        }
      }
    },
    [editor],
  );

  if (!editor || !showFormattingToolbar) {
    return null;
  }

  const shouldShow = ({ view, state, from, to }) => {
    if (!view.hasFocus()) return false;

    if (!useSettingsStore.getState().showFormattingToolbar) return false;

    // Hide if slash menu is active
    const isSlashMenuOpen = !!document.querySelector(
      '.tippy-box[data-theme~="plain-slash"]',
    );
    if (isSlashMenuOpen) return false;

    const { selection } = state;
    const { empty, node } = selection;

    // Selection must not be collapsed (must have actual text selected)
    if (empty || to - from <= 0) return false;

    // Block node selections (images, etc.)
    if (node) return false;

    // Hide in non-text nodes
    if (
      editor.isActive('image') ||
      editor.isActive('table') ||
      editor.isActive('tableCell') ||
      editor.isActive('tableHeader') ||
      editor.isActive('codeBlock') ||
      editor.isActive('code')
    ) {
      return false;
    }

    // Only show when inside paragraph, heading, listItem, or blockquote
    const parentNode = selection.$from.parent;
    if (!parentNode) return false;
    const allowedTypes = ['paragraph', 'heading', 'listItem', 'blockquote'];
    if (!allowedTypes.includes(parentNode.type.name)) return false;

    return true;
  };

  const setLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    // Initialize with a placeholder to trigger the LinkBubbleMenu's edit state
    editor.chain().focus().setLink({ href: '' }).run();
  };

  const actionButtonClass = (active = false) =>
    clsx(
      'flex shrink-0 items-center justify-center rounded-xl transition-all duration-300',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30',
      'h-11 w-11 md:h-8 md:w-8',
      active
        ? 'bg-accent/15 text-accent shadow-glow-sm'
        : 'text-ink/70 hover:bg-line/40 hover:text-ink hover:scale-105',
    );

  const iconSize = 16;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="formattingBubbleMenu"
      shouldShow={shouldShow}
      tippyOptions={{
        duration: 150,
        // Desktop: float above selection · Mobile: sit at the bottom of the viewport
        // to avoid covering the text or colliding with native copy/paste menus.
        placement: isMobile ? 'top' : 'top',
        offset: isMobile ? [0, 10] : [0, 12],
        maxWidth: 'calc(100vw - 2rem)',
        zIndex: 100,
        // On mobile, we override the reference rect to be the bottom of the viewport
        ...(isMobile
          ? {
              getReferenceClientRect: () => {
                const viewport = window.visualViewport;
                const width = viewport ? viewport.width : window.innerWidth;
                const height = viewport ? viewport.height : window.innerHeight;
                // Return a 1px tall rect at the bottom center of the viewport
                return {
                  width: 0,
                  height: 0,
                  left: width / 2,
                  right: width / 2,
                  top: height,
                  bottom: height,
                  x: width / 2,
                  y: height,
                };
              },
            }
          : {}),
        // Capture the tippy instance
        onCreate(instance) {
          tippyRef.current = instance;
        },
        onDestroy() {
          tippyRef.current = null;
        },
        // ── Mobile 200ms debounce ──
        // Only needed if we are still floating near the selection.
        // If anchored to bottom, we can potentially remove this, but keeping it
        // for safety against immediate-shows during selection changes.
        ...(isMobile
          ? {
              onShow(instance) {
                if (instance._debounceAllowed) {
                  delete instance._debounceAllowed;
                  return;
                }
                clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  instance._debounceAllowed = true;
                  instance.show();
                }, 150);
                return false;
              },
              onHide() {
                clearTimeout(debounceRef.current);
              },
            }
          : {}),
      }}
      className={clsx(
        'overflow-x-auto rounded-[16px] border border-line/40 bg-panel/95 shadow-floating backdrop-blur-xl z-[100]',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        isMobile ? 'p-2 fixed-mobile-bar' : 'p-1.5',
      )}
    >
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Text formatting"
        className="flex items-center gap-0.5"
        onKeyDown={handleToolbarKeyDown}
      >
        <button
          type="button"
          tabIndex={0}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={actionButtonClass(editor.isActive('bold'))}
          title="Bold (Cmd+B)"
          aria-label="Bold"
          aria-pressed={editor.isActive('bold')}
        >
          <Bold size={iconSize} className="shrink-0" />
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={actionButtonClass(editor.isActive('italic'))}
          title="Italic (Cmd+I)"
          aria-label="Italic"
          aria-pressed={editor.isActive('italic')}
        >
          <Italic size={iconSize} className="shrink-0" />
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={setLink}
          className={actionButtonClass(editor.isActive('link'))}
          title="Link (Cmd+K)"
          aria-label="Link"
          aria-pressed={editor.isActive('link')}
        >
          <LinkIcon size={iconSize} className="shrink-0" />
        </button>

        <div
          className="mx-1 h-5 w-[1px] shrink-0 bg-line/50"
          aria-hidden="true"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={actionButtonClass(
            editor.isActive('heading', { level: 1 }),
          )}
          title="Heading 1"
          aria-label="Heading 1"
          aria-pressed={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 size={iconSize} className="shrink-0" />
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={actionButtonClass(
            editor.isActive('heading', { level: 2 }),
          )}
          title="Heading 2"
          aria-label="Heading 2"
          aria-pressed={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={iconSize} className="shrink-0" />
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={actionButtonClass(editor.isActive('blockquote'))}
          title="Quote"
          aria-label="Quote"
          aria-pressed={editor.isActive('blockquote')}
        >
          <Quote size={iconSize} className="shrink-0" />
        </button>

        <div
          className="mx-1 h-5 w-[1px] shrink-0 bg-line/50"
          aria-hidden="true"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={actionButtonClass(editor.isActive('code'))}
          title="Inline Code"
          aria-label="Inline Code"
          aria-pressed={editor.isActive('code')}
        >
          <Terminal size={iconSize} className="shrink-0" />
        </button>
      </div>
    </BubbleMenu>
  );
}

export default FormattingBubbleMenu;
