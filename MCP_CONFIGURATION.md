# MCP Configuration Guide

This guide explains how to configure various MCP clients to connect with the Adobe After Effects MCP server.

## Prerequisites

1. Build the server:
   ```bash
   npm install
   npm run build
   ```

2. Ensure Adobe After Effects is running with the CEP extension installed and connected

## Configuration Files

### Claude Desktop App

Add to your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "adobe-after-effects": {
      "command": "node",
      "args": ["/absolute/path/to/ae-mcp/dist/stdio-server.js"],
      "env": {
        "AE_BRIDGE_PORT": "8090",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Cline (VSCode Extension)

Add to your Cline MCP settings:

```json
{
  "adobe-after-effects": {
    "command": "node",
    "args": ["/absolute/path/to/ae-mcp/dist/index.js"],
    "env": {
      "MCP_MODE": "stdio",
      "AE_BRIDGE_PORT": "8090"
    }
  }
}
```

### Generic MCP Client

For other MCP clients, use this configuration format:

```json
{
  "name": "adobe-after-effects",
  "command": "node /absolute/path/to/ae-mcp/dist/index.js",
  "env": {
    "MCP_MODE": "stdio",
    "AE_BRIDGE_PORT": "8090"
  }
}
```

## Environment Variables

- `MCP_MODE`: Set to "stdio" for standard MCP communication
- `AE_BRIDGE_PORT`: Port for After Effects CEP extension (default: 8080)
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

## Connection Flow

1. **MCP Client** launches the server using the configured command
2. **MCP Server** starts and waits for stdio communication
3. **CEP Extension** must be connected in After Effects (port 8090)
4. **Commands** flow: Client → Server → CEP → After Effects

## Troubleshooting

### Server won't start
- Check the absolute path in your configuration
- Ensure the project is built (`npm run build`)
- Check logs in `ae-mcp-server.log`

### Can't connect to After Effects
- Verify the CEP extension is installed and running
- Check the bridge port matches (default: 8090)
- Ensure "Allow Scripts to Write Files and Access Network" is enabled in AE

### Commands fail
- Check After Effects is running with a project open
- Verify the CEP panel shows "Connected" status
- Review error messages in the MCP client

## Example Usage

Once configured, you can use commands like:

```
"Create a new composition called 'Test' that's 1920x1080"
"Add a red solid layer to the current composition"
"Set a position keyframe at 2 seconds"
"Add the composition to the render queue"
```

The server will translate these into After Effects operations.