/**
 * 🎭 AgencyOrchestrator - Core Orchestration Engine
 * 
 * Transforms user objectives into coordinated multi-skill workflows
 * with context passing, decision points, and full rollback capability.
 */

const EventEmitter = require('events');
const path = require('path');

class ContextBus {
  constructor() {
    this.contexts = {
      project: {},
      skills: {},
      decisions: {},
      rollbackPoints: {},
      log: [],
      metadata: {
        startTime: Date.now(),
        workflowId: this._generateId()
      }
    };
  }

  _generateId() {
    return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  set(namespace, key, value) {
    if (!this.contexts[namespace]) {
      this.contexts[namespace] = {};
    }
    this.contexts[namespace][key] = value;
  }

  get(namespace, key) {
    return key 
      ? this.contexts[namespace]?.[key]
      : this.contexts[namespace];
  }

  getAll() {
    return this.contexts;
  }

  addLog(entry) {
    this.contexts.log.push({
      timestamp: Date.now(),
      ...entry
    });
  }

  extractInputs(skillId, requiredInputKeys) {
    const inputs = {};
    for (const key of requiredInputKeys) {
      // First check in this skill's outputs
      if (this.contexts.skills[skillId]?.[key]) {
        inputs[key] = this.contexts.skills[skillId][key];
      } else {
        // Then check in project context
        for (const [skillName, skillContext] of Object.entries(this.contexts.skills)) {
          if (skillContext[key]) {
            inputs[key] = skillContext[key];
            break;
          }
        }
      }
    }
    return inputs;
  }

  saveRollbackPoint(skillId, backup) {
    this.contexts.rollbackPoints[skillId] = {
      backup,
      timestamp: Date.now()
    };
  }

  rollback(toSkillId) {
    const skillNames = Object.keys(this.contexts.skills);
    const skillIndex = skillNames.indexOf(toSkillId);
    
    // Clear everything after this skill
    for (let i = skillIndex + 1; i < skillNames.length; i++) {
      delete this.contexts.skills[skillNames[i]];
      delete this.contexts.rollbackPoints[skillNames[i]];
    }
  }
}

class DependencyGraphBuilder {
  build(workflow) {
    const graph = new Map(); // skillId -> { dependencies: [], phase, index }
    const skillsInOrder = [];

    for (const phase of workflow.phases) {
      for (let i = 0; i < phase.skills.length; i++) {
        const skill = phase.skills[i];
        
        graph.set(skill, {
          dependencies: phase.dependencies?.[skill] || [],
          phase: phase.phase,
          index: i,
          parallelizable: phase.parallelizable === true
        });
        
        skillsInOrder.push(skill);
      }
    }

    return {
      graph,
      executionOrder: this._topologicalSort(graph, skillsInOrder),
      parallel: this._identifyParallelGroups(graph, workflow)
    };
  }

  _topologicalSort(graph, skillsInOrder) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (skill) => {
      if (visited.has(skill)) return;
      if (visiting.has(skill)) {
        throw new Error(`Circular dependency detected: ${skill}`);
      }

      visiting.add(skill);

      const deps = graph.get(skill)?.dependencies || [];
      for (const dep of deps) {
        visit(dep);
      }

      visiting.delete(skill);
      visited.add(skill);
      sorted.push(skill);
    };

    for (const skill of skillsInOrder) {
      visit(skill);
    }

    return sorted;
  }

  _identifyParallelGroups(graph, workflow) {
    const groups = [];
    let currentGroup = [];

    for (const phase of workflow.phases) {
      if (phase.parallelizable) {
        groups.push(phase.skills);
      } else {
        for (const skill of phase.skills) {
          groups.push([skill]);
        }
      }
    }

    return groups;
  }
}

class ObjectiveAnalyzer {
  constructor(workflows) {
    this.workflows = workflows;
    this.patterns = {
      saas: ['saas', 'startup', 'web app', 'product'],
      ml: ['machine learning', 'ml', 'data pipeline', 'ai model'],
      devops: ['infrastructure', 'kubernetes', 'docker', 'cloud', 'devops'],
      mobile: ['mobile', 'ios', 'android', 'app'],
      backend: ['api', 'backend', 'server', 'microservice']
    };
  }

  analyze(objective) {
    const objectiveLower = objective.toLowerCase();
    let matchedType = 'custom';
    let confidence = 0;

    for (const [type, keywords] of Object.entries(this.patterns)) {
      const matches = keywords.filter(k => objectiveLower.includes(k)).length;
      if (matches > confidence) {
        confidence = matches;
        matchedType = type;
      }
    }

    const recommendedWorkflow = this._findWorkflow(matchedType);

    return {
      objective,
      matchedType,
      confidence: Math.min(100, confidence * 25),
      recommendedWorkflow,
      decisionPoints: recommendedWorkflow?.decisionPoints || [],
      estimatedTime: recommendedWorkflow?.estimatedTime || 'unknown',
      phases: recommendedWorkflow?.phases || [],
      requiredSkills: recommendedWorkflow?.phases
        .flatMap(p => p.skills) || []
    };
  }

  _findWorkflow(type) {
    const typeMap = {
      saas: 'full-stack-saas-mvp',
      ml: 'ml-data-pipeline',
      devops: 'devops-infrastructure',
      mobile: 'mobile-app',
      backend: 'backend-api'
    };

    const workflowId = typeMap[type];
    return this.workflows.find(w => w.id === workflowId);
  }
}

class DecisionEngine extends EventEmitter {
  constructor() {
    super();
    this.decisions = [];
  }

  async processDecisionPoints(workflow, contextBus, userInputHandler) {
    const results = [];

    for (const phase of workflow.phases || []) {
      if (phase.decisionPoints && phase.decisionPoints.length > 0) {
        for (const decision of phase.decisionPoints) {
          const userChoice = await userInputHandler(decision);
          
          results.push({
            decision,
            choice: userChoice,
            timestamp: Date.now(),
            phase: phase.phase
          });

          contextBus.set('decisions', decision.key, userChoice);
          this.emit('decision', { decision, choice: userChoice });
        }
      }
    }

    return results;
  }

  async replanWorkflow(workflow, decisions) {
    // Clone workflow
    const replanedWorkflow = JSON.parse(JSON.stringify(workflow));

    for (const { decision, choice } of decisions) {
      // Apply conditional logic based on choice
      if (decision.conditional) {
        for (const [condition, modifications] of Object.entries(decision.conditional)) {
          if (condition === choice) {
            // Apply modifications to replan
            this._applyModifications(replanedWorkflow, modifications);
          }
        }
      }
    }

    return replanedWorkflow;
  }

  _applyModifications(workflow, modifications) {
    if (modifications.skipSkills) {
      for (const phase of workflow.phases) {
        phase.skills = phase.skills.filter(s => !modifications.skipSkills.includes(s));
      }
    }

    if (modifications.addSkills) {
      for (const { phase: phaseName, skills } of modifications.addSkills) {
        const phase = workflow.phases.find(p => p.phase === phaseName);
        if (phase) {
          phase.skills = [...phase.skills, ...skills];
        }
      }
    }

    if (modifications.updateParams) {
      if (!workflow.skillParams) workflow.skillParams = {};
      Object.assign(workflow.skillParams, modifications.updateParams);
    }
  }
}

class OrchestrationEngine extends EventEmitter {
  constructor(skillExecutor, workflows) {
    super();
    this.skillExecutor = skillExecutor;
    this.workflows = workflows;
    this.isRunning = false;
    this.isPaused = false;
    this.contextBus = new ContextBus();
  }

  async orchestrate(objective, userInputHandler) {
    if (this.isRunning) {
      throw new Error('Orchestration already running');
    }

    this.isRunning = true;
    this.emit('start', { objective });

    try {
      // Step 1: Analyze objective
      const analyzer = new ObjectiveAnalyzer(this.workflows);
      const analysis = analyzer.analyze(objective);
      this.emit('analysis', analysis);

      if (!analysis.recommendedWorkflow) {
        throw new Error(`No workflow found for: ${objective}`);
      }

      // Step 2: Handle decision points
      const decisionEngine = new DecisionEngine();
      const decisions = await decisionEngine.processDecisionPoints(
        analysis.recommendedWorkflow,
        this.contextBus,
        userInputHandler
      );

      // Step 3: Replan based on decisions
      const finalWorkflow = await decisionEngine.replanWorkflow(
        analysis.recommendedWorkflow,
        decisions
      );
      this.emit('workflow-ready', { workflow: finalWorkflow, decisions });

      // Step 4: Build dependency graph
      const graphBuilder = new DependencyGraphBuilder();
      const { graph, executionOrder } = graphBuilder.build(finalWorkflow);
      this.emit('graph-built', { executionOrder });

      // Step 5: Execute skills in order
      const results = await this._executeWorkflow(
        executionOrder,
        graph,
        finalWorkflow
      );

      this.emit('complete', {
        results,
        contextBus: this.contextBus.getAll(),
        totalTime: Date.now() - this.contextBus.contexts.metadata.startTime
      });

      return {
        success: true,
        results,
        context: this.contextBus.getAll()
      };

    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async _executeWorkflow(executionOrder, graph, workflow) {
    const results = {};

    for (const skillId of executionOrder) {
      // Check if paused
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.emit('skill-start', { skillId });

      try {
        // Extract inputs from context
        const skillNode = graph.get(skillId);
        const inputs = this.contextBus.extractInputs(
          skillId,
          skillNode.dependencies
        );

        // Get skill parameters
        const params = workflow.skillParams?.[skillId] || {};

        // Execute skill
        const startTime = Date.now();
        const result = await this.skillExecutor.execute(skillId, {
          ...inputs,
          ...params,
          workflowContext: {
            workflowId: this.contextBus.contexts.metadata.workflowId,
            phase: skillNode.phase
          }
        });

        const duration = Date.now() - startTime;

        // Store outputs in context bus
        this.contextBus.set('skills', skillId, result.outputs || {});
        this.contextBus.saveRollbackPoint(skillId, result.backup);
        this.contextBus.addLog({
          skill: skillId,
          status: 'success',
          duration
        });

        results[skillId] = result;

        this.emit('skill-complete', {
          skillId,
          duration,
          outputs: result.outputs
        });

      } catch (error) {
        this.contextBus.addLog({
          skill: skillId,
          status: 'error',
          error: error.message
        });

        this.emit('skill-error', {
          skillId,
          error,
          canRetry: true,
          canRollback: Object.keys(results).length > 0
        });

        // Decide whether to retry or rollback
        const action = await this._handleSkillError(skillId, error);
        
        if (action === 'rollback') {
          this.contextBus.rollback(skillId);
          return results; // Stop here
        } else if (action === 'retry') {
          // Retry this skill
          executionOrder.splice(executionOrder.indexOf(skillId), 1);
          executionOrder.unshift(skillId);
          continue;
        }
      }
    }

    return results;
  }

  async _handleSkillError(skillId, error) {
    // Emit error event and wait for handler decision
    return new Promise((resolve) => {
      this.emit('require-decision', {
        type: 'error-handling',
        skillId,
        error,
        options: ['retry', 'rollback', 'continue'],
        callback: (choice) => resolve(choice)
      });
    });
  }

  pause() {
    this.isPaused = true;
    this.emit('paused');
  }

  resume() {
    this.isPaused = false;
    this.emit('resumed');
  }

  async rollback(toSkillId) {
    this.contextBus.rollback(toSkillId);
    this.emit('rolled-back', { toSkillId });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      context: this.contextBus.getAll(),
      log: this.contextBus.get('log')
    };
  }
}

module.exports = {
  ContextBus,
  DependencyGraphBuilder,
  ObjectiveAnalyzer,
  DecisionEngine,
  OrchestrationEngine
};
