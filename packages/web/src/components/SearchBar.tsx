import React, { useState } from 'react';

interface SearchBarProps {
  query: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ query, onSearch }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search skills by name, description, or tags..."
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <span className="absolute right-3 top-3 text-gray-400">🔍</span>
    </div>
  );
}
