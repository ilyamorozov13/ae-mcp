# Claude Desktop Configuration

## Update your configuration file

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add or update the adobe-after-effects server configuration:

```json
{
  "mcpServers": {
    "adobe-after-effects": {
      "command": "node",
      "args": ["/Users/harathom/workplace/external/ae-mcp/dist/stdio-server.js"],
      "env": {
        "AE_BRIDGE_PORT": "8080",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Important Notes

1. **Restart Claude Desktop** after updating the configuration
2. **Check the log file** at `/Users/harathom/workplace/external/ae-mcp/ae-mcp-server.log` for debugging
3. **Ensure After Effects is running** with the CEP extension connected
4. The server name in the config must match exactly: `"adobe-after-effects"`

## Verify the Setup

After restarting Claude Desktop:
1. The server should show as initialized (not "still loading")
2. You should be able to use After Effects commands
3. Check the log file for any connection errors

## Troubleshooting

If still showing as "loading":
- Check the exact path is correct: `/Users/harathom/workplace/external/ae-mcp/dist/stdio-server.js`
- Ensure the file exists and has execute permissions
- Look for errors in: `tail -f /Users/harathom/workplace/external/ae-mcp/ae-mcp-server.log`
- Try running manually to test: `node /Users/harathom/workplace/external/ae-mcp/dist/stdio-server.js`