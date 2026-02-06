---
name: react-setup
description: "Set up a modern React project with best practices, TypeScript, and tooling"
type: workflow
category: frontend
difficulty: beginner
timeEstimate: "10 minutes"
version: "2.0"
tags: [react, typescript, vite, frontend, setup]

requires:
  - command: "node --version"
    description: "Node.js must be installed (16+)"
  - command: "npm --version"
    description: "npm must be installed"

parameters:
  - name: projectName
    type: string
    description: "Name for your React project (lowercase, hyphens only)"
    required: true
    validation: 
      pattern: "^[a-z0-9-]+$"
      minLength: 2
      maxLength: 50
    example: "my-app"
    
  - name: template
    type: select
    description: "Choose project template"
    options: ["vite", "next-js", "create-react-app"]
    default: "vite"
    required: true
    
  - name: typescript
    type: boolean
    description: "Use TypeScript?"
    default: true
    
  - name: styling
    type: select
    description: "CSS framework"
    options: ["tailwind", "styled-components", "css-modules"]
    default: "tailwind"
    
  - name: eslint
    type: boolean
    description: "Configure ESLint?"
    default: true
    
  - name: prettier
    type: boolean
    description: "Configure Prettier?"
    default: true

validation:
  - name: projectNameValid
    rule: "projectName.length > 2 && projectName.length < 50"
    error: "Project name must be 2-50 characters"
    
  - name: nodeVersion
    rule: "nodeVersion >= 16"
    error: "Node.js 16+ is required"
    
  - name: directoryNotExists
    rule: "!fileExists(projectName)"
    error: "Directory {{projectName}} already exists"

steps:
  - id: "confirm-setup"
    title: "Confirm Configuration"
    type: display
    content: |
      📋 Your React Setup:
      - Template: {{template}}
      - Language: {{typescript ? 'TypeScript' : 'JavaScript'}}
      - Styling: {{styling}}
      - ESLint: {{eslint ? 'Yes' : 'No'}}
      - Prettier: {{prettier ? 'Yes' : 'No'}}
      - Project: {{projectName}}
      
      Ready to proceed? (cannot be undone)

  - id: "create-project"
    title: "Create Project"
    type: execute
    command: "npm create vite@latest {{projectName}} -- --template {{typescript ? 'react-ts' : 'react'}}"
    timeout: 300000
    onFailure:
      - type: "suggest-fixes"
        suggestions:
          - "Check internet connection"
          - "Ensure Node.js 16+ is installed"
          - "Try: npm cache clean --force"

  - id: "install-deps"
    title: "Install Dependencies"
    type: execute
    command: "cd {{projectName}} && npm install"
    timeout: 600000
    
  - id: "config-tailwind"
    title: "Configure Tailwind CSS"
    type: conditional
    condition: "styling === 'tailwind'"
    steps:
      - id: "install-tailwind"
        type: execute
        command: "cd {{projectName}} && npm install -D tailwindcss postcss autoprefixer"
      - id: "init-tailwind"
        type: execute
        command: "cd {{projectName}} && npx tailwindcss init -p"

  - id: "config-styled"
    title: "Configure Styled Components"
    type: conditional
    condition: "styling === 'styled-components'"
    steps:
      - id: "install-styled"
        type: execute
        command: "cd {{projectName}} && npm install styled-components"
      - id: "install-styled-types"
        type: conditional
        condition: "typescript"
        step:
          type: execute
          command: "cd {{projectName}} && npm install -D @types/styled-components"

  - id: "setup-eslint"
    title: "Configure ESLint"
    type: conditional
    condition: "eslint"
    step:
      type: execute
      command: "cd {{projectName}} && npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks"

  - id: "setup-prettier"
    title: "Configure Prettier"
    type: conditional
    condition: "prettier"
    step:
      type: execute
      command: "cd {{projectName}} && npm install -D prettier"

  - id: "init-git"
    title: "Initialize Git"
    type: execute
    command: "cd {{projectName}} && git init && git add . && git commit -m 'Initial React setup'"
    onFailure:
      - type: display
        message: "⚠️ Git not available (optional)"

  - id: "success"
    title: "✅ Project Ready!"
    type: display
    content: |
      🎉 Your React project is ready!
      
      📁 {{projectName}}/
      🔧 Template: {{template}}
      � Language: {{typescript ? 'TypeScript' : 'JavaScript'}}
      🎨 Styling: {{styling}}
      {{eslint ? '✅ ESLint' : ''}}
      {{prettier ? '✅ Prettier' : ''}}
      
      🚀 Next steps:
      1. cd {{projectName}}
      2. npm run dev
      3. Open http://localhost:5173
      
      Happy coding! �

success:
  - "Project created"
  - "Dependencies installed"
  - "Configurations applied"
  - "Ready to develop"

rollback:
  - type: execute
    command: "rm -rf {{projectName}}"
    description: "Remove project directory"

related:
  - typescript-config
  - tailwind-setup
  - api-integration
  - testing-setup

resources:
  - title: "React Docs"
    url: "https://react.dev"
  - title: "Vite"
    url: "https://vitejs.dev"
  - title: "TypeScript"
    url: "https://www.typescriptlang.org"
---

# React Project Setup

Set up a modern, production-ready React project with optional TypeScript, styling, and tooling.

## What You'll Get

✅ Modern build tool (Vite, Next.js, or Create React App)
✅ TypeScript or JavaScript
✅ CSS framework (Tailwind, Styled Components, or CSS Modules)
✅ ESLint for code quality (optional)
✅ Prettier for formatting (optional)
✅ Git initialization
✅ Ready to start developing

## Prerequisites

- Node.js 16+
- npm 7+
- ~15 minutes

## Quick Start

```bash
antigravity-expert react-setup --level=beginner
# or
antigravity-expert react-setup --level=expert --persona=aiEngineer
```
