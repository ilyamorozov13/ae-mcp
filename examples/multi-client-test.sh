#!/bin/bash

# Example script to test multi-client isolation
# This demonstrates how multiple MCP clients can connect without interference

echo "Starting multi-client test..."

# Start first client with custom prefix
echo "Starting Client 1 (editor)..."
MCP_CLIENT_PREFIX=editor_client AE_USE_FILE_BRIDGE=true node dist/stdio-server.js &
CLIENT1_PID=$!

# Start second client with different prefix  
echo "Starting Client 2 (automation)..."
MCP_CLIENT_PREFIX=automation_client AE_USE_FILE_BRIDGE=true node dist/stdio-server.js &
CLIENT2_PID=$!

echo "Both clients started with PIDs: $CLIENT1_PID and $CLIENT2_PID"
echo ""
echo "You can now connect to each client independently."
echo "Commands from each client will be isolated with their respective prefixes."
echo ""
echo "To stop the clients, run:"
echo "  kill $CLIENT1_PID $CLIENT2_PID"
echo ""
echo "To monitor command files:"
echo "  watch 'ls -la ~/Documents/ae-mcp-commands/'"