#!/bin/bash

echo "=== Checking Port 8090 Usage ==="
echo

# Check what's using port 8090
echo "Processes using port 8090:"
lsof -i :8090

echo
echo "If nothing appears above, the port should be free."
echo

# Also check port 8080 just in case
echo "Processes using port 8080:"
lsof -i :8080

echo
echo "=== Network listeners ==="
netstat -an | grep -E "8090|8080" | grep LISTEN

echo
echo "=== To kill a process using a port ==="
echo "If you see a process above, you can kill it with:"
echo "kill -9 <PID>"
echo
echo "Or to force kill all processes on port 8090:"
echo "lsof -ti :8090 | xargs kill -9"