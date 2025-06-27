# After Effects Setup Guide

You have two options for connecting After Effects to the MCP server:

## Option 1: CEP Extension (Recommended)

### Install the Extension

1. **Run the installer script:**
   ```bash
   cd /Users/harathom/workplace/external/ae-mcp
   ./install-extension.sh
   ```

2. **Restart After Effects**

3. **Open the extension:**
   - Window > Extensions > AE MCP Bridge
   - Click "Connect" in the panel

### Troubleshooting CEP

If the extension doesn't appear:

1. **Run the diagnostic script:**
   - File > Scripts > Run Script File
   - Select `diagnose-cep.jsx`
   - Check the report for issues

2. **Verify script permissions:**
   - Preferences > Scripting & Expressions
   - ✅ "Allow Scripts to Write Files and Access Network"

3. **Check debug console:**
   - Open Chrome/Edge
   - Navigate to `http://localhost:8088/`
   - Look for the extension

## Option 2: ExtendScript Bridge (Simpler)

If CEP doesn't work, use this alternative:

1. **Open After Effects**

2. **Run the socket bridge script:**
   - File > Scripts > Run Script File
   - Select `ae-socket-bridge.jsx`

3. **Start the server:**
   - Click "Start Server" in the dialog
   - Leave the dialog open while using MCP

### Benefits of ExtendScript Bridge:
- No installation required
- Works immediately
- Shows real-time logs
- Easier to debug

### Limitations:
- Must keep dialog window open
- Need to restart manually each session

## Verify Connection

Once connected (either method), the MCP server should be able to communicate with After Effects.

Check the logs:
```bash
tail -f /Users/harathom/workplace/external/ae-mcp/ae-mcp-server.log
```

## Which Method to Use?

- **CEP Extension**: Best for production use, runs in background
- **ExtendScript Bridge**: Best for testing or if CEP has issues

Both methods work with the same MCP server configuration.