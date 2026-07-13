import { ref } from 'vue';

export function useRecentSearch(storageKey = 'recentSearches', maxItems = 20) {
  const getStoredSearches = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  };

  const searches = ref(getStoredSearches());

  const saveSearch = (term) => {
    if (!term || typeof term !== 'string') return;
    const trimmed = term.trim();
    if (!trimmed) return;

    let currentSearches = getStoredSearches();
    
    // Remove if exists to push it to the top
    const index = currentSearches.indexOf(trimmed);
    if (index > -1) {
      currentSearches.splice(index, 1);
    }
    
    currentSearches.unshift(trimmed);
    
    if (currentSearches.length > maxItems) {
      currentSearches = currentSearches.slice(0, maxItems);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(currentSearches));
    searches.value = currentSearches;
  };

  const removeSearch = (term) => {
    let currentSearches = getStoredSearches();
    currentSearches = currentSearches.filter(s => s !== term);
    localStorage.setItem(storageKey, JSON.stringify(currentSearches));
    searches.value = currentSearches;
  };

  const clearAll = () => {
    localStorage.removeItem(storageKey);
    searches.value = [];
  };

  return {
    searches,
    saveSearch,
    removeSearch,
    clearAll
  };
}
