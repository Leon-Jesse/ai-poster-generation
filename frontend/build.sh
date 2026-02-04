#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting build process..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm ci

# 2. Build the project
echo "🏗️  Building the project..."
npm run build

# 3. Create dist.tar.gz
echo "🗜️  Compressing dist directory..."
if [ -f "dist.tar.gz" ]; then
    rm dist.tar.gz
fi

# Set COPYFILE_DISABLE=1 to prevent macOS from adding extended attributes (._ files)
# This fixes "tar: Ignoring unknown extended header keyword" warnings on Linux
export COPYFILE_DISABLE=1
tar -czf dist.tar.gz dist

echo "✅ Build successful! Output: dist.tar.gz"
ls -lh dist.tar.gz
