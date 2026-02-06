import React, { useState, useEffect } from 'react';
import './Agency.css';

/**
 * 🎭 Agency Component - Multi-Skill Orchestration UI
 * 
 * Allows users to:
 * 1. Describe their objective
 * 2. View recommended workflow
 * 3. Configure decision points
 * 4. Execute orchestrated workflow
 * 5. Monitor progress across skills
 */

const Agency = () => {
  const [phase, setPhase] = useState('objective'); // objective -> workflow -> configure -> executing -> complete
  const [objective, setObjective] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [orchestrationStatus, setOrchestrationStatus] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Phase 1: Objective Collection
  const handleObjectiveSubmit = async () => {
    if (!objective.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agency/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective })
      });

      if (!response.ok) throw new Error('Failed to analyze objective');

      const data = await response.json();
      setAnalysis(data);
      setWorkflow(data.recommendedWorkflow);
      setPhase('workflow');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 2: Workflow Configuration
  const handleDecisionUpdate = (decisionKey, value) => {
    setDecisions(prev => ({
      ...prev,
      [decisionKey]: value
    }));
  };

  const handleStartOrchestration = async () => {
    setIsLoading(true);
    setError(null);
    setPhase('executing');
    setExecutionLog([]);

    try {
      const response = await fetch('/api/agency/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id,
          decisions
        })
      });

      if (!response.ok) throw new Error('Orchestration failed');

      // Stream response for real-time updates
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'skill-start') {
                setExecutionLog(prev => [...prev, {
                  skillId: data.skillId,
                  status: 'running',
                  startTime: Date.now()
                }]);
              } else if (data.type === 'skill-complete') {
                setExecutionLog(prev => prev.map(log =>
                  log.skillId === data.skillId
                    ? { ...log, status: 'complete', duration: data.duration }
                    : log
                ));
              } else if (data.type === 'complete') {
                setOrchestrationStatus(data);
                setPhase('complete');
              }
            } catch (e) {
              console.error('Failed to parse log entry:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setPhase('workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (toSkillId) => {
    try {
      const response = await fetch('/api/agency/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toSkillId })
      });

      if (!response.ok) throw new Error('Rollback failed');

      // Update UI to show rollback state
      setExecutionLog(prev =>
        prev.filter(log => {
          const skillIndex = workflow.phases
            .flatMap(p => p.skills)
            .indexOf(toSkillId);
          const currentIndex = workflow.phases
            .flatMap(p => p.skills)
            .indexOf(log.skillId);
          return currentIndex <= skillIndex;
        })
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="agency-container">
      <header className="agency-header">
        <h1>🎭 iHuman Agency</h1>
        <p>Orchestrate multiple skills into intelligent workflows</p>
      </header>

      <main className="agency-main">
        {phase === 'objective' && (
          <Section1_ObjectiveCollection
            objective={objective}
            setObjective={setObjective}
            onSubmit={handleObjectiveSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}

        {phase === 'workflow' && analysis && (
          <Section2_WorkflowConfiguration
            analysis={analysis}
            workflow={workflow}
            decisions={decisions}
            onDecisionChange={handleDecisionUpdate}
            onStartOrchestration={handleStartOrchestration}
            isLoading={isLoading}
            error={error}
          />
        )}

        {phase === 'executing' && (
          <Section3_OrchestrationProgress
            workflow={workflow}
            executionLog={executionLog}
            onRollback={handleRollback}
          />
        )}

        {phase === 'complete' && orchestrationStatus && (
          <Section4_OrchestrationComplete
            orchestrationStatus={orchestrationStatus}
            workflow={workflow}
            onRestart={() => {
              setPhase('objective');
              setObjective('');
              setAnalysis(null);
              setWorkflow(null);
              setDecisions({});
              setExecutionLog([]);
            }}
          />
        )}
      </main>
    </div>
  );
};

// Section 1: Objective Collection
const Section1_ObjectiveCollection = ({
  objective,
  setObjective,
  onSubmit,
  isLoading,
  error
}) => (
  <section className="agency-section">
    <div className="objective-collection">
      <h2>🎯 What do you want to build?</h2>
      <p className="subtitle">
        Describe your goal, and we'll recommend a complete workflow
      </p>

      <textarea
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="e.g., 'I want to build a SaaS MVP for my startup' or 'Set up an ML pipeline for recommendation engine'"
        className="objective-textarea"
        disabled={isLoading}
      />

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!objective.trim() || isLoading}
        className="btn btn-primary btn-lg"
      >
        {isLoading ? '🔍 Analyzing...' : '🔍 Analyze Objective'}
      </button>

      <div className="objective-examples">
        <p>Example objectives:</p>
        <ul>
          <li>"Build a full-stack SaaS MVP in 8 weeks"</li>
          <li>"Set up a machine learning data pipeline"</li>
          <li>"Deploy Kubernetes infrastructure on AWS"</li>
          <li>"Create a React Native mobile app"</li>
          <li>"Build a production REST API with monitoring"</li>
        </ul>
      </div>
    </div>
  </section>
);

// Section 2: Workflow Configuration
const Section2_WorkflowConfiguration = ({
  analysis,
  workflow,
  decisions,
  onDecisionChange,
  onStartOrchestration,
  isLoading,
  error
}) => (
  <section className="agency-section">
    <div className="workflow-config">
      <h2>📋 {workflow.name}</h2>
      
      <div className="workflow-summary">
        <div className="summary-item">
          <span className="label">Complexity:</span>
          <span className="value">{workflow.complexity}</span>
        </div>
        <div className="summary-item">
          <span className="label">Time:</span>
          <span className="value">{workflow.estimatedTime}</span>
        </div>
        <div className="summary-item">
          <span className="label">Skills:</span>
          <span className="value">
            {workflow.phases.reduce((sum, p) => sum + p.skills.length, 0)} total
          </span>
        </div>
      </div>

      {/* Phases Overview */}
      <div className="phases-overview">
        <h3>📊 Workflow Phases</h3>
        {workflow.phases.map((phase, idx) => (
          <div key={idx} className="phase-item">
            <div className="phase-header">
              <span className="phase-number">{idx + 1}</span>
              <span className="phase-title">{phase.phase}</span>
              <span className="phase-count">{phase.skills.length} skills</span>
            </div>
            <ul className="phase-skills">
              {phase.skills.map(skill => (
                <li key={skill}>• {skill}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Decision Points */}
      {workflow.phases.some(p => p.decisionPoints) && (
        <div className="decision-points">
          <h3>🎯 Key Decisions</h3>
          {workflow.phases.map((phase, phaseIdx) =>
            phase.decisionPoints?.map((decision, decisionIdx) => (
              <div key={`${phaseIdx}-${decisionIdx}`} className="decision-item">
                <label>{decision.question}</label>
                <select
                  value={decisions[decision.key] || decision.default}
                  onChange={(e) => onDecisionChange(decision.key, e.target.value)}
                >
                  {decision.options.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="action-buttons">
        <button
          onClick={onStartOrchestration}
          disabled={isLoading}
          className="btn btn-primary btn-lg"
        >
          {isLoading ? '⏳ Starting...' : '🚀 Start Orchestration'}
        </button>
      </div>
    </div>
  </section>
);

// Section 3: Orchestration Progress
const Section3_OrchestrationProgress = ({
  workflow,
  executionLog,
  onRollback
}) => {
  const allSkills = workflow.phases.flatMap(p => p.skills);
  const completedSkills = executionLog.filter(l => l.status === 'complete').length;
  const progressPercent = (completedSkills / allSkills.length) * 100;

  return (
    <section className="agency-section">
      <div className="orchestration-progress">
        <h2>⚡ Orchestration in Progress</h2>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="progress-text">
          {completedSkills} of {allSkills.length} skills complete
        </p>

        <div className="execution-timeline">
          {workflow.phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="phase-execution">
              <div className="phase-title">{phase.phase}</div>
              <div className="skills-grid">
                {phase.skills.map(skill => {
                  const logEntry = executionLog.find(l => l.skillId === skill);
                  return (
                    <div
                      key={skill}
                      className={`skill-item skill-${logEntry?.status || 'pending'}`}
                      title={skill}
                    >
                      <span className="skill-icon">
                        {logEntry?.status === 'complete' ? '✅' : 
                         logEntry?.status === 'running' ? '⏳' : '⧖'}
                      </span>
                      <span className="skill-name">{skill}</span>
                      {logEntry?.duration && (
                        <span className="skill-duration">{logEntry.duration}ms</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {executionLog.length > 0 && (
          <div className="rollback-option">
            <p>
              <strong>⚠️ Last executed skill:</strong>{' '}
              {executionLog[executionLog.length - 1].skillId}
            </p>
            <button
              onClick={() => {
                const skillIdx = allSkills.indexOf(
                  executionLog[executionLog.length - 1].skillId
                );
                if (skillIdx > 0) {
                  onRollback(allSkills[skillIdx - 1]);
                }
              }}
              className="btn btn-secondary"
            >
              ↩️ Rollback
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// Section 4: Orchestration Complete
const Section4_OrchestrationComplete = ({
  orchestrationStatus,
  workflow,
  onRestart
}) => (
  <section className="agency-section">
    <div className="orchestration-complete">
      <h2>🎉 Orchestration Complete!</h2>

      <div className="success-summary">
        <div className="summary-stat">
          <span className="stat-number">
            {orchestrationStatus.results.length}
          </span>
          <span className="stat-label">Skills Executed</span>
        </div>
        <div className="summary-stat">
          <span className="stat-number">
            {Math.round(orchestrationStatus.totalTime / 1000)}s
          </span>
          <span className="stat-label">Total Time</span>
        </div>
        <div className="summary-stat">
          <span className="stat-number">100%</span>
          <span className="stat-label">Success Rate</span>
        </div>
      </div>

      <div className="completion-details">
        <h3>📊 Execution Summary</h3>
        <ul>
          {workflow.successMetrics.map((metric, idx) => (
            <li key={idx}>{metric}</li>
          ))}
        </ul>
      </div>

      <div className="next-steps">
        <h3>🚀 Next Steps</h3>
        <p>Your infrastructure is ready! Here's what you can do now:</p>
        <ul>
          <li>Review the execution logs and context</li>
          <li>Start using your newly created system</li>
          <li>Run another orchestration for different objective</li>
          <li>Customize individual skills in the execution</li>
        </ul>
      </div>

      <button onClick={onRestart} className="btn btn-primary btn-lg">
        🔄 Start New Orchestration
      </button>
    </div>
  </section>
);

const Section = ({ children }) => (
  <div className="agency-section">{children}</div>
);

export default Agency;
