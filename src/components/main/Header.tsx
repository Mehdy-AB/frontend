// components/Header.tsx
'use client';

import { Search, Bell, User, Settings, LogOut, Sun, Moon, ChevronDown, Filter, Clock, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SimpleLanguageSelector from '../i18n/SimpleLanguageSelector';
import AdvancedSearchModal from '../modals/AdvancedSearchModal';
import AdminDropdown from './AdminDropdown';
import { useLanguage } from '../../contexts/LanguageContext';
import { isAdmin } from '../../utils/adminUtils';
import { EnhancedSearchService, SearchHistoryItem } from '../../api/services/enhancedSearchService';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState<SearchHistoryItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  
  // Check if user is admin
  const userIsAdmin = isAdmin();

  // Initialize dark mode from system preference or localStorage
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                  (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    updateDarkMode(isDark);
  }, []);

  // Load search history on component mount
  useEffect(() => {
    setSearchHistory(EnhancedSearchService.getSearchHistory());
  }, []);

  // Filter search history based on current query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchHistory.filter(item => 
        item.query.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHistory(filtered.slice(0, 5)); // Show only top 5 results
    } else {
      setFilteredHistory(searchHistory.slice(0, 5)); // Show recent 5 searches
    }
  }, [searchQuery, searchHistory]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    updateDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const updateDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle search history item click
  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setShowSearchHistory(false);
    // Navigate to search page
    window.location.href = `/search?query=${encodeURIComponent(item.query)}`;
  };

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchHistory(true);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSearchHistory(false);
      // Save to search history
      EnhancedSearchService.saveSearchToHistory({
        query: searchQuery.trim(),
        searchType: 'unified',
        filters: {}
      });
      // Update search history state
      setSearchHistory(EnhancedSearchService.getSearchHistory());
      // Navigate to search page
      window.location.href = `/search?query=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Close search history when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchHistory(false);
      }
    };

    if (showSearchHistory) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchHistory]);

  return (
    <header className="bg-card border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left Section - Search */}
      <div className="flex items-center flex-1 max-w-lg gap-2">
        <div className="relative flex-1" ref={searchInputRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onFocus={() => setShowSearchHistory(true)}
            className="pl-10 w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
          />
          
          {/* Search History Dropdown */}
          {showSearchHistory && filteredHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
              <div className="p-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Recent searches</span>
                </div>
              </div>
              {filteredHistory.map((item, index) => (
                <button
                  key={item.id || index}
                  onClick={() => handleHistoryItemClick(item)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Search className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item.query}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove from history
                        const updatedHistory = searchHistory.filter(h => h.id !== item.id);
                        setSearchHistory(updatedHistory);
                        // Update localStorage
                        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedSearch(true)}
          className="gap-2 shrink-0"
        >
          <Filter className="h-4 w-4" />
          Advanced
        </Button>
      </div>

      {/* Right Section - User Menu & Notifications */}
      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <SimpleLanguageSelector variant="compact" />

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-card"></span>
        </Button>

        {/* Admin Dropdown */}
        <AdminDropdown isAdmin={userIsAdmin} />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">Admin</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@aeb-dms.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              {t('common.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        open={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={async (searchRequest) => {
          // Navigate to search page with the advanced search request
          const searchParams = new URLSearchParams();
          if (searchRequest.query) {
            searchParams.set('query', searchRequest.query);
          }
          // Add other parameters as needed
          if (searchRequest.ownerId) {
            searchParams.set('ownerId', searchRequest.ownerId.toString());
          }
          if (searchRequest.metadataOperations) {
            searchParams.set('metadataOperations', JSON.stringify(searchRequest.metadataOperations));
          }
          if (searchRequest.lookUpNames !== undefined) {
            searchParams.set('lookUpNames', searchRequest.lookUpNames.toString());
          }
          if (searchRequest.includeFolders !== undefined) {
            searchParams.set('includeFolders', searchRequest.includeFolders.toString());
          }
          if (searchRequest.includeDocuments !== undefined) {
            searchParams.set('includeDocuments', searchRequest.includeDocuments.toString());
          }
          
          window.location.href = `/search?${searchParams.toString()}`;
        }}
        initialQuery={searchQuery}
      />
    </header>
  );
}