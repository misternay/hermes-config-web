#!/bin/bash
# Hermes Config Studio (merged: config editor + provider manager)
# start:  ./start.sh          (build ถ้าจำเป็น + start + เปิดเบราว์เซอร์)
# stop:   ./start.sh stop
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=8765

if [ "$1" = "stop" ]; then
  pkill -f "node server/index.js" 2>/dev/null && echo "stopped" || echo "not running"
  exit 0
fi

if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "already running at http://127.0.0.1:$PORT"
else
  # rebuild frontend if src newer than dist
  if [ ! -f "$DIR/dist/index.html" ] || [ -n "$(find "$DIR/src" -newer "$DIR/dist/index.html" -name '*.jsx' 2>/dev/null | head -1)" ]; then
    echo "building frontend…"
    (cd "$DIR" && npx vite build >/dev/null 2>&1)
  fi
  (cd "$DIR" && PORT=$PORT nohup node server/index.js >> "$DIR/server.log" 2>&1 &)
  for i in $(seq 1 30); do
    sleep 0.5
    curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break
  done
fi
echo "→ http://127.0.0.1:$PORT"
open "http://127.0.0.1:$PORT"
