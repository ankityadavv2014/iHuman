/**
 * Utility functions for skill management
 */

/**
 * Format text for display
 */
export function formatText(text: string, maxLength?: number): string {
  if (maxLength && text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

/**
 * Sanitize skill ID
 */
export function sanitizeId(id: string): string {
  return id
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Parse tags from string
 */
export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(/[,;]/)
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0);
}

/**
 * Get risk level color for UI
 */
export function getRiskColor(risk?: string): string {
  switch (risk?.toLowerCase()) {
    case 'none':
      return '#10b981'; // green
    case 'safe':
      return '#3b82f6'; // blue
    case 'critical':
      return '#ef4444'; // red
    case 'offensive':
      return '#f59e0b'; // amber
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Format category for display
 */
export function formatCategory(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Highlight search terms in text
 */
export function highlightText(text: string, terms: string[]): string {
  let highlighted = text;
  for (const term of terms) {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }
  return highlighted;
}
