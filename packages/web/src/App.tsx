import React, { useState, useEffect } from 'react';
import { SkillEngine } from '@antigravity/core';
import SkillsGrid from './components/SkillsGrid';
import './App.css';

export default function App() {
  const [engine, setEngine] = useState(null);
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initEngine = async () => {
      try {
        const skillEngine = new SkillEngine('../../../skills');
        await skillEngine.loadSkills();
        setEngine(skillEngine);
        setSkills(skillEngine.getAllSkills());
        setFilteredSkills(skillEngine.getAllSkills());
        setCategories(skillEngine.getCategories());
      } catch (error) {
        console.error('Failed to load skills:', error);
      } finally {
        setLoading(false);
      }
    };

    initEngine();
  }, []);

  const handleSearch = (query) => {
    if (!engine || !query.trim()) {
      setFilteredSkills(skills);
      return;
    }

    const results = engine.search(query);
    setFilteredSkills(results);
  };

  const handleCopySkill = async (skillId) => {
    if (!engine) return;

    try {
      const content = engine.exportSkillContent(skillId, 'markdown');
      await navigator.clipboard.writeText(content);
      
      // Show success message
      const originalText = 'Copied!';
      const event = new CustomEvent('skillCopied', { detail: { skillId, message: originalText } });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to copy skill:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">✨ Antigravity Skills</h1>
          <p className="text-gray-600 mt-1">Browse and trigger {skills.length}+ agentic skills</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <SkillsGrid
          skills={filteredSkills}
          categories={categories}
          tags={engine?.getTags() || []}
          onSearch={handleSearch}
          onCopySkill={handleCopySkill}
        />
      </main>
    </div>
  );
}
