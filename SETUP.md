# AE MCP Server - Simple Setup Guide

This guide will help you set up the AE MCP Server in 5 minutes.

## Prerequisites

- Adobe After Effects 2022 or later
- Node.js installed
- macOS or Windows

## Step 1: Build the Server

```bash
cd ae-mcp
npm install
npm run build
```

## Step 2: Install CEP Extension

### macOS:
```bash
cd cep-extension
./install.sh
```

### Windows:
1. Copy the `cep-extension` folder to:
   `C:\Users\[YourName]\AppData\Roaming\Adobe\CEP\extensions\`
2. Rename it to `com.aemcp.bridge`

## Step 3: Enable Debug Mode (First Time Only)

### macOS:
```bash
cd cep-extension
./enable-debug-mode.sh
```

### Windows:
Run `enable-debug-mode.bat` as administrator

## Step 4: Configure After Effects

1. Open After Effects
2. Go to Preferences > Scripting & Expressions
3. Check "Allow Scripts to Write Files and Access Network"
4. Restart After Effects

## Step 5: Load the Extension

1. In After Effects: Window > Extensions > AE MCP Bridge
2. You should see the panel open
3. Make sure "Auto Process: ON" is enabled

## Step 6: Configure Your AI Assistant

### For Claude Desktop:

1. Open: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add this configuration:

```json
{
  "mcpServers": {
    "ae-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/ae-mcp/dist/stdio-server.js"],
      "env": {
        "AE_USE_FILE_BRIDGE": "true"
      }
    }
  }
}
```

3. Restart Claude Desktop

## Step 7: Test It!

In Claude, try:
- "Create a new After Effects project"
- "Create a 1080p composition called 'Test'"
- "Add a red solid layer"

## Troubleshooting

### Extension doesn't appear in menu?
- Make sure debug mode is enabled
- Restart After Effects
- Check the extension was copied to the right folder

### Commands not working?
- Check "Auto Process: ON" in the extension
- Look at the activity log in the extension panel
- Ensure After Effects has a project open

### Still having issues?
- Check `~/Documents/ae-mcp-commands/` for command files
- Look for `.response` files to see if commands are processing
- Check the extension's activity log for errors

## That's it!

You're now ready to control After Effects with AI. The system will:
1. Receive commands from your AI assistant
2. Write them to `~/Documents/ae-mcp-commands/`
3. Process them in After Effects
4. Return the results

Happy creating! 🎬