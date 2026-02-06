#!/usr/bin/env node

/**
 * iHuman CLI - Development Tools
 * Skill scaffolding, validation, testing, and publishing
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');

class IhumanCLI {
  constructor() {
    this.skillsDir = './skills';
    this.templatesDir = './templates';
  }

  /**
   * Create new skill from template
   */
  async createSkill() {
    console.log(chalk.cyan('\n🆕 Create New Skill'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'skillName',
        message: 'Skill name (kebab-case):',
        validate: (input) => /^[a-z0-9-]+$/.test(input) || 'Use kebab-case only'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Skill description:'
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: ['frontend', 'backend', 'devops', 'data', 'automation', 'other']
      },
      {
        type: 'list',
        name: 'difficulty',
        message: 'Difficulty:',
        choices: ['beginner', 'intermediate', 'advanced']
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:'
      }
    ]);

    try {
      await this.scaffoldSkill(answers);
      console.log(chalk.green(`\n✅ Skill created successfully: ${answers.skillName}`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error creating skill: ${error.message}`));
    }
  }

  /**
   * Scaffold skill structure
   */
  async scaffoldSkill(options) {
    const { skillName, description, category, difficulty, author } = options;
    const skillDir = path.join(this.skillsDir, skillName);

    // Create directories
    fs.ensureDirSync(skillDir);
    fs.ensureDirSync(path.join(skillDir, 'src'));
    fs.ensureDirSync(path.join(skillDir, 'tests'));
    fs.ensureDirSync(path.join(skillDir, 'docs'));

    // Create SKILL.md
    const skillMd = `# ${skillName}

## Description
${description}

## Metadata
- **Category**: ${category}
- **Difficulty**: ${difficulty}
- **Author**: ${author}
- **Created**: ${new Date().toISOString()}

## Parameters
- None yet

## Usage
\`\`\`javascript
await executeSkill('${skillName}', {});
\`\`\`

## Implementation
See \`src/index.js\` for implementation details.

## Tests
Run tests with: \`npm test\`
`;

    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);

    // Create package.json
    const packageJson = {
      name: `@ihuman/${skillName}`,
      version: '0.1.0',
      description,
      main: 'src/index.js',
      scripts: {
        test: 'jest',
        validate: 'node validate.js',
        lint: 'eslint src/**/*.js'
      },
      author,
      license: 'MIT',
      keywords: [category, difficulty]
    };

    fs.writeFileSync(path.join(skillDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Create src/index.js
    const indexJs = `/**
 * ${skillName} Skill
 * ${description}
 */

module.exports = {
  metadata: {
    name: '${skillName}',
    version: '0.1.0',
    description: '${description}',
    category: '${category}',
    difficulty: '${difficulty}',
    author: '${author}',
    parameters: {}
  },

  async execute(params) {
    console.log('Executing ${skillName}...');
    
    // TODO: Implement your skill logic here
    
    return {
      success: true,
      message: '${skillName} executed successfully'
    };
  },

  validate(params) {
    // TODO: Validate parameters
    return true;
  }
};
`;

    fs.writeFileSync(path.join(skillDir, 'src', 'index.js'), indexJs);

    // Create test file
    const testJs = `describe('${skillName}', () => {
  const skill = require('../src/index.js');

  test('should validate metadata', () => {
    expect(skill.metadata.name).toBe('${skillName}');
    expect(skill.metadata.version).toBeDefined();
  });

  test('should execute successfully', async () => {
    const result = await skill.execute({});
    expect(result.success).toBe(true);
  });
});
`;

    fs.writeFileSync(path.join(skillDir, 'tests', 'index.test.js'), testJs);

    // Create .gitignore
    fs.writeFileSync(path.join(skillDir, '.gitignore'), 'node_modules/\n.env\n*.log\n');

    console.log(chalk.gray(`  Created: ${skillDir}/`));
  }

  /**
   * Validate skill structure and metadata
   */
  async validateSkill(skillName) {
    console.log(chalk.cyan(`\n🔍 Validating skill: ${skillName}`));

    const skillDir = path.join(this.skillsDir, skillName);

    if (!fs.existsSync(skillDir)) {
      throw new Error(`Skill not found: ${skillDir}`);
    }

    const checks = [
      this.checkFileExists(skillDir, 'SKILL.md', 'Skill documentation'),
      this.checkFileExists(skillDir, 'package.json', 'Package configuration'),
      this.checkFileExists(skillDir, 'src/index.js', 'Implementation'),
      this.checkFileExists(skillDir, 'tests/index.test.js', 'Tests'),
      this.checkValidJSON(skillDir, 'package.json'),
      this.checkSkillMetadata(skillDir)
    ];

    const results = await Promise.all(checks);
    const passed = results.filter(r => r.success).length;
    const total = results.length;

    console.log(chalk.cyan(`\nValidation Results: ${passed}/${total} passed`));

    results.forEach(result => {
      if (result.success) {
        console.log(chalk.green(`  ✅ ${result.message}`));
      } else {
        console.log(chalk.red(`  ❌ ${result.message}`));
      }
    });

    if (passed === total) {
      console.log(chalk.green('\n✅ Skill validation passed!'));
      return true;
    } else {
      throw new Error('Skill validation failed');
    }
  }

  /**
   * Check if file exists
   */
  checkFileExists(dir, file, label) {
    return new Promise((resolve) => {
      const exists = fs.existsSync(path.join(dir, file));
      resolve({
        success: exists,
        message: label
      });
    });
  }

  /**
   * Check JSON validity
   */
  checkValidJSON(dir, file) {
    return new Promise((resolve) => {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        JSON.parse(content);
        resolve({
          success: true,
          message: `${file} is valid JSON`
        });
      } catch (error) {
        resolve({
          success: false,
          message: `${file} contains invalid JSON: ${error.message}`
        });
      }
    });
  }

  /**
   * Check skill metadata
   */
  checkSkillMetadata(dir) {
    return new Promise((resolve) => {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
        const required = ['name', 'version', 'description', 'main'];
        const missing = required.filter(field => !pkg[field]);

        if (missing.length === 0) {
          resolve({
            success: true,
            message: 'All required metadata present'
          });
        } else {
          resolve({
            success: false,
            message: `Missing metadata: ${missing.join(', ')}`
          });
        }
      } catch (error) {
        resolve({
          success: false,
          message: `Metadata check failed: ${error.message}`
        });
      }
    });
  }

  /**
   * Run skill tests
   */
  async testSkill(skillName) {
    console.log(chalk.cyan(`\n🧪 Testing skill: ${skillName}`));

    const skillDir = path.join(this.skillsDir, skillName);

    if (!fs.existsSync(skillDir)) {
      throw new Error(`Skill not found: ${skillDir}`);
    }

    try {
      process.chdir(skillDir);
      execSync('npm test', { stdio: 'inherit' });
      console.log(chalk.green('\n✅ Tests passed!'));
    } catch (error) {
      console.error(chalk.red('\n❌ Tests failed!'));
      throw error;
    } finally {
      process.chdir('../..');
    }
  }

  /**
   * Publish skill
   */
  async publishSkill(skillName) {
    console.log(chalk.cyan(`\n📤 Publishing skill: ${skillName}`));

    const skillDir = path.join(this.skillsDir, skillName);

    if (!fs.existsSync(skillDir)) {
      throw new Error(`Skill not found: ${skillDir}`);
    }

    try {
      // Validate first
      await this.validateSkill(skillName);

      // Run tests
      await this.testSkill(skillName);

      // Publish to NPM
      process.chdir(skillDir);
      execSync('npm publish --access public', { stdio: 'inherit' });
      console.log(chalk.green(`\n✅ Skill published successfully!`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Publish failed: ${error.message}`));
      throw error;
    } finally {
      process.chdir('../..');
    }
  }

  /**
   * List all skills
   */
  listSkills() {
    console.log(chalk.cyan('\n📚 Available Skills\n'));

    const skills = fs.readdirSync(this.skillsDir).filter(f => {
      return fs.statSync(path.join(this.skillsDir, f)).isDirectory();
    });

    if (skills.length === 0) {
      console.log(chalk.gray('No skills found'));
      return;
    }

    skills.forEach((skill, index) => {
      const pkgPath = path.join(this.skillsDir, skill, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        console.log(`${index + 1}. ${chalk.cyan(skill)}`);
        console.log(`   Description: ${pkg.description}`);
        console.log(`   Version: ${pkg.version}\n`);
      }
    });
  }

  /**
   * Main CLI entry point
   */
  async run(command) {
    try {
      switch (command) {
        case 'create':
          await this.createSkill();
          break;
        case 'validate':
          const skillName = process.argv[3];
          if (!skillName) {
            console.error(chalk.red('❌ Skill name required'));
            process.exit(1);
          }
          await this.validateSkill(skillName);
          break;
        case 'test':
          const testSkill = process.argv[3];
          if (!testSkill) {
            console.error(chalk.red('❌ Skill name required'));
            process.exit(1);
          }
          await this.testSkill(testSkill);
          break;
        case 'publish':
          const pubSkill = process.argv[3];
          if (!pubSkill) {
            console.error(chalk.red('❌ Skill name required'));
            process.exit(1);
          }
          await this.publishSkill(pubSkill);
          break;
        case 'list':
          this.listSkills();
          break;
        default:
          console.log(chalk.cyan('\niHuman CLI - Skill Development Tools\n'));
          console.log('Usage: ihuman <command> [options]\n');
          console.log('Commands:');
          console.log('  create    - Create new skill from template');
          console.log('  validate  - Validate skill structure');
          console.log('  test      - Run skill tests');
          console.log('  publish   - Publish skill to NPM');
          console.log('  list      - List all skills\n');
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  }
}

// Main execution
const cli = new IhumanCLI();
const command = process.argv[2] || 'help';
cli.run(command);

module.exports = IhumanCLI;
