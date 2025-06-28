# AE MCP Troubleshooting Guide

## Command Timeout Errors

If you're experiencing timeout errors like:
```
Command timeout for create_project: 
{
  "commandFile": "/Users/.../ae-mcp-commands/create_project_xxx.json",
  "responseFile": "/Users/.../ae-mcp-commands/create_project_xxx.json.response",
  "fileExists": true,
  "processedExists": false,
  "responseExists": false
}
```

### Diagnosis

The timeout indicates that the CEP extension in After Effects is not processing command files. This happens when:

1. The CEP extension is not installed
2. The extension is installed but not running
3. Auto-processing is disabled in the extension
4. File permissions prevent reading/writing command files

### Solution

#### 1. Verify CEP Extension Installation

Check if the extension is installed:
```bash
# macOS
ls ~/Library/Application\ Support/Adobe/CEP/extensions/ae-mcp-bridge

# Windows
dir %APPDATA%\Adobe\CEP\extensions\ae-mcp-bridge
```

If not installed, follow the installation steps in `cep-extension/README.md`.

#### 2. Enable CEP Debug Mode

For After Effects to load unsigned extensions:

**macOS:**
```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

**Windows:**
Create registry key:
```
HKEY_CURRENT_USER\Software\Adobe\CSXS.11
Name: PlayerDebugMode
Type: String
Value: 1
```

#### 3. Open the Extension in After Effects

1. Launch After Effects
2. Go to Window → Extensions → AE MCP Bridge
3. The panel should show:
   - Status: Ready (green indicator)
   - Auto Process: ON

#### 4. Test Connectivity

Use the ping command to test if the extension is working:

```bash
# In your MCP client, run:
mcp ping
```

This should return:
```json
{
  "message": "Pong! CEP extension is active and processing commands.",
  "timestamp": "2024-01-28T...",
  "aeVersion": "24.0",
  "buildNumber": "..."
}
```

#### 5. Check Command Files Directory

Ensure the directory exists and has proper permissions:
```bash
ls -la ~/Documents/ae-mcp-commands/
```

The extension needs read/write access to this directory.

### Alternative: Socket-Based Communication

If file-based communication continues to fail, you can switch to socket mode:

```bash
# Set environment variable before starting the server
export AE_USE_FILE_BRIDGE=false
npm start
```

Note: Socket mode requires a different bridge setup (not the CEP extension).

## Error Display in CEP Extension

### Recent Changes

The CEP extension now shows errors more prominently:

1. **Recent Errors Section**: A red-bordered section displays the last 5 errors
2. **Extended Error Display**: Error status remains visible for 5 seconds
3. **Detailed Error Messages**: Full error details shown in status bar
4. **Persistent Error Log**: Errors remain in the command log

### Debugging CEP Extension

1. **Enable Chrome DevTools**:
   - Navigate to http://localhost:9999 while After Effects is running
   - Select the AE MCP Bridge extension
   - Check the console for JavaScript errors

2. **Check ExtendScript Logs**:
   - Errors from ExtendScript execution appear in the command log
   - Look for entries marked "ERROR in [filename]"

## Common Issues

### "Method not found: notifications/initialized"

This has been fixed in the latest version. The server now handles both:
- `initialized` (standard method)
- `notifications/initialized` (notification format)

### Missing Response Files

This typically indicates:
1. The ExtendScript failed to execute
2. File write permissions issue
3. Race condition between file operations

The latest version includes:
- Retry logic for reading response files
- Better handling of `.processed` files
- Improved error response writing

### Performance Issues

If commands are slow:
1. Check the CEP extension's processing interval (default: 500ms)
2. Reduce the number of files in the commands directory
3. Use batch operations for multiple commands

## Getting Help

1. Check the server log: `ae-mcp-server.log`
2. Check the CEP extension console: http://localhost:9999
3. Report issues: https://github.com/[your-repo]/issues