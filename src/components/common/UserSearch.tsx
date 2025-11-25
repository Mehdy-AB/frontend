'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User } from 'lucide-react';
import { userManagementService } from '@/api/services';
import { UserDto } from '@/types/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserSearchProps {
  onUserSelect: (user: UserDto) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeUserIds?: string[];
}

export function UserSearch({
  onUserSelect,
  placeholder = 'Search users by name or email...',
  disabled = false,
  excludeUserIds = [],
}: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim() || !isOpen) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await userManagementService.searchUsers(
          query,
          ['USERNAME', 'EMAIL', 'FIRST_NAME', 'LAST_NAME'],
          0,
          20
        );
        
        // Filter out excluded users
        const filtered = response.content.filter(
          (user) => !excludeUserIds.includes(user.id)
        );
        
        setResults(filtered);
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, isOpen, excludeUserIds]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (user: UserDto) => {
    onUserSelect(user);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading && results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.imgUrl} />
                      <AvatarFallback className="text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                    </div>
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

