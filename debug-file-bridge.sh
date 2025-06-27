#!/bin/bash

echo "=== Debugging File Bridge ==="
echo

COMMANDS_DIR="/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands"

echo "1. Checking if commands directory exists:"
if [ -d "$COMMANDS_DIR" ]; then
    echo "✅ Directory exists"
else
    echo "❌ Directory does not exist"
    echo "Creating it..."
    mkdir -p "$COMMANDS_DIR"
fi

echo
echo "2. Listing contents of commands directory:"
ls -la "$COMMANDS_DIR"

echo
echo "3. Watching for new files (press Ctrl+C to stop):"
echo "Try using a command in Claude while this is running..."
echo

# Watch for changes
fswatch -1 "$COMMANDS_DIR" 2>/dev/null || {
    echo "Using ls polling instead..."
    while true; do
        if ls "$COMMANDS_DIR"/*.json 2>/dev/null | grep -v response; then
            echo "Found command file!"
            ls -la "$COMMANDS_DIR"/*.json | grep -v response
        fi
        sleep 1
    done
}