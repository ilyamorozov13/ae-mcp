# File-Based Bridge Setup (No Port Conflicts!)

Since After Effects has socket issues, we'll use a file-based communication approach that completely avoids port conflicts.

## Step 1: Start the File Bridge in After Effects

1. In After Effects: **File > Scripts > Run Script File**
2. Select: `ae-socket-bridge-file-based.jsx`
3. Click **"Start Bridge"** in the dialog
4. Keep this window open

You should see:
- Status: Running (checking every 500ms)
- Commands folder path displayed
- Activity log showing it's ready

## Step 2: Update Claude Desktop Configuration

```json
{
  "mcpServers": {
    "adobe-after-effects": {
      "command": "node",
      "args": ["/Users/harathom/workplace/external/ae-mcp/dist/stdio-server-hybrid.js"],
      "env": {
        "AE_USE_FILE_BRIDGE": "true",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Note the key difference: `"AE_USE_FILE_BRIDGE": "true"` tells the server to use file-based communication instead of sockets.

## Step 3: Restart Claude Desktop

1. Completely quit Claude Desktop (Cmd+Q)
2. Restart Claude Desktop
3. The server should now initialize without any port issues

## How It Works

Instead of using network sockets (which get stuck in AE), this approach:

1. **MCP Server** writes command files to a temporary folder
2. **AE Bridge** watches that folder for new commands
3. **AE Bridge** executes the commands and writes response files
4. **MCP Server** reads the responses and continues

## Benefits

- ✅ **No port conflicts** - doesn't use network at all
- ✅ **Works around AE bugs** - avoids the socket issues
- ✅ **Just as fast** - checks every 500ms
- ✅ **More reliable** - files don't get "stuck" like sockets

## Monitoring

In the AE File Bridge window, you'll see:
- 📥 Command received notifications
- 📤 Response sent confirmations
- ✅ Successful operations
- ❌ Any errors

## Troubleshooting

If commands aren't working:
1. Check the bridge shows "Status: Running"
2. Click "Open Commands Folder" to see the temp directory
3. Check the log for any errors
4. Try "Clear Old Files" if there are leftover files

## Testing

Once everything is set up, test in Claude:
- "What After Effects tools are available?"
- "Create a new composition called Test"
- "List all compositions in the project"

The File Bridge window will show all the activity in real-time!