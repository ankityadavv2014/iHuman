import * as fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import lunr from 'lunr';

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  risk?: 'none' | 'safe' | 'critical' | 'offensive' | 'unknown';
  source?: string;
  tags?: string[];
  path: string;
}

export interface Skill extends SkillMetadata {
  content: string;
  frontmatter: Record<string, any>;
}

export class SkillEngine {
  private skills: Map<string, Skill> = new Map();
  private index: lunr.Index | null = null;
  private skillsPath: string;

  constructor(skillsPath: string) {
    this.skillsPath = skillsPath;
  }

  /**
   * Load all skills from the skills directory
   */
  async loadSkills(): Promise<void> {
    this.skills.clear();
    const skillDirs = await fs.readdir(this.skillsPath);

    for (const dir of skillDirs) {
      const skillPath = path.join(this.skillsPath, dir);
      const stat = await fs.stat(skillPath);

      if (stat.isDirectory()) {
        const skillFile = path.join(skillPath, 'SKILL.md');
        
        if (await fs.pathExists(skillFile)) {
          try {
            const skill = await this.parseSkill(dir, skillPath, skillFile);
            this.skills.set(skill.id, skill);
          } catch (error) {
            console.warn(`Failed to parse skill at ${skillPath}:`, error);
          }
        }
      }
    }

    this.buildSearchIndex();
  }

  /**
   * Parse a single skill file
   */
  private async parseSkill(id: string, skillPath: string, skillFile: string): Promise<Skill> {
    const content = await fs.readFile(skillFile, 'utf-8');
    const { data, content: markdown } = matter(content);

    // Extract category from path
    const category = this.extractCategory(skillPath);

    const skill: Skill = {
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

    return skill;
  }

  /**
   * Extract category from skill path
   */
  private extractCategory(skillPath: string): string {
    const parts = skillPath.split(path.sep);
    if (parts.length >= 2) {
      const parentDir = parts[parts.length - 2];
      if (parentDir !== 'skills') {
        return parentDir;
      }
    }
    return 'uncategorized';
  }

  /**
   * Build search index using Lunr
   */
  private buildSearchIndex(): void {
    this.index = lunr(function () {
      this.ref('id');
      this.field('name', { boost: 10 });
      this.field('description', { boost: 5 });
      this.field('tags', { boost: 3 });
      this.field('category', { boost: 2 });

      for (const skill of this.skills.values()) {
        this.add({
          id: skill.id,
          name: skill.name,
          description: skill.description,
          tags: skill.tags?.join(' ') || '',
          category: skill.category,
        });
      }
    });
  }

  /**
   * Search skills by query
   */
  search(query: string): Skill[] {
    if (!this.index) return [];

    try {
      const results = this.index.search(query);
      return results
        .map(result => this.skills.get(result.ref))
        .filter((skill): skill is Skill => skill !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Filter skills by category
   */
  filterByCategory(category: string): Skill[] {
    return Array.from(this.skills.values())
      .filter(skill => skill.category.toLowerCase() === category.toLowerCase())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Filter skills by risk level
   */
  filterByRisk(risk: string): Skill[] {
    return Array.from(this.skills.values())
      .filter(skill => skill.risk?.toLowerCase() === risk.toLowerCase())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Filter skills by tags
   */
  filterByTag(tag: string): Skill[] {
    return Array.from(this.skills.values())
      .filter(skill => skill.tags?.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all unique categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const skill of this.skills.values()) {
      categories.add(skill.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * Get all unique tags
   */
  getTags(): string[] {
    const tags = new Set<string>();
    for (const skill of this.skills.values()) {
      for (const tag of skill.tags || []) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }

  /**
   * Get skill by ID
   */
  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /**
   * Get all skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get skill count
   */
  getSkillCount(): number {
    return this.skills.size;
  }

  /**
   * Get skills grouped by category
   */
  getSkillsByCategory(): Map<string, Skill[]> {
    const grouped = new Map<string, Skill[]>();

    for (const skill of this.skills.values()) {
      if (!grouped.has(skill.category)) {
        grouped.set(skill.category, []);
      }
      grouped.get(skill.category)!.push(skill);
    }

    // Sort skills within each category
    for (const skills of grouped.values()) {
      skills.sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }

  /**
   * Export skill content formatted for copying
   */
  exportSkillContent(id: string, format: 'markdown' | 'text' = 'markdown'): string {
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

    // Markdown format with frontmatter
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

  /**
   * Bulk export skills
   */
  async exportSkills(format: 'json' | 'csv' | 'markdown'): Promise<string> {
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

export default SkillEngine;
