#!/bin/bash

# Test script for AE MCP commands
echo "Running After Effects MCP Command Tests..."
echo "========================================"

# Compile TypeScript if needed
if command -v tsc &> /dev/null; then
    echo "Compiling TypeScript..."
    tsc --skipLibCheck
fi

# Run the tests
echo ""
echo "Running test suite..."
node dist/tests/ae-commands.test.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
else
    echo ""
    echo "❌ Some tests failed!"
    exit 1
fi