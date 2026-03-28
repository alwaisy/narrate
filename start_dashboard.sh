#!/bin/bash

# LinkedIn Post Manager Dashboard Launcher
# Boots the Node.js server and provides the local URL.

PROJECT_ROOT=$(pwd)
DASHBOARD_DIR="$PROJECT_ROOT/dashboard"

if [ ! -d "$DASHBOARD_DIR/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$DASHBOARD_DIR" && npm install
fi

echo "🚀 Starting Post Scout Dashboard..."
echo "🔗 Open http://localhost:3000 in your browser"

cd "$DASHBOARD_DIR" && node server.js
