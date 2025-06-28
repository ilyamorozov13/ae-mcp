# AE MCP Server - Adobe After Effects Model Context Protocol Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Adobe After Effects through a file-based communication bridge.

## Overview

This project provides an MCP server that allows AI assistants (like Claude) to control Adobe After Effects by:
- Creating and managing projects
- Creating and modifying compositions
- Managing layers and keyframes
- Rendering compositions
- Batch processing operations

## Architecture

The system uses a file-based communication approach for reliability:

```
AI Assistant <-> MCP Server <-> File System <-> CEP Extension <-> After Effects
```

1. **MCP Server** - Receives commands from AI assistants via the MCP protocol
2. **File Bridge** - Writes commands as JSON files to a watched directory
3. **CEP Extension** - Monitors the directory and executes commands in After Effects
4. **Response System** - Returns results via response files

## Requirements

- Adobe After Effects 2022 or later
- Node.js 16+ and npm
- macOS or Windows

## Quick Start

### 1. Install and Build

```bash
git clone <repository-url>
cd ae-mcp
npm install
npm run build
```

### 2. Install the CEP Extension

```bash
cd cep-extension
./install.sh  # macOS
# or manually copy to CEP extensions folder on Windows
```

### 3. Enable the Extension in After Effects

1. Open After Effects
2. Go to Window > Extensions > AE MCP Bridge
3. Ensure "Auto Process: ON" is enabled

### 4. Configure Your MCP Client

For Claude Desktop, add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ae-mcp": {
      "command": "node",
      "args": ["/path/to/ae-mcp/dist/stdio-server-hybrid.js"],
      "env": {
        "AE_USE_FILE_BRIDGE": "true"
      }
    }
  }
}
```

## Available Tools

### Project Tools
- `create_project` - Create a new After Effects project
- `open_project` - Open an existing project
- `save_project` - Save the current project
- `get_project_info` - Get information about the current project

### Composition Tools
- `create_composition` - Create a new composition with custom settings
- `get_composition` - Get composition details
- `list_compositions` - List all compositions in the project
- `update_composition` - Update composition settings

### Layer Tools
- `create_solid_layer` - Create a solid color layer
- `create_text_layer` - Create a text layer
- `create_adjustment_layer` - Create an adjustment layer
- `create_null_layer` - Create a null object layer
- `create_shape_layer` - Create a shape layer
- `get_layer` - Get layer information
- `list_layers` - List all layers in a composition
- `update_layer_property` - Update layer transform properties
- `add_keyframe` - Add keyframes to animate properties
- `set_layer_parent` - Set layer parenting

### Render Tools
- `add_to_render_queue` - Add composition to render queue
- `start_render` - Start rendering the queue
- `get_render_status` - Check render progress
- `set_render_settings` - Configure render settings

### Batch Tools
- `batch_create_comps` - Create multiple compositions at once
- `batch_import` - Import multiple files
- `batch_replace` - Replace multiple items
- `batch_process` - Process multiple items with a script

## How It Works

### File-Based Communication

The system uses a simple file-based approach for maximum reliability:

1. **Commands Directory**: `~/Documents/ae-mcp-commands/`
2. **Command Format**: JSON files with unique IDs
3. **Response Format**: Matching `.response` files
4. **Auto-Processing**: CEP extension polls every 200ms

### Example Command Flow

1. MCP server receives: "Create a 1080p composition"
2. Writes to: `~/Documents/ae-mcp-commands/cmd_123.json`
   ```json
   {
     "id": "cmd_123",
     "script": "app.project.items.addComp('New Comp', 1920, 1080, 1, 10, 30);"
   }
   ```
3. CEP extension executes the script
4. Writes response: `cmd_123.json.response`
5. MCP server reads response and returns to client

## CEP Extension

The CEP (Common Extensibility Platform) extension runs inside After Effects:

- **Auto Process Mode**: Continuously monitors for new commands
- **Manual Process**: Click to process commands on demand
- **Activity Log**: Shows all processed commands and errors
- **Status Display**: Real-time connection and processing status

### Extension Features

- Command processing with 200ms polling interval
- Automatic error handling and recovery
- Command history and logging
- Visual status indicators
- Manual command folder access

## Troubleshooting

### Extension Not Showing

1. Enable debug mode:
   ```bash
   cd cep-extension
   ./enable-debug-mode.sh
   ```
2. Restart After Effects
3. Check Window > Extensions > AE MCP Bridge

### Commands Not Processing

1. Verify "Auto Process: ON" in the extension panel
2. Check `~/Documents/ae-mcp-commands/` for command files
3. Look for errors in the extension's activity log
4. Ensure After Effects has a project open

### Common Issues

- **"Script access denied"**: Enable "Allow Scripts to Write Files" in AE Preferences
- **Extension won't load**: Run the debug mode enabler and restart
- **Commands timeout**: Check if After Effects is responding

## Development

### Project Structure

```
ae-mcp/
├── src/                    # TypeScript source
│   ├── server/            # MCP server implementation
│   │   └── tools/        # Tool definitions
│   ├── ae-integration/   # After Effects communication
│   └── types/           # Type definitions
├── cep-extension/       # CEP extension
│   ├── CSXS/           # Extension manifest
│   ├── jsx/            # ExtendScript code
│   ├── js/             # Panel JavaScript
│   └── css/            # Panel styles
└── dist/               # Compiled output
```

### Adding New Tools

1. Create tool definition in `src/server/tools/`
2. Implement ExtendScript generation
3. Add to appropriate tool category
4. Build and test

### Testing

```bash
# Run tests
npm test

# Test individual commands
node dist/stdio-server-hybrid.js
```

## Examples

See the `examples/` directory for usage examples.

## License

MIT License - see LICENSE file for details