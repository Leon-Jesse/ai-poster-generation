#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting backend build process..."

# Define variables
APP_NAME="auradraw"
OUTPUT_DIR="build_dist"
BINARY_NAME="auradraw-backend"
TARGET_OS="linux" # Build for Linux by default as it's for production
TARGET_ARCH="amd64"

# 1. Clean previous build
echo "🧹 Cleaning up previous build..."
if [ -d "$OUTPUT_DIR" ]; then
    rm -rf "$OUTPUT_DIR"
fi
if [ -f "${APP_NAME}-backend.tar.gz" ]; then
    rm "${APP_NAME}-backend.tar.gz"
fi
mkdir -p "$OUTPUT_DIR"

# 2. Download dependencies
echo "📦 Downloading dependencies..."
go mod download

# 3. Build the binary
echo "🏗️  Building binary for ${TARGET_OS}/${TARGET_ARCH}..."
CGO_ENABLED=0 GOOS=$TARGET_OS GOARCH=$TARGET_ARCH go build -ldflags="-s -w" -o "$OUTPUT_DIR/$BINARY_NAME" ./cmd/auradraw

# 4. Copy configuration and other necessary files
echo "📂 Copying configuration files..."
# Copy config files if they exist (excluding .env as it contains secrets, usually managed separately in prod)
# But we copy .env.example if it exists, or just copy the config structure
mkdir -p "$OUTPUT_DIR/config"
cp config/*.yaml "$OUTPUT_DIR/config/" 2>/dev/null || :

# Copy scripts if needed
if [ -d "scripts" ]; then
    cp -r scripts "$OUTPUT_DIR/"
    chmod +x "$OUTPUT_DIR/scripts/"*.sh
fi

# 5. Create startup script in dist
cat <<EOF > "$OUTPUT_DIR/start.sh"
#!/bin/bash
# Startup script for production
export GIN_MODE=release
./$BINARY_NAME
EOF
chmod +x "$OUTPUT_DIR/start.sh"

# 6. Compress the distribution
echo "🗜️  Compressing build artifacts..."
# Set COPYFILE_DISABLE=1 to prevent macOS from adding extended attributes (._ files)
export COPYFILE_DISABLE=1
tar -czf "${APP_NAME}-backend.tar.gz" -C "$OUTPUT_DIR" .

echo "✅ Build successful! Output: ${APP_NAME}-backend.tar.gz"
ls -lh "${APP_NAME}-backend.tar.gz"
