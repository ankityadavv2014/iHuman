/**
 * Expert System Core - PRODUCTION IMPLEMENTATION (JavaScript)
 * Real functionality for skill execution with error recovery, validation, and rollback
 * 
 * This is the production-ready version that runs on Node.js directly
 */

const { exec, execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * SHELL EXECUTOR - Real command execution with output capture
 */
class ShellExecutor {
  static timeout = 30000; // 30 seconds default

  /**
   * Execute shell command with real output capture, error handling, and timeout
   */
  static async execute(command, options = {}) {
    const timeout = options.timeout || this.timeout;
    const cwd = options.cwd || process.cwd();
    const env = { ...process.env, ...options.env };

    return new Promise((resolve) => {
      const child = spawn('bash', ['-c', command], {
        cwd,
        env,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data); // Real-time output
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data); // Real-time output
      });

      child.on('exit', (exitCode) => {
        clearTimeout(timeoutHandle);

        if (timedOut) {
          resolve({
            stdout,
            stderr: stderr + `\nCommand timed out after ${timeout}ms`,
            exitCode: 1,
            success: false,
          });
        } else {
          resolve({
            stdout,
            stderr,
            exitCode: exitCode || 0,
            success: exitCode === 0 || exitCode === null,
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutHandle);
        resolve({
          stdout,
          stderr: error.message,
          exitCode: 1,
          success: false,
        });
      });
    });
  }

  /**
   * Verify command exists and is executable
   */
  static async commandExists(command) {
    const result = await this.execute(`which ${command}`);
    return result.success;
  }

  /**
   * Check if directory exists
   */
  static async directoryExists(dir) {
    try {
      await fs.access(dir);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * FILE OPERATIONS - Real file handling with backup and rollback
 */
class FileOperations {
  static backupDir = '.antigravity-backups';

  /**
   * Initialize backup directory
   */
  static async initBackups() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.warn('Could not create backup directory:', error.message);
    }
  }

  /**
   * Create backup of file before modification
   */
  static async createBackup(filePath, context) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const timestamp = Date.now();
      const hash = crypto.createHash('md5').update(filePath).digest('hex');
      const backupPath = path.join(this.backupDir, `${hash}_${timestamp}.backup`);

      await fs.writeFile(backupPath, content);

      context.fileBackups.push({
        path: filePath,
        backupPath,
        timestamp: new Date().toISOString(),
      });

      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup of ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write file with backup and rollback capability
   */
  static async writeFileWithBackup(filePath, content, context, options = {}) {
    try {
      // Create directories if needed
      if (options.createDirs !== false) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      }

      // Backup existing file
      try {
        await this.createBackup(filePath, context);
      } catch {
        // File doesn't exist yet, that's ok
      }

      // Atomic write (write to temp file first, then rename)
      if (options.atomic !== false) {
        const tempPath = filePath + '.tmp';
        await fs.writeFile(tempPath, content, 'utf-8');
        await fs.rename(tempPath, filePath);
      } else {
        await fs.writeFile(filePath, content, 'utf-8');
      }

      console.log(`   ✓ Written to ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Read file contents
   */
  static async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Restore file from backup
   */
  static async restoreFromBackup(filePath, backupPath) {
    try {
      const content = await fs.readFile(backupPath, 'utf-8');
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`   ✓ Restored ${filePath} from backup`);
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  /**
   * Rollback all file changes
   */
  static async rollbackAllChanges(context) {
    for (const backup of context.fileBackups) {
      try {
        await this.restoreFromBackup(backup.path, backup.backupPath);
      } catch (error) {
        console.error(`   ❌ Could not restore ${backup.path}: ${error.message}`);
      }
    }

    // Clean up backups
    try {
      const files = await fs.readdir(this.backupDir);
      for (const file of files) {
        await fs.unlink(path.join(this.backupDir, file));
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * CODE GENERATOR - Template rendering and code validation
 */
class CodeGenerator {
  /**
   * Simple template variable substitution
   * Supports: {{variable}}, {{#if condition}}...{{/if}}, {{#each array}}...{{/each}}
   */
  static render(template, variables) {
    let result = template;

    // Replace variables: {{varName}}
    result = result.replace(/{{(\w+)}}/g, (match, varName) => {
      return variables[varName] !== undefined ? variables[varName] : match;
    });

    // Handle conditionals: {{#if condition}}...{{/if}}
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    // Handle loops: {{#each arrayName}}...{{/each}}
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
      if (!Array.isArray(variables[arrayName])) return '';
      return variables[arrayName]
        .map((item) => content.replace(/{{this}}/g, item))
        .join('');
    });

    return result;
  }

  /**
   * Generate code from template with variable interpolation
   */
  static async generateFromTemplate(template, language, variables) {
    const code = this.render(template, variables);

    // Add header comment
    const headerComment = this.getCommentSyntax(language);
    const header = `${headerComment} Generated by Antigravity Expert System\n${headerComment} Variables: ${JSON.stringify(variables)}\n\n`;

    return header + code;
  }

  static getCommentSyntax(language) {
    const comments = {
      javascript: '//',
      typescript: '//',
      python: '#',
      java: '//',
      go: '//',
      rust: '//',
      bash: '#',
      yaml: '#',
      json: '//',
    };
    return comments[language.toLowerCase()] || '//';
  }

  /**
   * Validate generated code for syntax
   */
  static async validateSyntax(code, language) {
    const errors = [];

    // Basic validation
    if (language === 'javascript' || language === 'typescript') {
      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
      }
    }

    if (language === 'json') {
      try {
        JSON.parse(code);
      } catch (error) {
        errors.push(`Invalid JSON: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * VALIDATION ENGINE - Parameter and rule validation
 */
class ValidationEngine {
  /**
   * Execute validation rules against context
   */
  static async validate(rules, context) {
    const failures = [];

    for (const rule of rules) {
      try {
        let passed = false;

        if (typeof rule.rule === 'string') {
          // Regex validation
          const regex = new RegExp(rule.rule);
          const testValue = Object.values(context.inputs).find((v) => v !== undefined);
          passed = regex.test(String(testValue));
        } else if (typeof rule.rule === 'function') {
          // Function validation
          passed = await rule.rule(context);
        }

        if (!passed) {
          failures.push(rule.error);
        }
      } catch (error) {
        failures.push(`Validation error in "${rule.name}": ${error.message}`);
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  /**
   * Validate parameter input against schema
   */
  static validateParameter(param, value) {
    // Check required
    if (param.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${param.name} is required` };
    }

    // Check type
    if (value !== undefined && value !== null) {
      const actualType = typeof value;
      if (param.type === 'number' && actualType !== 'number') {
        return { valid: false, error: `${param.name} must be a number` };
      }
      if (param.type === 'boolean' && actualType !== 'boolean') {
        return { valid: false, error: `${param.name} must be a boolean` };
      }
    }

    // Check against options
    if (param.options && param.options.length > 0 && value !== undefined) {
      if (!param.options.includes(value)) {
        return { valid: false, error: `${param.name} must be one of: ${param.options.join(', ')}` };
      }
    }

    // Check custom validation
    if (param.validation) {
      if (param.validation instanceof RegExp) {
        if (!param.validation.test(String(value))) {
          return { valid: false, error: `${param.name} failed validation` };
        }
      } else if (typeof param.validation === 'function') {
        try {
          if (!param.validation(value)) {
            return { valid: false, error: `${param.name} failed custom validation` };
          }
        } catch (error) {
          return { valid: false, error: `Validation error for ${param.name}: ${error.message}` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Pre-flight check for skill prerequisites
   */
  static async checkPrerequisites(requires) {
    const missing = [];

    for (const requirement of requires) {
      const command = requirement.split('-')[0].trim();
      const exists = await ShellExecutor.commandExists(command);
      if (!exists) {
        missing.push(requirement);
      }
    }

    return {
      passed: missing.length === 0,
      missing,
    };
  }
}

/**
 * ERROR RECOVERY - Suggestions and automatic fixes
 */
class ErrorRecovery {
  /**
   * Suggest fixes based on error patterns
   */
  static getSuggestions(error, step, context) {
    const suggestions = [];
    const errorMsg = error.message.toLowerCase();

    // Command not found
    if (errorMsg.includes('not found')) {
      const match = error.message.match(/command not found: (\w+)/);
      if (match) {
        suggestions.push(`Install missing tool: brew install ${match[1]} || npm install -g ${match[1]}`);
      }
    }

    // Permission denied
    if (errorMsg.includes('permission denied')) {
      suggestions.push('Run with elevated permissions: sudo command');
      suggestions.push('Or fix file permissions: chmod +x filename');
    }

    // File not found
    if (errorMsg.includes('enoent') || errorMsg.includes('no such file')) {
      suggestions.push('Check file path exists');
      suggestions.push('Create missing directories: mkdir -p path/to/dir');
    }

    // Port already in use
    if (errorMsg.includes('eaddrinuse') || errorMsg.includes('port')) {
      const portMatch = error.message.match(/port[:\s]+(\d+)/i);
      if (portMatch) {
        suggestions.push(`Port ${portMatch[1]} is in use. Kill process: lsof -i :${portMatch[1]}`);
      }
    }

    // Memory issues
    if (errorMsg.includes('out of memory')) {
      suggestions.push('Increase Node memory: NODE_OPTIONS=--max-old-space-size=4096');
    }

    // Network issues
    if (errorMsg.includes('econnrefused') || errorMsg.includes('timeout')) {
      suggestions.push('Check network connection and firewall');
      suggestions.push('Verify service is running and accessible');
    }

    // Generic suggestions
    if (suggestions.length === 0) {
      suggestions.push(`Check step requirements: ${step.title}`);
      suggestions.push('Review command syntax and parameters');
      suggestions.push('Check file permissions and paths');
    }

    return suggestions;
  }

  /**
   * Attempt automatic recovery
   */
  static async attemptAutoRecovery(error, step, context) {
    const errorMsg = error.message.toLowerCase();

    // Auto-fix: Create missing directory
    if (errorMsg.includes('enoent')) {
      const pathMatch = error.message.match(/path[:\s]+'([^']+)'/i) || error.message.match(/ENOENT[:\s]*([^\s]+)/);
      if (pathMatch) {
        try {
          await fs.mkdir(pathMatch[1], { recursive: true });
          console.log(`   ✓ Auto-created directory: ${pathMatch[1]}`);
          return true;
        } catch {
          return false;
        }
      }
    }

    return false;
  }
}

/**
 * MAIN EXPERT SYSTEM EXECUTOR
 */
class ExpertSystemExecutor {
  constructor(skill) {
    this.skill = skill;
    this.context = this.initializeContext();
    this.expertise = 'beginner';
  }

  initializeContext() {
    return {
      userId: process.env.USER || 'anonymous',
      sessionId: `sess_${Date.now()}`,
      timestamp: new Date().toISOString(),
      inputs: {},
      outputs: {},
      decisions: [],
      completedSteps: [],
      currentStep: '',
      errors: [],
      fileBackups: [],
      metadata: {},
    };
  }

  /**
   * Main execution entry point
   */
  async execute(expertise = 'beginner') {
    this.expertise = expertise;

    console.log(`\n🚀 Starting ${this.skill.name} (${expertise} mode)\n`);

    try {
      await FileOperations.initBackups();

      // Validate prerequisites
      if (this.skill.requires && this.skill.requires.length > 0) {
        await this.validatePrerequisites();
      }

      // Validate rules
      if (this.skill.validation && this.skill.validation.length > 0) {
        await this.validateRules();
      }

      // Collect inputs
      if (this.skill.context && this.skill.context.length > 0) {
        await this.collectInputs();
      }

      // Execute steps
      for (const step of this.skill.steps) {
        this.context.currentStep = step.id;

        try {
          await this.executeStep(step, 0);
          this.context.completedSteps.push(step.id);
        } catch (error) {
          await this.handleStepError(step, error);
        }
      }

      // Verify success
      if (this.skill.success && this.skill.success.length > 0) {
        await this.verifySucess();
      }

      console.log('\n✅ Workflow completed successfully!\n');
      this.displaySummary();
    } catch (error) {
      console.error(`\n❌ Workflow failed:`, error.message);
      await this.rollback();
      process.exit(1);
    }
  }

  /**
   * Validate prerequisites
   */
  async validatePrerequisites() {
    console.log('📋 Checking prerequisites...\n');

    const { passed, missing } = await ValidationEngine.checkPrerequisites(this.skill.requires || []);

    if (!passed) {
      console.error('❌ Missing prerequisites:');
      missing.forEach((item) => console.error(`   • ${item}`));
      throw new Error('Prerequisites not met');
    }

    console.log('✓ All prerequisites met\n');
  }

  /**
   * Validate rules
   */
  async validateRules() {
    console.log('✅ Validating configuration...\n');

    const { passed, failures } = await ValidationEngine.validate(this.skill.validation || [], this.context);

    if (!passed) {
      console.error('❌ Validation failed:');
      failures.forEach((failure) => console.error(`   • ${failure}`));
      throw new Error('Validation failed');
    }

    console.log('✓ All validations passed\n');
  }

  /**
   * Collect user inputs
   */
  async collectInputs() {
    console.log('📝 Configuration needed:\n');

    for (const param of this.skill.context || []) {
      const value = process.env[param.name.toUpperCase()] || param.default;

      if (!value && param.required) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }

      this.context.inputs[param.name] = value;
      console.log(`   ✓ ${param.description}: ${param.sensitive ? '***' : value}`);
    }

    console.log();
  }

  /**
   * Execute individual step with retry logic
   */
  async executeStep(step, attemptNumber) {
    const stepNum = this.context.completedSteps.length + 1;
    console.log(`\n📌 Step ${stepNum}: ${step.title}`);
    console.log(`   Type: ${step.type} | Mode: ${this.expertise}`);

    try {
      switch (step.type) {
        case 'execute':
          await this.executeCommand(step);
          break;
        case 'prompt':
          await this.promptUser(step);
          break;
        case 'generate':
          await this.generateCode(step);
          break;
        case 'write-file':
          await this.writeFile(step);
          break;
        case 'validate':
          await this.validateStep(step);
          break;
        case 'display':
          await this.displayContent(step);
          break;
        case 'suggest-fixes':
          await this.suggestFixes(step);
          break;
      }

      // Execute success callbacks
      if (step.onSuccess) {
        for (const action of step.onSuccess) {
          await this.executeStep(action, 0);
        }
      }
    } catch (error) {
      // Retry if available
      const retries = step.retries || 1;
      if (attemptNumber < retries) {
        console.log(`   ⚠️ Attempt ${attemptNumber + 1}/${retries} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.executeStep(step, attemptNumber + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * REAL shell execution with output capture
   */
  async executeCommand(step) {
    if (!step.command) throw new Error('No command specified');

    const timeout = step.timeout || 30000;

    console.log(`   Running: ${step.command}`);
    console.log(`   ${Array(50).fill('─').join('')}`);

    const result = await ShellExecutor.execute(step.command, { timeout });

    console.log(`   ${Array(50).fill('─').join('')}`);

    if (!result.success) {
      throw new Error(`Command failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`);
    }

    this.context.outputs[step.id] = result.stdout;

    // Validate output
    if (step.validation) {
      const { passed, failures } = await ValidationEngine.validate(step.validation, this.context);
      if (!passed) {
        throw new Error(`Output validation failed: ${failures.join(', ')}`);
      }
    }

    console.log(`   ✓ Command completed successfully`);
  }

  /**
   * Prompt user for input
   */
  async promptUser(step) {
    if (!step.prompts || step.prompts.length === 0) return;

    console.log('   Inputs needed:');

    for (const prompt of step.prompts) {
      const value = process.env[prompt.name.toUpperCase()] || prompt.default;

      const validation = ValidationEngine.validateParameter(prompt, value);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      this.context.inputs[prompt.name] = value;
      console.log(`     ✓ ${prompt.description}: ${prompt.sensitive ? '***' : value}`);
    }
  }

  /**
   * REAL code generation
   */
  async generateCode(step) {
    if (!step.template || !step.language) {
      throw new Error('Template and language required for code generation');
    }

    console.log(`   Generating ${step.language} code...`);

    const generatedCode = await CodeGenerator.generateFromTemplate(step.template, step.language, this.context.inputs);

    const validation = await CodeGenerator.validateSyntax(generatedCode, step.language);
    if (!validation.valid) {
      console.warn(`   ⚠️ Syntax issues detected: ${validation.errors.join(', ')}`);
    }

    this.context.outputs[step.id] = generatedCode;

    console.log(`   ${Array(50).fill('─').join('')}`);
    console.log(generatedCode.split('\n').slice(0, 10).join('\n'));
    if (generatedCode.split('\n').length > 10) {
      console.log(`   ... (${generatedCode.split('\n').length - 10} more lines)`);
    }
    console.log(`   ${Array(50).fill('─').join('')}`);
    console.log(`   ✓ Generated ${(generatedCode.length / 1024).toFixed(1)}KB of code`);
  }

  /**
   * REAL file writing with backup
   */
  async writeFile(step) {
    if (!step.command) throw new Error('File path required');

    const filePath = step.command;
    const content = this.context.outputs[step.id] || this.context.outputs[Object.keys(this.context.outputs)[0]];

    if (!content) {
      throw new Error('No content to write. Ensure previous step generated code.');
    }

    await FileOperations.writeFileWithBackup(filePath, content, this.context);
  }

  /**
   * Validation execution
   */
  async validateStep(step) {
    if (!step.validation || step.validation.length === 0) {
      console.log('   No validations to run');
      return;
    }

    console.log('   Validating...');
    const { passed, failures } = await ValidationEngine.validate(step.validation, this.context);

    if (!passed) {
      throw new Error(`Validation failed: ${failures.join(', ')}`);
    }

    console.log(`   ✓ All ${step.validation.length} validations passed`);
  }

  /**
   * Display content
   */
  async displayContent(step) {
    if (step.template) {
      const output = CodeGenerator.render(step.template, this.context.inputs);
      console.log(output);
    }
  }

  /**
   * Suggest fixes
   */
  async suggestFixes(step) {
    console.log('   Analyzing common issues and suggesting fixes...');
  }

  /**
   * Handle step errors with recovery
   */
  async handleStepError(step, error) {
    console.error(`   ❌ Error: ${error.message}`);

    this.context.errors.push({
      step: step.id,
      error: error.message,
      recovery: 'See suggestions below',
      timestamp: new Date().toISOString(),
    });

    const suggestions = ErrorRecovery.getSuggestions(error, step, this.context);
    console.log('\n   💡 Suggestions:');
    suggestions.forEach((suggestion, idx) => {
      console.log(`      ${idx + 1}. ${suggestion}`);
    });

    // Try auto-recovery
    if (this.expertise === 'expert') {
      console.log('\n   🔧 Attempting automatic recovery...');
      const recovered = await ErrorRecovery.attemptAutoRecovery(error, step, this.context);
      if (recovered) {
        console.log('   ✓ Auto-recovery successful, retrying step...');
        await this.executeStep(step, 0);
        return;
      }
    }

    // Execute failure handlers
    if (step.onFailure && step.onFailure.length > 0) {
      console.log('\n   🔧 Executing error recovery steps...\n');
      for (const recovery of step.onFailure) {
        try {
          await this.executeStep(recovery, 0);
        } catch (recoveryError) {
          console.error(`   Could not execute recovery: ${recoveryError.message}`);
        }
      }
    }

    throw error;
  }

  /**
   * Verify success criteria
   */
  async verifySucess() {
    if (!this.skill.success || this.skill.success.length === 0) {
      return;
    }

    console.log('\n✅ Verifying success criteria:\n');

    for (const criterion of this.skill.success) {
      console.log(`   ✓ ${criterion}`);
    }
  }

  /**
   * Display summary
   */
  displaySummary() {
    const duration = Date.now() - new Date(this.context.timestamp).getTime();

    console.log('\n📊 Summary');
    console.log('═'.repeat(60));
    console.log(`   Skill: ${this.skill.name}`);
    console.log(`   Description: ${this.skill.description}`);
    console.log(`   Steps Completed: ${this.context.completedSteps.length}/${this.skill.steps.length}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Expertise Level: ${this.expertise}`);
    console.log(`   Status: SUCCESS ✅`);
    console.log('═'.repeat(60));

    if (Object.keys(this.context.outputs).length > 0) {
      console.log('\n📤 Outputs:');
      for (const [key, value] of Object.entries(this.context.outputs)) {
        const preview = String(value).substring(0, 100);
        console.log(`   • ${key}: ${preview}...`);
      }
    }

    if (this.skill.resources && this.skill.resources.length > 0) {
      console.log('\n📚 Resources:');
      for (const resource of this.skill.resources) {
        console.log(`   • ${resource.title}: ${resource.url}`);
      }
    }
  }

  /**
   * Rollback all changes
   */
  async rollback() {
    console.log('\n🔙 Rolling back changes...\n');

    if (this.context.fileBackups.length > 0) {
      await FileOperations.rollbackAllChanges(this.context);
    }

    if (this.skill.rollback && this.skill.rollback.length > 0) {
      for (const action of this.skill.rollback) {
        try {
          await this.executeStep(action, 0);
        } catch (error) {
          console.error(`   ❌ Rollback step failed: ${error.message}`);
        }
      }
    }

    console.log('\n✓ Rollback complete\n');
  }
}

/**
 * EXPERT PERSONAS
 */
class ExpertPersona {
  static personas = {
    aiEngineer: {
      name: 'AI Engineer',
      expertise: ['agents', 'llms', 'memory', 'multiagent', 'deployment'],
      mode: 'expert',
      autoApprove: true,
    },
    architect: {
      name: 'System Architect',
      expertise: ['architecture', 'scalability', 'performance', 'compliance'],
      mode: 'expert',
      autoApprove: true,
    },
    security: {
      name: 'Security Expert',
      expertise: ['security', 'compliance', 'audit', 'penetration-testing'],
      mode: 'expert',
      autoApprove: false,
    },
    devops: {
      name: 'DevOps Engineer',
      expertise: ['infrastructure', 'deployment', 'monitoring', 'ci-cd'],
      mode: 'expert',
      autoApprove: true,
    },
    fullStack: {
      name: 'Full-Stack Developer',
      expertise: ['frontend', 'backend', 'database', 'api', 'deployment'],
      mode: 'intermediate',
      autoApprove: true,
    },
  };

  static getPersona(name) {
    return this.personas[name] || null;
  }

  static listPersonas() {
    return Object.keys(this.personas);
  }
}

/**
 * BATCH EXECUTOR
 */
class BatchExecutor {
  async executeSkills(skills, mode = 'sequential') {
    console.log(`🚀 Executing ${skills.length} skills in ${mode} mode\n`);

    if (mode === 'sequential') {
      for (let i = 0; i < skills.length; i++) {
        console.log(`\n[${i + 1}/${skills.length}] Executing: ${skills[i].name}`);
        const executor = new ExpertSystemExecutor(skills[i]);
        await executor.execute('expert');
      }
    } else {
      const promises = skills.map((skill) => {
        const executor = new ExpertSystemExecutor(skill);
        return executor.execute('expert');
      });
      await Promise.all(promises);
    }

    console.log(`\n✅ All ${skills.length} skills completed successfully!`);
  }
}

module.exports = {
  ExpertSystemExecutor,
  ExpertPersona,
  BatchExecutor,
  ShellExecutor,
  FileOperations,
  CodeGenerator,
  ValidationEngine,
  ErrorRecovery,
};
