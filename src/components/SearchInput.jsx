import { useNotesStore } from '../store/useNotesStore';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

function SearchInput() {
  const searchQuery = useNotesStore((state) => state.searchQuery);
  const setSearchQuery = useNotesStore((state) => state.setSearchQuery);

  return (
    <div className="group relative flex items-center rounded-3xl border border-line/50 bg-panel/80 backdrop-blur-sm transition-all duration-300 focus-within:border-accent/40 focus-within:bg-canvas focus-within:shadow-[0_0_20px_rgba(var(--color-accent)/0.08)] focus-within:ring-4 focus-within:ring-accent/5">
      <span className="sr-only">Search notes</span>
      <motion.div
        className="pointer-events-none flex items-center pl-4"
        initial={false}
        animate={{ scale: searchQuery ? 1.15 : 1, x: searchQuery ? 1 : 0 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 450, damping: 25 }}
      >
        <Search size={15} strokeWidth={2.5} className="text-muted/60 transition-colors duration-200 group-focus-within:text-accent" />
      </motion.div>
      <motion.input
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        aria-label="Search notes"
        placeholder="Search notes or tags..."
        className="flex-1 border-0 bg-transparent py-3 pl-2.5 pr-4 text-[14px] font-medium text-ink placeholder-muted/50 outline-none focus:ring-0 sm:text-[13.5px]"
      />
    </div>
  );
}

export default SearchInput;
