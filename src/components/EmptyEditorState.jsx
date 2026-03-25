import { useNotesStore } from '../store/useNotesStore';
import { FileText, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function EmptyEditorState({ totalNotes, searchQuery, isSidebarCollapsed, onToggleSidebar, activeSection }) {
  const createNote = useNotesStore((state) => state.createNote);

  return (
    <main className="flex-1 flex flex-col items-center justify-center bg-canvas p-6 relative">
      <div className="absolute top-6 left-6 hidden md:block">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-muted hover:text-ink hover:bg-line/50 rounded-lg transition-colors"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className="max-w-md w-full text-center flex flex-col items-center animate-fade-in">
        <div className="w-16 h-16 bg-line/30 rounded-2xl flex items-center justify-center mb-6">
          <FileText size={32} className="text-muted" />
        </div>

        <h2 className="text-2xl font-semibold text-ink mb-3 tracking-tight">
          {activeSection === 'trash'
            ? 'Nothing selected'
            : totalNotes === 0
              ? 'Welcome to Plain'
              : 'Select a note to view'}
        </h2>
        
        <p className="text-sm text-muted leading-relaxed mb-8">
          {activeSection === 'trash'
            ? searchQuery
              ? 'Clear search to view trashed notes.'
              : totalNotes === 0
                ? 'Your trash is empty.'
                : 'Select a trashed note to restore or permanently delete.'
            : totalNotes === 0
              ? 'A beautiful, local-first space for your thoughts. Start writing without distractions.'
              : searchQuery
                ? 'No notes match your current search.'
                : 'Choose a note from the sidebar or create a new one to start writing.'}
        </p>

        {activeSection === 'notes' && (
          <button
            type="button"
            onClick={createNote}
            className="flex items-center gap-2 px-5 py-2.5 bg-ink text-canvas rounded-full font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={18} />
            Create new note
          </button>
        )}
      </div>
    </main>
  );
}

export default EmptyEditorState;