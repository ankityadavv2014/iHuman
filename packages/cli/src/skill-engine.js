const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

class SkillEngine {
  constructor(skillsPath) {
    this.skills = new Map();
    this.skillsPath = skillsPath;
  }

  async loadSkills() {
    this.skills.clear();
    const skillDirs = await fs.promises.readdir(this.skillsPath);

    for (const dir of skillDirs) {
      const skillPath = path.join(this.skillsPath, dir);
      const stat = await fs.promises.stat(skillPath);

      if (stat.isDirectory()) {
        const skillFile = path.join(skillPath, 'SKILL.md');
        
        if (await this.fileExists(skillFile)) {
          try {
            const skill = await this.parseSkill(dir, skillPath, skillFile);
            this.skills.set(skill.id, skill);
          } catch (error) {
            console.warn(`Failed to parse skill at ${skillPath}:`, error.message);
          }
        }
      }
    }

    console.log(`✅ Loaded ${this.skills.size} skills`);
  }

  async fileExists(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async parseSkill(id, skillPath, skillFile) {
    const content = await fs.promises.readFile(skillFile, 'utf-8');
    const { data, content: markdown } = matter(content);

    const category = this.extractCategory(skillPath);

    return {
      id,
      name: data.name || id,
      description: data.description || '',
      category: data.category || category,
      risk: data.risk || 'unknown',
      source: data.source,
      tags: data.tags || [],
      path: skillPath,
      content: markdown,
      frontmatter: data,
    };
  }

  extractCategory(skillPath) {
    const parts = skillPath.split(path.sep);
    if (parts.length >= 2) {
      const parentDir = parts[parts.length - 2];
      if (parentDir !== 'skills') {
        return parentDir;
      }
    }
    return 'uncategorized';
  }

  search(query) {
    const q = query.toLowerCase();
    const results = [];

    for (const skill of this.skills.values()) {
      let score = 0;

      if (skill.name.toLowerCase().includes(q)) score += 10;
      if (skill.description.toLowerCase().includes(q)) score += 5;
      if (skill.tags?.some(t => t.toLowerCase().includes(q))) score += 3;
      if (skill.category.toLowerCase().includes(q)) score += 2;

      if (score > 0) {
        results.push({ skill, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).map(r => r.skill);
  }

  filterByCategory(category) {
    return Array.from(this.skills.values())
      .filter(skill => skill.category.toLowerCase() === category.toLowerCase())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  filterByRisk(risk) {
    return Array.from(this.skills.values())
      .filter(skill => skill.risk?.toLowerCase() === risk.toLowerCase())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  filterByTag(tag) {
    return Array.from(this.skills.values())
      .filter(skill => skill.tags?.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getCategories() {
    const categories = new Set();
    for (const skill of this.skills.values()) {
      categories.add(skill.category);
    }
    return Array.from(categories).sort();
  }

  getTags() {
    const tags = new Set();
    for (const skill of this.skills.values()) {
      for (const tag of skill.tags || []) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }

  getSkill(id) {
    return this.skills.get(id);
  }

  getAllSkills() {
    return Array.from(this.skills.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getSkillCount() {
    return this.skills.size;
  }

  getSkillsByCategory() {
    const grouped = new Map();

    for (const skill of this.skills.values()) {
      if (!grouped.has(skill.category)) {
        grouped.set(skill.category, []);
      }
      grouped.get(skill.category).push(skill);
    }

    for (const skills of grouped.values()) {
      skills.sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }

  exportSkillContent(id, format = 'markdown') {
    const skill = this.getSkill(id);
    if (!skill) throw new Error(`Skill not found: ${id}`);

    if (format === 'text') {
      return `
Skill: ${skill.name}
Description: ${skill.description}
Category: ${skill.category}
Risk: ${skill.risk}
Source: ${skill.source || 'Unknown'}
Tags: ${skill.tags?.join(', ') || 'None'}

---

${skill.content}
`.trim();
    }

    return `---
name: ${skill.name}
description: "${skill.description}"
category: ${skill.category}
risk: ${skill.risk}
${skill.source ? `source: ${skill.source}` : ''}
${skill.tags && skill.tags.length > 0 ? `tags: [${skill.tags.map(t => `"${t}"`).join(', ')}]` : ''}
---

${skill.content}
`;
  }

  async exportSkills(format) {
    const skills = this.getAllSkills();

    if (format === 'json') {
      return JSON.stringify(
        skills.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          category: s.category,
          risk: s.risk,
          source: s.source,
          tags: s.tags,
        })),
        null,
        2
      );
    }

    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Description', 'Category', 'Risk', 'Source', 'Tags'];
      const rows = skills.map(s => [
        s.id,
        `"${s.name}"`,
        `"${s.description}"`,
        s.category,
        s.risk,
        s.source || '',
        s.tags?.join(';') || '',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Markdown format
    return skills
      .map(s => `## ${s.name}\n\n${s.description}\n\n**Category:** ${s.category}\n`)
      .join('\n---\n\n');
  }
}

module.exports = SkillEngine;
