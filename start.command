#!/bin/bash
cd "$(dirname "$0")"
echo "=========================================="
echo "🎟️ Starting EventSphere Full-Stack Application"
echo "=========================================="
echo "Backend:  http://localhost:5001"
echo "Frontend: http://localhost:5173"
echo "------------------------------------------"
npm run dev &
DEV_PID=$!
sleep 2
open "http://localhost:5173"
wait $DEV_PID
