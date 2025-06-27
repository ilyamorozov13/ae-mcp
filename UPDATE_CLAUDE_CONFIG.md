# Update Your Claude Desktop Configuration

## Step 1: Open your configuration file

```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## Step 2: Update or add the adobe-after-effects server

Replace or add this exact configuration:

```json
{
  "mcpServers": {
    "adobe-after-effects": {
      "command": "node",
      "args": ["/Users/harathom/workplace/external/ae-mcp/dist/stdio-server.js"],
      "env": {
        "AE_BRIDGE_PORT": "8090",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## Step 3: Save and restart Claude Desktop

1. Save the configuration file
2. Completely quit Claude Desktop (Cmd+Q)
3. Restart Claude Desktop

## Step 4: Verify it's working

1. The server should no longer show as "loading"
2. Check the log file for any errors:
   ```bash
   tail -f /Users/harathom/workplace/external/ae-mcp/ae-mcp-server.log
   ```

## Important Notes

- The server name must be exactly `"adobe-after-effects"` (with hyphen, not underscore)
- The path must be absolute: `/Users/harathom/workplace/external/ae-mcp/dist/stdio-server.js`
- Make sure After Effects is running with the CEP extension connected before using

## Quick Test

Once configured, you can test by asking Claude:
- "List all available After Effects tools"
- "What resources are available in After Effects?"

The server should respond with the list of tools and resources.