import { useNotesStore } from '../store/useNotesStore';
import { Search } from 'lucide-react';

function SearchInput() {
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const setSearchQuery = useNotesStore((state) => state.setSearchQuery);

  return (
    <label className="relative block">
      <span className="sr-only">Search notes</span>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search size={16} className="text-muted" />
      </div>
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label="Search notes"
        placeholder="Search notes"
        className="block w-full rounded-2xl border border-line bg-canvas py-2.5 pl-9 pr-3 text-base text-ink placeholder-muted/80 transition-shadow focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
      />
    </label>
  );
}

export default SearchInput;
