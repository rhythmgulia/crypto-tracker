#!/bin/bash

# Script to keep the backend server running
# Restarts automatically if it crashes

cd "$(dirname "$0")/backend"

echo "🚀 Starting backend server (will auto-restart if it crashes)..."
echo "Press Ctrl+C to stop"

while true; do
  echo "$(date): Starting server..."
  npm start
  
  # If we get here, the server crashed
  echo "$(date): Server stopped. Restarting in 3 seconds..."
  sleep 3
done

