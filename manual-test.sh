#!/bin/bash

echo "=== Manual File Bridge Test ==="
echo

COMMANDS_DIR="/private/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands"

echo "1. Creating test command file..."
cat > "$COMMANDS_DIR/test_manual.json" << EOF
{
  "id": "test_manual_123",
  "script": "(function() { return { success: true, data: { message: 'Hello from After Effects!', version: app.version } }; })();"
}
EOF

echo "Created: $COMMANDS_DIR/test_manual.json"
echo

echo "2. Waiting for response (5 seconds)..."
sleep 5

echo "3. Checking for response file..."
if [ -f "$COMMANDS_DIR/test_manual.json.response" ]; then
    echo "✅ Response file found!"
    echo "Contents:"
    cat "$COMMANDS_DIR/test_manual.json.response"
    rm "$COMMANDS_DIR/test_manual.json.response"
else
    echo "❌ No response file found"
    echo
    echo "4. Checking if command file still exists..."
    if [ -f "$COMMANDS_DIR/test_manual.json" ]; then
        echo "Command file still exists (not processed)"
        rm "$COMMANDS_DIR/test_manual.json"
    else
        echo "Command file was deleted (might have been processed)"
    fi
fi

echo
echo "5. Listing all files in commands directory:"
ls -la "$COMMANDS_DIR/"