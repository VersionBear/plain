import { BubbleMenu } from '@tiptap/react/menus';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ExternalLink, 
  Pencil, 
  Link2Off, 
  Check, 
  X,
  Copy,
  Link as LinkIcon 
} from 'lucide-react';


function LinkBubbleMenu({ editor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  const isLinkActive = editor.isActive('link');

  // Sync internal URL state with the editor's link attribute
  useEffect(() => {
    if (isLinkActive) {
      const { href } = editor.getAttributes('link');
      setUrl(href || '');
      // If it's a completely new/empty link, start in edit mode
      if (!href) {
        setIsEditing(true);
      }
    } else {
      setIsEditing(false);
    }
  }, [isLinkActive, editor]);

  // Focus input when moving to edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      setIsEditing(false);
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
  }, [editor, url]);

  const handleCancel = useCallback(() => {
    const { href } = editor.getAttributes('link');
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else {
      setUrl(href);
      setIsEditing(false);
    }
  }, [editor]);

  const handleUnlink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }, [editor]);

  const handleCopy = useCallback(() => {
    if (url) {
      navigator.clipboard.writeText(url);
    }
  }, [url]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const shouldShow = ({ editor }) => {
    return editor.isActive('link');
  };

  const btnClass = "flex items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-line/40 text-muted hover:text-ink";

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkBubbleMenu"
      shouldShow={shouldShow}
      tippyOptions={{
        duration: 150,
        placement: 'bottom-start',
        offset: [0, 8],
        zIndex: 110,
      }}
      className="flex items-center gap-1 overflow-hidden rounded-[14px] border border-line/40 bg-panel/95 p-1 px-1.5 shadow-floating backdrop-blur-xl"
    >
      {isEditing ? (
        <div className="flex items-center gap-1 min-w-[280px]">
          <div className="flex h-8 w-8 items-center justify-center text-muted">
            <LinkIcon size={14} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste or type a link..."
            className="flex-1 bg-transparent text-[13px] text-ink focus:outline-none placeholder:text-muted/40"
          />
          <div className="mx-1 h-4 w-px bg-line/40" />
          <button onClick={handleSave} className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors">
            <Check size={16} />
          </button>
          <button onClick={handleCancel} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-line/40 transition-colors">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex max-w-[200px] items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <span className="truncate">{url || 'Empty link'}</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
          
          <div className="mx-1 h-4 w-px bg-line/40" />
          
          <button onClick={() => setIsEditing(true)} title="Edit link" className={btnClass}>
            <Pencil size={14} />
          </button>

          <button onClick={handleCopy} title="Copy link" className={btnClass}>
            <Copy size={14} />
          </button>
          
          <button onClick={handleUnlink} title="Remove link" className={btnClass}>
            <Link2Off size={14} />
          </button>
        </div>
      )}
    </BubbleMenu>
  );
}

export default LinkBubbleMenu;
