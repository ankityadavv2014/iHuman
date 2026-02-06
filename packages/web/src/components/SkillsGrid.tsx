import React, { useState, useEffect, useMemo } from 'react';
import SkillCard from './SkillCard';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import { Skill } from '@antigravity/core';

interface SkillsGridProps {
  skills: Skill[];
  categories: string[];
  tags: string[];
  onSearch: (query: string) => void;
  onCopySkill: (skillId: string) => void;
}

export default function SkillsGrid({
  skills,
  categories,
  tags,
  onSearch,
  onCopySkill,
}: SkillsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredSkills = useMemo(() => {
    let filtered = skills;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    if (selectedRisk !== 'all') {
      filtered = filtered.filter(s => s.risk === selectedRisk);
    }

    return filtered;
  }, [skills, selectedCategory, selectedRisk]);

  return (
    <div className="space-y-6">
      <SearchBar
        query={searchQuery}
        onSearch={(query) => {
          setSearchQuery(query);
          onSearch(query);
        }}
      />

      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedRisk={selectedRisk}
        onRiskChange={setSelectedRisk}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={filteredSkills.length}
      />

      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }
      >
        {filteredSkills.length > 0 ? (
          filteredSkills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onCopy={() => onCopySkill(skill.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No skills found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
