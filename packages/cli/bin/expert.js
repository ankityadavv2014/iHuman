#!/usr/bin/env node

/**
 * Expert Mode CLI - Wire ExpertSystemExecutor to command-line interface
 * Provides: antigravity-expert <skill> --level=beginner|intermediate|expert --persona=<name>
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { ExpertSystemExecutor, ExpertPersona } = require('../../core/src/expert-system.js');

const skillsPath = path.join(__dirname, '../../../', 'skills');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!args[0] || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    rl.close();
    return;
  }

  const skillName = args[0];
  
  // Parse options
  let level = 'intermediate';
  let persona = 'aiEngineer';
  
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--level=')) {
      level = args[i].split('=')[1];
    } else if (args[i].startsWith('--persona=')) {
      persona = args[i].split('=')[1];
    }
  }

  // Validate inputs
  if (!['beginner', 'intermediate', 'expert'].includes(level)) {
    console.error(`❌ Invalid expertise level: ${level}`);
    console.error('   Valid levels: beginner, intermediate, expert');
    rl.close();
    process.exit(1);
  }

  const validPersonas = ['aiEngineer', 'architect', 'security', 'devops', 'fullStack'];
  if (!validPersonas.includes(persona)) {
    console.error(`❌ Invalid persona: ${persona}`);
    console.error(`   Valid personas: ${validPersonas.join(', ')}`);
    rl.close();
    process.exit(1);
  }

  try {
    console.log('\n🤖 Antigravity Expert System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Load skill definition
    const skillPath = path.join(skillsPath, skillName, 'SKILL.md');
    
    if (!fs.existsSync(skillPath)) {
      console.error(`❌ Skill not found: ${skillName}`);
      console.error(`   Check skills directory: ${skillsPath}`);
      rl.close();
      process.exit(1);
    }

    const skillContent = fs.readFileSync(skillPath, 'utf-8');
    const skillDef = parseSkillDefinition(skillContent, skillName);

    if (!skillDef) {
      console.error(`❌ Invalid skill definition: ${skillName}`);
      console.error('   Skill must have frontmatter with name, description, and parameters');
      rl.close();
      process.exit(1);
    }

    console.log(`📚 Skill: ${skillDef.name}`);
    console.log(`📝 ${skillDef.description}\n`);
    console.log(`🎯 Expertise Level: ${level}`);
    console.log(`👤 Expert Persona: ${persona}\n`);

    // Create executor
    const executor = new ExpertSystemExecutor(skillDef, {
      workspaceRoot: process.cwd(),
      useBackup: true,
      dryRun: false,
    });

    // Create context for execution
    const context = {
      level,
      persona,
      autoApprove: level === 'expert',
      verbose: true,
    };

    // Execute skill
    console.log('🚀 Starting skill execution...\n');
    const result = await executor.execute(context);

    // Display results
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (result.success) {
      console.log('✅ Skill executed successfully!\n');
      
      if (result.outputs) {
        console.log('📊 Outputs:');
        Object.entries(result.outputs).forEach(([key, value]) => {
          console.log(`   • ${key}: ${value}`);
        });
      }

      if (result.summary) {
        console.log('\n📋 Summary:');
        console.log(`   ${result.summary}`);
      }
    } else {
      console.log('❌ Skill execution failed\n');
      
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }

      if (result.suggestions && result.suggestions.length > 0) {
        console.log('\n💡 Suggestions:');
        result.suggestions.forEach((suggestion) => {
          console.log(`   • ${suggestion}`);
        });
      }

      // Ask about rollback
      if (result.rollbackAvailable) {
        const doRollback = await question('\nRollback changes? (y/n): ');
        if (doRollback.toLowerCase() === 'y') {
          console.log('🔄 Rolling back...');
          await executor.rollback();
          console.log('✅ Rollback complete');
        }
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(error.stack);
    }
    rl.close();
    process.exit(1);
  }

  rl.close();
}

/**
 * Parse skill definition from markdown with frontmatter
 */
function parseSkillDefinition(content, skillName) {
  // Match frontmatter between --- markers
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  const lines = frontmatter.split('\n');
  
  const def = {
    name: skillName,
    description: '',
    category: 'general',
    parameters: [],
    handlers: [],
    validation: {},
  };

  // Parse key-value pairs
  for (const line of lines) {
    const [key, value] = line.split(':').map(s => s.trim());
    
    if (key === 'name') {
      def.name = value;
    } else if (key === 'description') {
      def.description = value;
    } else if (key === 'category') {
      def.category = value;
    }
  }

  // Parse handlers from content body
  const handlerRegex = /## Handler: (\w+)([\s\S]*?)(?=## Handler:|$)/g;
  let match;
  
  while ((match = handlerRegex.exec(content)) !== null) {
    const handlerName = match[1];
    const handlerContent = match[2];
    
    def.handlers.push({
      type: handlerName.toLowerCase(),
      action: extractHandlerAction(handlerContent),
    });
  }

  // Parse parameters from content
  const paramRegex = /### Parameter: (\w+)([\s\S]*?)(?=### Parameter:|##|$)/g;
  
  while ((match = paramRegex.exec(content)) !== null) {
    const paramName = match[1];
    const paramContent = match[2];
    
    def.parameters.push({
      name: paramName,
      description: extractDescription(paramContent),
      required: paramContent.includes('required: true'),
      type: extractType(paramContent),
    });
  }

  return def;
}

function extractDescription(content) {
  const match = content.match(/description:\s*"([^"]+)"/);
  return match ? match[1] : '';
}

function extractType(content) {
  const match = content.match(/type:\s*(\w+)/);
  return match ? match[1] : 'string';
}

function extractHandlerAction(content) {
  // Extract first code block
  const match = content.match(/```[\w]*\n([\s\S]*?)```/);
  return match ? match[1] : content.trim();
}

function printHelp() {
  console.log(`
🤖 Antigravity Expert System - CLI

USAGE:
  antigravity-expert <skill> [options]

OPTIONS:
  --level=LEVEL       Expertise level: beginner, intermediate, expert
  --persona=PERSONA   Expert persona: aiEngineer, architect, security, devops, fullStack
  --help              Show this help message

EXAMPLES:
  antigravity-expert react-setup --level=beginner
  antigravity-expert security-audit --level=expert --persona=security
  antigravity-expert typescript-config --level=intermediate --persona=aiEngineer

FEATURES:
  ✅ Step-by-step guidance based on expertise level
  ✅ Real command execution with error recovery
  ✅ File backup and rollback capability
  ✅ Contextual help and suggestions
  ✅ Auto-approval for expert level

LEARN MORE:
  See QUICK_START_REAL_SYSTEM.md for detailed documentation
  `);
}

// Run main
main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
