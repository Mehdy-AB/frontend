// Local search history management utility
// Manages search history in localStorage

export interface SearchHistoryItem {
  id?: string;
  query: string;
  timestamp: number;
  resultCount?: number;
  searchType?: 'unified' | 'advanced' | 'simple';
  filters?: Record<string, any>;
}

const STORAGE_KEY = 'aebdms_search_history';
const MAX_HISTORY_ITEMS = 50;

export const SearchHistoryService = {
  /**
   * Get all search history items
   */
  getSearchHistory(): SearchHistoryItem[] {
    try {
      const historyJson = localStorage.getItem(STORAGE_KEY);
      if (!historyJson) return [];
      
      const history = JSON.parse(historyJson) as SearchHistoryItem[];
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error reading search history:', error);
      return [];
    }
  },

  /**
   * Save a search to history
   */
  saveSearchToHistory(item: SearchHistoryItem): void {
    try {
      const history = this.getSearchHistory();
      
      // Remove duplicates of the same query
      const filteredHistory = history.filter(h => h.query !== item.query);
      
      // Add new item at the beginning with ID
      const updatedHistory = [
        { ...item, timestamp: Date.now(), id: `search_${Date.now()}` },
        ...filteredHistory
      ];
      
      // Limit to max items
      const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  },

  /**
   * Clear all search history
   */
  clearSearchHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  },

  /**
   * Remove a specific history item
   */
  removeHistoryItem(query: string): void {
    try {
      const history = this.getSearchHistory().filter(h => h.query !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error removing history item:', error);
    }
  }
};

