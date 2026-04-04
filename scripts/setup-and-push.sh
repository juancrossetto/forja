#!/bin/bash
# Método R3SET - Complete Setup Script
# 1. Downloads fonts
# 2. Installs dependencies
# 3. Pushes to GitHub

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Método R3SET - Setup Completo"
echo "================================"
echo ""

# Step 1: Download fonts
echo "📦 Paso 1: Descargando fuentes..."
bash scripts/setup-fonts.sh

# Step 2: Install dependencies
echo ""
echo "📦 Paso 2: Instalando dependencias..."
npm install

# Step 3: Initialize git and push
echo ""
echo "📦 Paso 3: Subiendo a GitHub..."

# Init git if not already
if [ ! -d ".git" ]; then
  git init
fi

git add -A
git commit -m "feat: Initial setup - Método R3SET fitness app

- Expo + TypeScript + React Navigation + Zustand
- 16 screens based on design system 'The Kinetic Monolith'
- Design system: colors, typography, spacing
- Reusable components: Button, Card, Input, MetricCard, Tag, etc.
- Navigation: Bottom Tabs + Stacks (Auth, Home, Training, Nutrition, Progress)
- Zustand stores: auth, training, nutrition, progress, goals
- Screens: Login, SignUp, Home, Training flow, Nutrition, Progress, Photos, Measurements, Profile"

git branch -M main
git remote add origin https://github.com/juancrossetto/forja.git 2>/dev/null || git remote set-url origin https://github.com/juancrossetto/forja.git
git push -u origin main

echo ""
echo "✅ Todo listo! Tu app está en: https://github.com/juancrossetto/forja"
echo ""
echo "Para correr la app:"
echo "  cd $PROJECT_DIR"
echo "  npx expo start"
