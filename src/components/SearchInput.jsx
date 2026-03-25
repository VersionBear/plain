import { useNotesStore } from '../store/useNotesStore';
import { Search } from 'lucide-react';

function SearchInput() {
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const setSearchQuery = useNotesStore((state) => state.setSearchQuery);

  return (
    <label className="block relative">
      <span className="sr-only">Search notes</span>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={16} className="text-muted" />
      </div>
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search title or content..."
        className="block w-full pl-9 pr-3 py-2.5 bg-canvas border border-line rounded-lg text-sm text-ink placeholder-muted/80 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-shadow"
      />
    </label>
  );
}

export default SearchInput;