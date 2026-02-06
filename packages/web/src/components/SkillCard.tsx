import React from 'react';
import { Skill, getRiskColor, formatCategory } from '@antigravity/core';

interface SkillCardProps {
  skill: Skill;
  onCopy: () => void;
}

export default function SkillCard({ skill, onCopy }: SkillCardProps) {
  const riskColor = getRiskColor(skill.risk);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{skill.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{skill.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          {formatCategory(skill.category)}
        </span>
        <span
          className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
          style={{ backgroundColor: riskColor }}
        >
          {skill.risk}
        </span>
      </div>

      {skill.tags && skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {skill.tags.slice(0, 3).map(tag => (
            <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
              {tag}
            </span>
          ))}
          {skill.tags.length > 3 && (
            <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              +{skill.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCopy}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          Copy
        </button>
        <button className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded transition-colors">
          View
        </button>
      </div>
    </div>
  );
}
