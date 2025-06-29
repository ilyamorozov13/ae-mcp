# MCP Client Isolation

The AE MCP server now supports client isolation to ensure that multiple MCP clients can connect simultaneously without interfering with each other's commands and responses.

## How It Works

Each MCP client instance is assigned a unique prefix that is prepended to all command IDs. This ensures that:

1. Commands from different clients are uniquely identified
2. Responses are only processed by the client that sent the original command
3. File-based communication doesn't have conflicts between clients

## Client Prefix Generation

The client prefix is determined in the following order of precedence:

1. **Environment Variable**: Set `MCP_CLIENT_PREFIX` to specify a custom prefix
2. **Client Info**: If the MCP client provides `clientInfo` during initialization, it's used to generate a meaningful prefix
3. **Default**: A unique prefix is generated using process ID and timestamp

### Examples

```bash
# Using environment variable
MCP_CLIENT_PREFIX=vscode_editor node stdio-server.js

# Default behavior (auto-generated)
node stdio-server.js
```

## File-Based Communication

When using file-based communication (`AE_USE_FILE_BRIDGE=true`), the client prefix is especially important:

- Command files are named: `{client_prefix}_{command}_{timestamp}_{random}.json`
- Response files are named: `{client_prefix}_{command}_{timestamp}_{random}.json.response`
- On startup, each client cleans up any leftover files from previous sessions with the same prefix

## Socket-Based Communication

For socket-based communication:

- Command IDs include the client prefix
- The server filters incoming messages to only process those matching the client's prefix
- Messages for other clients are ignored with a debug log

## Implementation Details

### File Communicator
- Filters response files to only process those starting with the client prefix
- Cleans up old files on startup
- Includes prefix in all generated command IDs

### Socket Communicator
- Includes prefix in all generated command IDs
- Filters incoming messages by prefix before processing

## Benefits

1. **Multi-Client Support**: Multiple MCP clients can connect to the same After Effects instance
2. **No Cross-Talk**: Commands and responses are isolated between clients
3. **Clean File Management**: Each client manages its own command/response files
4. **Debugging**: Client prefix in logs makes it easy to trace which client sent which command