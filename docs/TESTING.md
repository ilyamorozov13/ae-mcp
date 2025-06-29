# Testing Guide for After Effects MCP

## Overview
There are two types of tests for the After Effects MCP system:

1. **Node.js Unit Tests** - Test the MCP server code
2. **After Effects Integration Tests** - Test actual ExtendScript execution

## Node.js Unit Tests

These tests validate the MCP server's parameter validation, script generation, and ES3 compatibility.

### Running the Tests
```bash
# From the project root
./test-commands.sh

# Or directly with Node.js
node dist/tests/ae-commands.test.js
```

**Important**: These tests run in Node.js, NOT in After Effects. They test:
- Parameter validation
- ES3 script generation compliance
- Error handling
- Command coverage

## After Effects Integration Tests

To test actual command execution in After Effects:

### Method 1: Using MCP Commands
```bash
# Test individual commands through MCP
mcp create_composition --name "Test Comp"
mcp add_solid_layer --compId 1
mcp set_keyframe --compId 1 --layerIndex 1 --property Position --time 0 --value [100,100]
mcp apply_easy_ease --compId 1 --layerIndex 1 --propertyPath "Transform.Position"
```

### Method 2: Direct ExtendScript Testing
Use the provided test script:
1. Open After Effects
2. Open a project with at least one composition
3. File > Scripts > Run Script File...
4. Select `test-in-ae.jsx`

This script will:
- Verify project and composition state
- Test layer access
- Test KeyframeEase creation
- Show alerts with test results

### Method 3: Batch Testing
Test multiple commands at once:
```javascript
// Save this as batch-test.json
{
  "commands": [
    {
      "tool": "create_composition",
      "params": { "name": "Test Comp", "width": 1920, "height": 1080 }
    },
    {
      "tool": "add_solid_layer",
      "params": { "compId": 1, "name": "Background", "color": [0, 0, 0] }
    },
    {
      "tool": "set_keyframe",
      "params": { "compId": 1, "layerIndex": 1, "property": "Position", "time": 0, "value": [960, 540] }
    },
    {
      "tool": "set_keyframe",
      "params": { "compId": 1, "layerIndex": 1, "property": "Position", "time": 1, "value": [100, 100] }
    },
    {
      "tool": "apply_easy_ease",
      "params": { "compId": 1, "layerIndex": 1, "propertyPath": "Transform.Position" }
    }
  ]
}
```

Then run:
```bash
mcp batch_execute --commands "$(cat batch-test.json | jq -c .commands)"
```

## Common Issues

### "Illegal use of reserved word" Error
This error occurs when trying to run Node.js test files in After Effects. Remember:
- `ae-commands.test.js` is for Node.js only
- Use `test-in-ae.jsx` for After Effects testing

### "SyntaxError: Expected: )"
This indicates a syntax error in generated ExtendScript. Check:
- Proper escaping of special characters
- Balanced parentheses and brackets
- ES3 compatibility (no template literals, arrow functions, etc.)

### "Property has no keyframes"
Ensure you've set keyframes before applying easing:
1. First: `set_keyframe` at time 0
2. Then: `set_keyframe` at time 1
3. Finally: `apply_easy_ease`

## Debugging Tips

1. **Enable verbose logging**:
   ```bash
   export AE_MCP_LOG_LEVEL=debug
   ```

2. **Check generated scripts**:
   Look in the temp directory for `.jsx` files to see the actual ExtendScript being executed

3. **Use execute_script for custom tests**:
   ```bash
   mcp execute_script --script "alert('Test: ' + app.version);"
   ```

## Test Coverage

The test suite covers:
- ✅ Parameter validation for all commands
- ✅ ES3 compatibility checking
- ✅ Error message formatting
- ✅ Batch command execution
- ✅ Common edge cases

Run the full test suite before making changes to ensure nothing breaks.