#!/bin/bash

COMMANDS_DIR="/private/var/folders/90/jdxryyf93cz8548m5q07cc1r0000gq/T/ae-mcp-commands"

echo "Creating test command file..."
cat > "$COMMANDS_DIR/test_debug_$(date +%s).json" << EOF
{
  "id": "test_debug_$(date +%s)",
  "script": "(function() { return { success: true, data: { message: 'Hello from AE!', time: new Date().toString() } }; })();"
}
EOF

echo "File created. Check After Effects debug window and click 'Check Files'"
ls -la "$COMMANDS_DIR/"