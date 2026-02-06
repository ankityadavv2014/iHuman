#!/usr/bin/env node

const SkillEngine = require('../src/skill-engine');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const skillsPath = path.join(__dirname, '../../../', 'skills');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const engine = new SkillEngine(skillsPath);
  
  try {
    console.log('📚 Loading skills...\n');
    await engine.loadSkills();

    switch (command) {
      case 'search':
        await handleSearch(engine, args.slice(1));
        break;
      case 'get':
        await handleGet(engine, args.slice(1));
        break;
      case 'filter':
        await handleFilter(engine, args.slice(1));
        break;
      case 'list':
        await handleList(engine, args.slice(1));
        break;
      case 'export':
        await handleExport(engine, args.slice(1));
        break;
      case 'info':
        await handleInfo(engine);
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function handleSearch(engine, args) {
  if (args.length === 0) {
    console.error('❌ Usage: antigravity-skills search <query>');
    process.exit(1);
  }

  const query = args.join(' ');
  const results = engine.search(query);

  if (results.length === 0) {
    console.log(`❌ No skills found for: "${query}"\n`);
    return;
  }

  console.log(`✅ Found ${results.length} skill${results.length === 1 ? '' : 's'} for "${query}":\n`);
  
  results.forEach((skill, index) => {
    console.log(`${index + 1}. ${skill.name}`);
    console.log(`   📝 ${skill.description.substring(0, 80)}...`);
    console.log(`   🏷️  Category: ${skill.category} | Risk: ${skill.risk}`);
    if (skill.tags && skill.tags.length > 0) {
      console.log(`   🏷️  Tags: ${skill.tags.slice(0, 3).join(', ')}`);
    }
    console.log();
  });
}

async function handleGet(engine, args) {
  if (args.length === 0) {
    console.error('❌ Usage: antigravity-skills get <skill-id> [--copy] [--markdown]');
    process.exit(1);
  }

  const skillId = args[0];
  const shouldCopy = args.includes('--copy');
  const isMarkdown = !args.includes('--text');

  const skill = engine.getSkill(skillId);
  if (!skill) {
    console.error(`❌ Skill not found: ${skillId}\n`);
    console.log('Try running: antigravity-skills search <query>');
    process.exit(1);
  }

  const content = engine.exportSkillContent(skillId, isMarkdown ? 'markdown' : 'text');

  if (shouldCopy) {
    // Copy to clipboard - requires pbcopy on macOS, xclip on Linux, clip on Windows
    const clipboardCommand = process.platform === 'darwin' ? 'pbcopy' : 'xclip -selection clipboard';
    const child_process = require('child_process');
    const proc = child_process.spawn(process.platform === 'darwin' ? 'pbcopy' : 'xclip', 
      process.platform === 'darwin' ? [] : ['-selection', 'clipboard']);
    
    proc.stdin.write(content);
    proc.stdin.end();

    console.log(`✅ Skill "${skill.name}" copied to clipboard!\n`);
  } else {
    console.log(`📄 Skill: ${skill.name}\n`);
    console.log(content);
    console.log('\n💡 Tip: Use --copy flag to copy to clipboard\n');
  }
}

async function handleFilter(engine, args) {
  let category = null;
  let risk = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category') {
      category = args[i + 1];
      i++;
    } else if (args[i] === '--risk') {
      risk = args[i + 1];
      i++;
    }
  }

  let results = engine.getAllSkills();

  if (category) {
    results = engine.filterByCategory(category);
  }

  if (risk) {
    results = engine.filterByRisk(risk);
  }

  console.log(`✅ Found ${results.length} skill${results.length === 1 ? '' : 's'}\n`);

  results.slice(0, 10).forEach((skill, index) => {
    console.log(`${index + 1}. ${skill.name}`);
  });

  if (results.length > 10) {
    console.log(`\n... and ${results.length - 10} more`);
  }
}

async function handleList(engine, args) {
  const skills = engine.getAllSkills();
  console.log(`Total skills: ${skills.length}\n`);
  console.log('Top 20 skills:\n');

  skills.slice(0, 20).forEach((skill, index) => {
    console.log(`${index + 1}. ${skill.name}`);
  });

  if (skills.length > 20) {
    console.log(`\n... and ${skills.length - 20} more`);
  }
}

async function handleExport(engine, args) {
  let format = 'json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format') {
      format = args[i + 1];
      i++;
    }
  }

  const output = await engine.exportSkills(format);
  console.log(output);
}

async function handleInfo(engine) {
  const skills = engine.getAllSkills();
  const categories = engine.getCategories();
  const tags = engine.getTags();

  console.log('📊 Skills Database Info:\n');
  console.log(`Total Skills: ${skills.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Tags: ${tags.length}`);
  console.log(`\nTop Categories:`);
  
  const categoryGroups = engine.getSkillsByCategory();
  const sortedCategories = Array.from(categoryGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  sortedCategories.forEach(([cat, skills]) => {
    console.log(`  - ${cat}: ${skills.length} skills`);
  });
}

function printHelp() {
  console.log(`
🚀 Antigravity Skills - CLI Tool

Usage: antigravity-skills <command> [options]

Commands:
  search <query>          Search skills by name, description, or tags
  get <skill-id>         Get skill content
  filter --category <name> --risk <level>  Filter skills
  list                   List all skills
  export --format <type> Export all skills (json|csv|markdown)
  info                   Show database information
  
Examples:
  antigravity-skills search "react patterns"
  antigravity-skills get ai-engineer --copy
  antigravity-skills filter --category=architecture --risk=safe
  antigravity-skills export --format=json > skills.json

Options:
  --copy                 Copy skill to clipboard
  --text                 Export as text (default: markdown)
  --format <type>        Export format (json|csv|markdown)
  -h, --help             Show this help
`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
