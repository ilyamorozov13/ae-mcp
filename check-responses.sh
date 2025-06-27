#!/bin/bash

COMMANDS_DIR="$HOME/Documents/ae-mcp-commands"

echo "=== Checking for response files ==="
echo "Directory: $COMMANDS_DIR"
echo

echo "All files:"
ls -la "$COMMANDS_DIR/"

echo
echo "Response files:"
ls -la "$COMMANDS_DIR/"*.response 2>/dev/null || echo "No response files found"

echo
echo "Command files:"
ls -la "$COMMANDS_DIR/"*.json 2>/dev/null | grep -v response || echo "No command files found"

echo
echo "Monitoring directory for changes (press Ctrl+C to stop)..."
fswatch -1 "$COMMANDS_DIR" 2>/dev/null || {
    echo "Using manual monitoring..."
    while true; do
        echo "--- $(date) ---"
        ls -la "$COMMANDS_DIR/"
        sleep 2
    done
}