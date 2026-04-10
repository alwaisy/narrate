#!/bin/bash

# LinkedIn Post Manager Dashboard Launcher
# Boots the Node.js server and provides the local URL.

PROJECT_ROOT=$(pwd)
DASHBOARD_DIR="$PROJECT_ROOT/dashboard"

if [ ! -d "$DASHBOARD_DIR/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$DASHBOARD_DIR" && npm install
fi

# Allow port to be passed as argument, default to 6001
PORT=${1:-6842}

echo "🚀 Starting Post Scout Dashboard..."
echo "🔗 Open http://localhost:$PORT in your browser"

cd "$DASHBOARD_DIR" && PORT=$PORT node server.js
