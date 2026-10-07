#!/bin/sh
set -e

echo "Starting backoffice on port 3000..."
npm --prefix /app/backoffice run dev -- --hostname 0.0.0.0 --port 3000 &
BACKOFFICE_PID=$!

echo "Starting talent pipeline tracker on port 3001..."
npm --prefix /app/talent-pipeline-tracker run dev -- --hostname 0.0.0.0 --port 3001 &
TRACKER_PID=$!

trap 'kill $BACKOFFICE_PID $TRACKER_PID' INT TERM

wait