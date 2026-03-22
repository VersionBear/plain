import { useNotesStore } from '../store/useNotesStore';

function SearchInput() {
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const setSearchQuery = useNotesStore((state) => state.setSearchQuery);

  return (
    <label className="block">
      <span className="sr-only">Search notes</span>
      <div className="hairline flex items-center rounded-2xl bg-elevated/85 px-4 py-3">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="mr-3 h-4 w-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M12.5 12.5L17 17" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search title or content"
          className="w-full border-0 bg-transparent p-0 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-0"
        />
      </div>
    </label>
  );
}

export default SearchInput;
