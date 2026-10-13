#!/usr/bin/env bash
# ==============================================================================
# Environment Switcher Script for GURO-App (WSL/Linux)
# Usage: ./set-env.sh [development|production]
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_ENV="${1:-development}"

if [ "$TARGET_ENV" != "development" ] && [ "$TARGET_ENV" != "production" ]; then
    echo "❌ Error: Invalid environment '$TARGET_ENV'."
    echo "👉 Usage: ./set-env.sh [development|production]"
    exit 1
fi

echo "=================================================="
echo "🔄 Switching GURO-App Environment to: [$TARGET_ENV]"
echo "=================================================="

# 1. Backend
if [ -f "$PROJECT_ROOT/backend/.env.$TARGET_ENV" ]; then
    cp "$PROJECT_ROOT/backend/.env.$TARGET_ENV" "$PROJECT_ROOT/backend/.env"
    echo "✅ [Backend]     backend/.env updated to .$TARGET_ENV"
fi

# 2. Guro-Mobile
if [ -f "$PROJECT_ROOT/frontend/Guro-Mobile/.env.$TARGET_ENV" ]; then
    cp "$PROJECT_ROOT/frontend/Guro-Mobile/.env.$TARGET_ENV" "$PROJECT_ROOT/frontend/Guro-Mobile/.env"
    echo "✅ [Mobile]      frontend/Guro-Mobile/.env updated to .$TARGET_ENV"
fi

echo "=================================================="
echo "🎉 GURO environment successfully set to [$TARGET_ENV]!"
if [ "$TARGET_ENV" = "production" ]; then
    echo "🌐 Cloud API Base: https://neoguro.app"
else
    echo "💻 Local API Base: http://localhost:8000"
fi
echo "=================================================="
