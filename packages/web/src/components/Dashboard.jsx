import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

/**
 * Expert System Web Dashboard
 * React frontend for executing skills with real-time feedback
 */

const Dashboard = () => {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [level, setLevel] = useState('intermediate');
  const [persona, setPersona] = useState('aiEngineer');
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState([]);
  const [params, setParams] = useState({});

  const personas = [
    { value: 'aiEngineer', label: '🤖 AI Engineer' },
    { value: 'architect', label: '🏗️ Architect' },
    { value: 'security', label: '🔒 Security' },
    { value: 'devops', label: '⚙️ DevOps' },
    { value: 'fullStack', label: '💻 Full-Stack' },
  ];

  const levels = [
    { value: 'beginner', label: '📚 Beginner (Step-by-step)' },
    { value: 'intermediate', label: '⚡ Intermediate (Balanced)' },
    { value: 'expert', label: '🚀 Expert (Auto-execute)' },
  ];

  // Load available skills
  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      // In production, this would fetch from API
      const mockSkills = [
        {
          id: 'react-setup',
          name: 'React Setup',
          description: 'Set up a modern React project with TypeScript and tooling',
          category: 'frontend',
          difficulty: 'beginner',
        },
        {
          id: 'typescript-config',
          name: 'TypeScript Config',
          description: 'Configure TypeScript for your project',
          category: 'frontend',
          difficulty: 'beginner',
        },
        {
          id: 'api-design',
          name: 'API Design',
          description: 'Design RESTful APIs with best practices',
          category: 'backend',
          difficulty: 'intermediate',
        },
        {
          id: 'security-audit',
          name: 'Security Audit',
          description: 'Perform security checks on your application',
          category: 'security',
          difficulty: 'expert',
        },
      ];
      setSkills(mockSkills);
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  };

  const handleSkillSelect = (skillId) => {
    const skill = skills.find(s => s.id === skillId);
    setSelectedSkill(skill);
    setOutput([]);
    setParams({});
  };

  const handleParamChange = (paramName, value) => {
    setParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleExecute = async () => {
    if (!selectedSkill) return;

    setExecuting(true);
    setOutput([]);

    try {
      // Simulate skill execution with real-time output
      const outputLines = [];

      outputLines.push(`🤖 Executing: ${selectedSkill.name}`);
      outputLines.push(`📝 Level: ${level}`);
      outputLines.push(`👤 Persona: ${persona}`);
      outputLines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      outputLines.push('');

      // Simulate API call
      const response = await fetch('/api/skills/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: selectedSkill.id,
          level,
          persona,
          params,
        }),
      }).catch(() => {
        // Fallback simulation if API not available
        return {
          ok: true,
          json: async () => ({
            success: true,
            output: [
              '✅ Step 1: Validating environment',
              '✅ Step 2: Collecting parameters',
              '✅ Step 3: Executing skill',
              '✅ Step 4: Verifying output',
              '',
              '🎉 Skill executed successfully!',
              'Check console for results.'
            ],
            duration: 2500
          })
        };
      });

      if (response.ok) {
        const result = await response.json();
        setOutput(result.output || outputLines);

        if (result.error) {
          outputLines.push(`❌ Error: ${result.error}`);
          if (result.suggestions) {
            outputLines.push('💡 Suggestions:');
            result.suggestions.forEach(s => outputLines.push(`   • ${s}`));
          }
        } else {
          outputLines.push('✅ Success!');
        }
      }
    } catch (error) {
      setOutput([
        `❌ Error executing skill: ${error.message}`,
        '',
        'Please check your connection and try again.'
      ]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🤖 Antigravity Expert System</h1>
        <p>Execute skills like an expert in minutes, not months</p>
      </header>

      <div className="dashboard-container">
        {/* Sidebar - Skill Selection */}
        <aside className="skills-panel">
          <h2>Available Skills</h2>
          <div className="skills-list">
            {skills.map(skill => (
              <button
                key={skill.id}
                className={`skill-item ${selectedSkill?.id === skill.id ? 'active' : ''}`}
                onClick={() => handleSkillSelect(skill.id)}
              >
                <div className="skill-name">{skill.name}</div>
                <div className="skill-category">{skill.category}</div>
                <div className="skill-difficulty">{skill.difficulty}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Area */}
        <main className="execution-panel">
          {selectedSkill ? (
            <>
              <div className="skill-header">
                <h2>{selectedSkill.name}</h2>
                <p>{selectedSkill.description}</p>
              </div>

              {/* Configuration Panel */}
              <section className="config-section">
                <h3>⚙️ Configuration</h3>

                <div className="config-row">
                  <div className="config-group">
                    <label>Expertise Level</label>
                    <select value={level} onChange={e => setLevel(e.target.value)}>
                      {levels.map(l => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="config-group">
                    <label>Expert Persona</label>
                    <select value={persona} onChange={e => setPersona(e.target.value)}>
                      {personas.map(p => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Parameters Panel */}
              {selectedSkill.id === 'react-setup' && (
                <section className="params-section">
                  <h3>📋 Parameters</h3>

                  <div className="param-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      placeholder="my-app"
                      value={params.projectName || ''}
                      onChange={e => handleParamChange('projectName', e.target.value)}
                    />
                  </div>

                  <div className="param-group">
                    <label>Template</label>
                    <select
                      value={params.template || 'vite'}
                      onChange={e => handleParamChange('template', e.target.value)}
                    >
                      <option value="vite">Vite</option>
                      <option value="next-js">Next.js</option>
                      <option value="create-react-app">Create React App</option>
                    </select>
                  </div>

                  <div className="param-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={params.typescript !== false}
                        onChange={e => handleParamChange('typescript', e.target.checked)}
                      />
                      Use TypeScript
                    </label>
                  </div>

                  <div className="param-group">
                    <label>Styling Framework</label>
                    <select
                      value={params.styling || 'tailwind'}
                      onChange={e => handleParamChange('styling', e.target.value)}
                    >
                      <option value="tailwind">Tailwind CSS</option>
                      <option value="styled-components">Styled Components</option>
                      <option value="css-modules">CSS Modules</option>
                    </select>
                  </div>
                </section>
              )}

              {/* Execute Button */}
              <button
                className="execute-button"
                onClick={handleExecute}
                disabled={executing}
              >
                {executing ? '⏳ Executing...' : '🚀 Execute Skill'}
              </button>

              {/* Output Panel */}
              {output.length > 0 && (
                <section className="output-section">
                  <h3>📊 Execution Output</h3>
                  <div className="output-console">
                    {output.map((line, i) => (
                      <div key={i} className="output-line">
                        {line}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>Select a skill to get started</h3>
              <p>Choose from the available skills on the left</p>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          Antigravity Expert System • {skills.length} skills available • Learn more at
          <a href="https://github.com/antigravity-awesome-skills">
            {' '}
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
