import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';
import {
  X,
  Palette,
  HardDrive,
  Info,
  CheckCircle2,
  FolderSync,
  RefreshCw,
  AlertCircle,
  Download,
  Eye,
  Type,
  Hash,
  Clock,
  List,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Sparkles,
  Command,
} from 'lucide-react';
import { useOverlayFocus } from '../hooks/useOverlayFocus';
import { useSettingsStore } from '../store/useSettingsStore';
import { THEME_OPTIONS } from '../utils/themes';
import clsx from 'clsx';
import { useNotesStore } from '../store/useNotesStore';

const NAV_ITEMS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'display', label: 'Display', icon: Eye },
  { id: 'shortcuts', label: 'Shortcuts', icon: Command },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'about', label: 'About', icon: Info },
];

function SettingsModal({ isOpen, onClose, theme, setTheme, storageStatus, isHydrated, onReplayOnboarding }) {
  const [activeSection, setActiveSection] = useState('appearance');
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true);
  const connectFolderStorage = useNotesStore(
    (state) => state.connectFolderStorage,
  );
  const importLegacyNotes = useNotesStore((state) => state.importLegacyNotes);
  const refreshLibrary = useNotesStore((state) => state.refreshLibrary);
  const startFileWatcher = useNotesStore((state) => state.startFileWatcher);
  const stopFileWatcher = useNotesStore((state) => state.stopFileWatcher);
  const showInsightsPill = useSettingsStore((state) => state.showInsightsPill);
  const toggleInsightsPill = useSettingsStore(
    (state) => state.toggleInsightsPill,
  );
  const visibleInsights = useSettingsStore((state) => state.visibleInsights);
  const toggleVisibleInsight = useSettingsStore((state) => state.toggleVisibleInsight);
  const showFormattingToolbar = useSettingsStore((state) => state.showFormattingToolbar);
  const toggleFormattingToolbar = useSettingsStore((state) => state.toggleFormattingToolbar);

  const dialogRef = useRef(null);

  useOverlayFocus({
    isOpen,
    containerRef: dialogRef,
    onClose,
  });

  // Initialize auto-sync state from localStorage
  // Enabled by default — only false when the user has explicitly disabled it
  useEffect(() => {
    const saved = window.localStorage.getItem('plain-auto-sync-enabled');
    const isEnabled = saved !== 'false'; // defaults to true
    setIsAutoSyncEnabled(isEnabled);
    if (isEnabled && storageStatus.hasFolderConnection) {
      startFileWatcher();
    } else {
      stopFileWatcher();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageStatus.hasFolderConnection]);

  // Start/stop file watcher based on auto-sync toggle
  useEffect(() => {
    if (isAutoSyncEnabled && storageStatus.hasFolderConnection) {
      startFileWatcher();
    } else {
      stopFileWatcher();
    }

    // Cleanup on unmount
    return () => {
      stopFileWatcher();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoSyncEnabled, storageStatus.hasFolderConnection]);

  const handleToggleAutoSync = () => {
    const newValue = !isAutoSyncEnabled;
    setIsAutoSyncEnabled(newValue);
    window.localStorage.setItem('plain-auto-sync-enabled', String(newValue));

    if (newValue && storageStatus.hasFolderConnection) {
      startFileWatcher();
    } else {
      stopFileWatcher();
    }
  };

  const handleManualRefresh = async () => {
    await refreshLibrary();
  };

  const storageLabel = useMemo(() => {
    if (storageStatus.hasFolderConnection) {
      return 'Folder storage active';
    }
    if (storageStatus.supportsFolderPicker) {
      return 'Browser storage active';
    }
    return 'On-device browser storage';
  }, [storageStatus.hasFolderConnection, storageStatus.supportsFolderPicker]);

  const storageCaption = useMemo(() => {
    if (storageStatus.isConnectingFolder) {
      return 'Connecting your folder...';
    }
    if (!storageStatus.hasFolderConnection && storageStatus.hasStoredFolderHandle) {
      return 'Reconnect your folder to keep notes as Markdown files on disk.';
    }
    if (storageStatus.pendingImportCount > 0) {
      return `${storageStatus.pendingImportCount} older notes ready to import`;
    }
    if (storageStatus.hasFolderConnection) {
      return 'Notes save to your chosen folder as Markdown files.';
    }
    if (storageStatus.isIOS) {
      return 'Notes stay in this browser. iOS does not support folder storage.';
    }
    if (storageStatus.supportsFolderPicker) {
      return 'Notes stay in this browser until you connect a folder.';
    }
    return 'Notes stay in browser-managed storage on this device.';
  }, [
    storageStatus.hasFolderConnection,
    storageStatus.hasStoredFolderHandle,
    storageStatus.isConnectingFolder,
    storageStatus.pendingImportCount,
    storageStatus.supportsFolderPicker,
    storageStatus.isIOS,
  ]);

  const currentYear = new Date().getFullYear();

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-ink">Theme</h3>
              <p className="mt-0.5 text-sm text-muted">
                Choose a look that suits your style.
              </p>
            </div>

            {/* Theme Grid */}
            <LayoutGroup id="theme-selector">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {THEME_OPTIONS.map((themeOption) => (
                  <motion.button
                    key={themeOption.id}
                    onClick={() => setTheme(themeOption.id)}
                    aria-pressed={theme === themeOption.id}
                    whileTap={{ scale: 0.97 }}
                    className={clsx(
                      'group relative overflow-hidden rounded-xl p-2 text-left transition-all duration-200',
                      theme === themeOption.id
                        ? 'bg-transparent'
                        : 'border border-line/30 bg-elevated/30 hover:border-line/50',
                    )}
                  >
                    {theme === themeOption.id && (
                      <motion.div
                        layoutId="active-theme-ring"
                        className="absolute inset-0 z-0 rounded-xl border-[1.5px] border-accent bg-accent/5"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    
                    <div className="relative z-10 overflow-hidden rounded-lg border border-line/50">
                      <div className="flex h-6 w-full">
                        {themeOption.preview.map((color) => (
                          <span
                            key={color}
                            className="flex-1"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="relative z-10 mt-1.5 flex items-center justify-between">
                      <p
                        className={clsx(
                          'text-[11px] font-medium transition-colors',
                          theme === themeOption.id ? 'text-accent' : 'text-muted group-hover:text-ink',
                        )}
                      >
                        {themeOption.label}
                      </p>
                      {theme === themeOption.id && (
                        <motion.span
                          layoutId="active-theme-label"
                          className="font-mono text-[8px] font-semibold uppercase tracking-widest text-accent"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        >
                          Active
                        </motion.span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </LayoutGroup>

            {/* Theme Suggestion */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line/40 bg-elevated/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-line/30 p-2">
                  <Palette size={18} className="text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Design your dream theme</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted/70">
                    Share your unique vision and name for a custom theme.
                  </p>
                </div>
              </div>
              <motion.a
                href="https://formshare.ai/s/y0coMBNrn4"
                target="_blank"
                rel="noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent/10 px-3.5 py-2 text-xs font-medium text-accent transition-all hover:bg-accent/15 sm:w-auto"
              >
                Suggest theme
              </motion.a>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-ink">Storage</h3>
              <p className="mt-1 text-sm text-muted">{storageCaption}</p>
            </div>

            {/* Storage Status Card */}
            <div className="rounded-2xl border border-line/40 bg-elevated/50 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      'mt-0.5 rounded-xl p-2',
                      storageStatus.hasFolderConnection
                        ? 'bg-emerald-500/10'
                        : 'bg-line/30',
                    )}
                  >
                    {storageStatus.hasFolderConnection ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <HardDrive size={18} className="text-muted" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{storageLabel}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted/70">
                      {storageStatus.hasFolderConnection
                        ? 'Notes are saved as Markdown files in your chosen folder.'
                        : storageStatus.supportsFolderPicker
                          ? 'Connect a folder to save notes as Markdown files on disk.'
                          : 'Notes are stored in this browser only.'}
                    </p>
                  </div>
                </div>

                {!storageStatus.hasFolderConnection && storageStatus.supportsFolderPicker && (
                  <motion.button
                    type="button"
                    onClick={() => void connectFolderStorage()}
                    disabled={storageStatus.isConnectingFolder || !isHydrated}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent/10 px-3.5 py-2 text-xs font-medium text-accent transition-all hover:bg-accent/15 disabled:opacity-50"
                  >
                    <FolderSync size={13} />
                    {storageStatus.isConnectingFolder
                      ? 'Connecting...'
                      : storageStatus.hasStoredFolderHandle
                        ? 'Reconnect'
                        : 'Choose folder'}
                  </motion.button>
                )}
              </div>

              {/* Warnings and Actions */}
              <div className="mt-4 space-y-3">
                {/* Auto-sync Toggle */}
                {storageStatus.hasFolderConnection && (
                  <div className="flex items-center justify-between rounded-xl bg-line/15 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <RefreshCw size={16} className="text-muted" />
                      <div>
                        <p className="text-xs font-medium text-ink">Auto-sync</p>
                        <p className="text-[10px] text-muted/60">Automatically detect external changes</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleAutoSync}
                      aria-label={isAutoSyncEnabled ? 'Disable auto-sync' : 'Enable auto-sync'}
                      className="flex shrink-0 items-center"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={isAutoSyncEnabled ? 'on' : 'off'}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          {isAutoSyncEnabled ? (
                            <ToggleRight size={28} className="text-accent" />
                          ) : (
                            <ToggleLeft size={28} className="text-muted/40" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </button>
                  </div>
                )}

                {/* Manual Refresh Button */}
                {storageStatus.hasFolderConnection && (
                  <motion.button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={storageStatus.isRefreshing}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-line/40 bg-elevated/50 py-3 text-xs font-medium text-ink transition-all hover:bg-elevated/70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={storageStatus.isRefreshing ? 'animate-spin' : ''} />
                    {storageStatus.isRefreshing ? 'Refreshing...' : 'Refresh from folder'}
                  </motion.button>
                )}

                {!storageStatus.supportsFolderPicker && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-3 text-xs text-amber-600 dark:text-amber-300">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Folder storage is not available on this device.
                    </span>
                  </div>
                )}

                {storageStatus.lastError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-xs text-red-600 dark:text-red-300">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{storageStatus.lastError}</span>
                  </div>
                )}

                {storageStatus.pendingImportCount > 0 && (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-line/20 px-3.5 py-3">
                    <p className="text-xs font-medium text-ink">
                      {storageStatus.pendingImportCount} older notes ready to import
                    </p>
                    <motion.button
                      type="button"
                      onClick={() => void importLegacyNotes()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line/60 px-3 py-1.5 text-xs font-medium text-ink transition-all hover:bg-line/30"
                    >
                      <Download size={12} />
                      Import
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Storage Info */}
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-line/15 px-3.5 py-3">
                <Info size={13} className="mt-0.5 shrink-0 text-muted/50" />
                <p className="text-xs leading-relaxed text-muted/60">
                  No built-in sync. Browser storage stays in this browser on this device.
                  Check the User Guide note in your library for storage details.
                </p>
              </div>
            </div>
          </div>
        );

      case 'display':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-ink">Display</h3>
              <p className="mt-1 text-sm text-muted">
                Customize how notes look and feel.
              </p>
            </div>

            <div className="space-y-3">
              {/* Insights Pill Toggle - Parent + Children unified card */}
              <div className="rounded-2xl border border-line/40 bg-elevated/40 overflow-hidden transition-colors">
                <div className="flex items-center justify-between p-4">
                  <motion.label
                    whileHover={{ x: 2 }}
                    className="flex flex-1 cursor-pointer items-center gap-3"
                  >
                    <div className="rounded-xl bg-line/30 p-2">
                      <Eye size={16} className="text-muted" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-ink">
                        Note Insights Pill
                      </span>
                      <p className="mt-0.5 text-xs text-muted/70">
                        Show the floating bar with live document statistics.
                      </p>
                    </div>
                  </motion.label>
                  <div className="flex items-center gap-1">
                    <div
                      className={clsx(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
                        showInsightsPill ? 'bg-accent' : 'bg-line',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={showInsightsPill}
                        onChange={toggleInsightsPill}
                      />
                      <motion.span
                        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-canvas shadow"
                        animate={{ x: showInsightsPill ? 16 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    </div>
                    {showInsightsPill && (
                      <motion.button
                        type="button"
                        onClick={() => setIsInsightsExpanded((v) => !v)}
                        aria-label={isInsightsExpanded ? 'Collapse insight options' : 'Expand insight options'}
                        whileTap={{ scale: 0.9 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted/60 transition-colors hover:bg-line/30 hover:text-ink"
                      >
                        <motion.div
                          animate={{ rotate: isInsightsExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <ChevronDown size={16} />
                        </motion.div>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Individual Insight Toggles - collapsible */}
                <AnimatePresence initial={false}>
                  {showInsightsPill && isInsightsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-line/40"
                    >
                      <div className="flex flex-col">
                        {[
                          { key: 'words', label: 'Words', icon: Type },
                          { key: 'characters', label: 'Characters', icon: Hash },
                          { key: 'readingTime', label: 'Reading time', icon: Clock },
                          { key: 'headings', label: 'Headings', icon: List },
                        ].map(({ key, label, icon: Icon }, idx, arr) => (
                          <label
                            key={key}
                            className={clsx(
                              "flex cursor-pointer items-center justify-between pl-12 pr-4 py-2.5 transition-colors hover:bg-line/20",
                              idx < arr.length - 1 && "border-b border-line/20"
                            )}
                          >
                            <div className="flex items-center gap-2.5 text-muted">
                              <Icon size={14} />
                              <span className="text-sm text-ink">{label}</span>
                            </div>
                            <div
                              className={clsx(
                                'relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
                                visibleInsights?.[key] !== false ? 'bg-accent' : 'bg-line',
                              )}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={visibleInsights?.[key] !== false}
                                onChange={() => toggleVisibleInsight(key)}
                              />
                              <motion.span
                                className="pointer-events-none inline-block h-3 w-3 rounded-full bg-canvas shadow"
                                animate={{ x: visibleInsights?.[key] !== false ? 12 : 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Formatting Toolbar Toggle */}
              <motion.label
                whileHover={{ x: 2 }}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-line/40 bg-elevated/40 p-4 transition-colors hover:border-line/70 hover:bg-elevated/60"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-line/30 p-2">
                    <Type size={16} className="text-muted" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-ink">
                      Formatting Toolbar
                    </span>
                    <p className="mt-0.5 text-xs text-muted/70">
                      Show formatting toolbar on selection.
                    </p>
                  </div>
                </div>
                <div
                  className={clsx(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
                    showFormattingToolbar ? 'bg-accent' : 'bg-line',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showFormattingToolbar}
                    onChange={toggleFormattingToolbar}
                  />
                  <motion.span
                    className="pointer-events-none inline-block h-4 w-4 rounded-full bg-canvas shadow"
                    animate={{ x: showFormattingToolbar ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                </div>
              </motion.label>
            </div>
          </div>
        );

      case 'shortcuts': {
        const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        const mod = isMac ? '⌘' : 'Ctrl';
        const alt = isMac ? '⌥' : 'Alt';
        const shift = isMac ? '⇧' : 'Shift';

        const ShortcutRow = ({ label, keys }) => (
          <div className="flex items-center justify-between py-3">
            <span className="text-[14px] font-medium text-ink/90">{label}</span>
            <div className="flex items-center gap-1.5">
              {keys.map((k, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-lg border border-line/50 bg-canvas/60 px-2 py-1 font-mono text-[11px] font-bold text-ink shadow-sm">
                    {k}
                  </kbd>
                  {i < keys.length - 1 && <span className="text-[10px] text-muted/30">+</span>}
                </div>
              ))}
            </div>
          </div>
        );

        const ShortcutGroup = ({ title, children }) => (
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted/70">{title}</h4>
            <div className="divide-y divide-line/20 rounded-[24px] border border-line/40 bg-elevated/40 px-4 py-2 backdrop-blur-sm sm:px-6">
              {children}
            </div>
          </div>
        );

        return (
          <div className="space-y-10 pb-6">
            <div>
              <h3 className="text-lg font-semibold text-ink">Keyboard Shortcuts</h3>
              <p className="mt-0.5 text-sm text-muted">
                Efficiency hacks for the focused writer.
              </p>
            </div>

            <div className="space-y-12">
              <ShortcutGroup title="Application">
                <ShortcutRow label="New Note" keys={[alt, 'N']} />
                <ShortcutRow label="Search Notes" keys={[alt, 'K']} />
                <ShortcutRow label="Global Settings" keys={[alt, ',']} />
                <ShortcutRow label="Toggle Sidebar" keys={[mod, '\\']} />
                <ShortcutRow label="Undo Changes" keys={[mod, 'Z']} />
                <ShortcutRow label="Redo Changes" keys={[mod, shift, 'Z']} />
              </ShortcutGroup>

              <ShortcutGroup title="Editor Structure">
                <ShortcutRow label="Heading 1" keys={[mod, alt, '1']} />
                <ShortcutRow label="Heading 2" keys={[mod, alt, '2']} />
                <ShortcutRow label="Heading 3" keys={[mod, alt, '3']} />
                <ShortcutRow label="Normal Paragraph" keys={[mod, alt, '0']} />
                <ShortcutRow label="Checklist" keys={[mod, shift, '9']} />
              </ShortcutGroup>

              <ShortcutGroup title="Text Formatting">
                <ShortcutRow label="Bold text" keys={[mod, 'B']} />
                <ShortcutRow label="Italic text" keys={[mod, 'I']} />
                <ShortcutRow label="Underline text" keys={[mod, 'U']} />
                <ShortcutRow label="Strikethrough" keys={[mod, shift, 'X']} />
                <ShortcutRow label="Inline Code" keys={[mod, 'E']} />
                <ShortcutRow label="Insert Link" keys={[mod, 'K']} />
              </ShortcutGroup>

              <ShortcutGroup title="Lists & Blocks">
                <ShortcutRow label="Bullet List" keys={[mod, shift, '8']} />
                <ShortcutRow label="Numbered List" keys={[mod, shift, '7']} />
                <ShortcutRow label="Quote Block" keys={[mod, shift, 'B']} />
                <ShortcutRow label="Code Block" keys={[mod, alt, 'C']} />
                <ShortcutRow label="Open Command Menu" keys={['/']} />
              </ShortcutGroup>

              <ShortcutGroup title="Text Alignment">
                <ShortcutRow label="Align Left" keys={[mod, shift, 'L']} />
                <ShortcutRow label="Align Center" keys={[mod, shift, 'E']} />
                <ShortcutRow label="Align Right" keys={[mod, shift, 'R']} />
              </ShortcutGroup>
            </div>

            <div className="rounded-2xl bg-line/10 p-5 text-center">
              <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-[12px] leading-relaxed text-muted/80">
                <span>Most application shortcuts also support</span>
                <kbd className="rounded-md border border-line/50 bg-canvas/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">{mod}</kbd>
                <span>but</span>
                <kbd className="rounded-md border border-line/50 bg-canvas/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink">{alt}</kbd>
                <span>is recommended to avoid browser conflicts on Windows.</span>
              </p>
            </div>
          </div>
        );
      }

      case 'about':
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-ink">About Plain</h3>
              <p className="mt-1 text-sm text-muted">
                A local-first notes app built for privacy and simplicity.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-line/30 bg-elevated/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60">
                      Current Version
                    </p>
                    <p className="text-sm font-semibold text-ink">v2.0</p>
                  </div>
                </div>
                <div className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                  Latest
                </div>
              </div>

              <div className="rounded-2xl border border-line/30 bg-elevated/20 p-5 overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-accent/5 blur-3xl" />
                
                <div className="relative z-10 space-y-4">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <HardDrive size={14} className="text-accent" />
                      Storage Strategy
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {storageStatus.hasFolderConnection
                        ? 'Your notes are synced directly to your computer as Markdown files. You have full ownership of your data.'
                        : 'Notes are stored locally in your browser. Connect a folder to host them as files on your system.'}
                    </p>
                  </div>

                  <div className="h-px bg-line/20" />

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Info size={14} className="text-accent" />
                      Philosophy
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      Plain is local-first by design. No accounts, no clouds, no tracking. 
                      Privacy isn&apos;t a feature, it&apos;s the foundation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-line/30 bg-elevated/20 p-5">
                <h4 className="text-sm font-semibold text-ink">Documentation & Support</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Need help or want to talk? Join our community or browse the built-in guides.
                </p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onReplayOnboarding) {
                        onReplayOnboarding();
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-canvas px-4 py-2 text-xs font-semibold text-ink shadow-sm ring-1 ring-line/50 transition-all hover:bg-line/10"
                  >
                    <Sparkles size={14} className="text-accent" />
                    Welcome Notes
                  </button>
                  
                  <a
                    href="https://discord.gg/Zq28kBAPZ3"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-all hover:bg-accent/20"
                  >
                    Discord Community
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-[11px] font-medium text-muted/50">
                Made with love by <a href="https://versionbear.com" target="_blank" rel="noreferrer" className="text-muted/80 hover:text-accent transition-colors">VersionBear</a> &bull; &copy; {currentYear}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm md:px-8"
        >
          <div className="absolute inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative z-10 flex h-[90vh] max-h-[720px] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-line/20 bg-panel/95 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:h-[580px]"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-6 py-5 md:px-8 md:py-6">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Settings
              </h2>
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl p-2 text-muted/60 transition-colors hover:bg-line/30 hover:text-ink"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Body */}
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              {/* Sidebar Navigation */}
              <nav className="shrink-0 border-b border-line/10 px-2 py-2 md:w-60 md:border-b-0 md:border-r md:bg-ink/[0.02] md:px-4 md:py-8 dark:md:bg-white/[0.01]">
                <div className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <LayoutGroup id="settings-nav">
                    {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                      const isActive = activeSection === id;
                      return (
                        <motion.button
                          key={id}
                          onClick={() => setActiveSection(id)}
                          whileTap={{ scale: 0.98 }}
                          className={clsx(
                            'group relative flex shrink-0 items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-colors md:w-full md:py-2.5',
                            isActive
                              ? 'text-ink dark:text-white font-semibold'
                              : 'text-muted hover:text-ink dark:hover:text-white',
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="nav-pill"
                              className="absolute inset-0 z-0 rounded-xl bg-line/40 dark:bg-white/10 shadow-sm"
                              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            />
                          )}
                          <div
                            className={clsx(
                              'relative z-10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                              isActive
                                ? 'bg-canvas shadow-sm text-accent dark:bg-white/10 dark:text-accent'
                                : 'text-muted group-hover:text-ink',
                            )}
                          >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                          </div>
                          <span className="relative z-10 whitespace-nowrap tracking-tight">
                            {label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </LayoutGroup>
                </div>
              </nav>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {renderSection()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default SettingsModal;
