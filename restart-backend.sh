#!/bin/bash

echo "🛑 Stopping any process on port 5000..."

# Try to kill process on port 5000
PID=$(lsof -ti:5000 2>/dev/null)
if [ ! -z "$PID" ]; then
    echo "Found process $PID on port 5000, killing it..."
    kill -9 $PID 2>/dev/null
    sleep 1
fi

# Verify port is free
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  Port 5000 is still in use. Please manually kill the process:"
    echo "   lsof -ti:5000 | xargs kill -9"
    exit 1
fi

echo "✅ Port 5000 is now free"
echo ""
echo "🚀 Starting backend server..."
cd "$(dirname "$0")/backend"
npm start

