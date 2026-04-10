#!/bin/bash

# LinkedIn Post Manager Dashboard Launcher
# Boots the Hono server using Bun and provides the local URL.

PROJECT_ROOT=$(pwd)
DASHBOARD_DIR="$PROJECT_ROOT/dashboard"

if [ ! -d "$DASHBOARD_DIR/node_modules" ]; then
    echo "Installing dependencies with Bun..."
    cd "$DASHBOARD_DIR" && bun install
fi

# Allow port to be passed as argument, default to 6842
PORT=${1:-6842}

echo "🚀 Starting Post Scout Dashboard (Bun + Hono)..."
echo "🔗 Open http://localhost:$PORT in your browser"

cd "$DASHBOARD_DIR" && PORT=$PORT bun server.js
