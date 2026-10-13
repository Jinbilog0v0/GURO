#!/usr/bin/env bash
# ==============================================================================
# Smart One-Command Deploy Script for GURO
# Usage: ./deploy.sh
# What it does:
#  1. Git pull latest changes from GitHub onto THIS laptop (frontend + backend)
#  2. Builds fresh Guro-Web bundle locally (npm run build -> dist/)
#  3. SSH into VM -> pulls latest backend git changes
#  4. Smart check:
#     - If backend is "Already up to date": skips composer & migration overhead
#     - If composer.lock changed: runs composer install automatically
#  5. Rsyncs fresh dist/ to VM with --delete
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM_HOST="thesis"
REMOTE_PATH="/var/www/guro"

echo "=========================================================="
echo "🚀 Deploying GURO -> https://neoguro.app"
echo "=========================================================="

# 1. Pull Latest Changes on THIS Laptop
echo ""
echo "📥 [1/4] Pulling latest repository changes onto this laptop..."
cd "$PROJECT_ROOT"
git pull origin master
echo "✅ Local repository up-to-date."

# 2. Build Frontend Web Locally
echo ""
echo "📦 [2/4] Building Frontend Web (dist)..."
cd "$PROJECT_ROOT/frontend/Guro-Web"
npm run build
echo "✅ Build completed successfully."

# 3. Pull Git Backend Changes on VM with Smart Detection
echo ""
echo "📥 [3/4] Pulling latest backend Git changes on VM..."
ssh "$VM_HOST" << 'EOF'
cd /var/www/guro
PULL_OUTPUT=$(git pull origin master)
echo "$PULL_OUTPUT"

cd backend
if [[ "$PULL_OUTPUT" == *"Already up to date."* ]]; then
    echo "⚡ Backend code is already up-to-date. Skipping composer & migrations."
else
    # Check if composer.lock was modified in the new commits
    if git diff --name-only HEAD@{1} HEAD | grep -q "composer.lock"; then
        echo "📦 composer.lock changed. Running composer install..."
        composer install --no-dev --optimize-autoloader
    else
        echo "⏩ No new PHP packages. Skipping composer install."
    fi

    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan migrate --force
fi
EOF

# 4. Rsync Dist Folder to VM
echo ""
echo "📤 [4/4] Rsyncing fresh dist/ bundle to VM..."
rsync -avz --delete "$PROJECT_ROOT/frontend/Guro-Web/dist/" "$VM_HOST:$REMOTE_PATH/frontend/Guro-Web/dist/"
echo "✅ Frontend dist cleanly synced."

echo ""
echo "=========================================================="
echo "🎉 GURO deployment complete! Live at: https://neoguro.app"
echo "=========================================================="
