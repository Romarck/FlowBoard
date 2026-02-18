import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/useSearch';
import { IssueTypeIcon } from '@/components/issues/IssueTypeIcon';
import type { FilterState } from '@/types/filter';
import type { IssueListItem } from '@/api/issues';

interface GlobalSearchBarProps {
  projectId: string;
  onIssueSelect?: (issue: IssueListItem) => void;
}

export function GlobalSearchBar({ projectId, onIssueSelect }: GlobalSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search query (300ms)
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters: FilterState = {
    search: debouncedQuery,
    type: '',
    priority: '',
    status_id: '',
    assignee_id: '',
    label_id: '',
    sprint_id: '',
  };

  const { data: searchResults } = useSearch(projectId, filters);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (issue: IssueListItem) => {
    setSearchQuery('');
    setIsOpen(false);
    onIssueSelect?.(issue);
  };

  const handleClear = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-sm" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search issues... (⌘K)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => debouncedQuery && setIsOpen(true)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && debouncedQuery && searchResults && searchResults.items && searchResults.items.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchResults.items.map((issue) => (
            <button
              key={issue.id}
              onClick={() => handleSelect(issue)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <IssueTypeIcon type={issue.type as any} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{issue.key}</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{issue.title}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && debouncedQuery && searchResults && searchResults.items && searchResults.items.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500 dark:text-gray-400">
          No issues found
        </div>
      )}
    </div>
  );
}
