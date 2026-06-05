#!/bin/bash
cd /home/z/my-project
rm -rf .next
while true; do
  bun --bun run dev 2>&1
  echo "Server died, restarting in 3s..."
  sleep 3
done
