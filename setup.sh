#!/bin/bash

# Antigravity Skills - Setup Script
# This script sets up the complete application with all components

set -e

echo "🚀 Antigravity Skills - Complete Setup"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Install gray-matter
echo "📦 Installing gray-matter..."
npm install gray-matter

# Test CLI
echo ""
echo "🧪 Testing CLI tool..."
node packages/cli/bin/cli.js info

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "  1. CLI Tool (Ready now!):"
echo "     node packages/cli/bin/cli.js search 'react'"
echo ""
echo "  2. Create alias for easy access:"
echo "     alias antigravity='node $(pwd)/packages/cli/bin/cli.js'"
echo "     antigravity search 'authentication'"
echo ""
echo "  3. Export all skills:"
echo "     node packages/cli/bin/cli.js export --format=json > skills.json"
echo ""
echo "  4. Web Dashboard (coming soon):"
echo "     cd packages/web && npm run dev"
echo ""
echo "  5. Docker (coming soon):"
echo "     docker-compose up"
echo ""
