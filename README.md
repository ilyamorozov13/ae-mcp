# AE MCP Server - Adobe After Effects Model Context Protocol Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Adobe After Effects through a file-based communication bridge.

## Background

<<<<<<< HEAD
- I signed up for https://schoolofmotion.com/ again on my vacation. And started to go through Joey's very first lesson (Desk Unmessed) to take an inventory of where I'm at. I animated one item, and then got to thinking... it'd be nice to use MCP here and connect Amazon Q or Claude Code and "repeat the animation" for the other shapes I just did.
=======
- I signed up for https://schoolofmotion.com/ again on my vacation. And started to go through Joey's very first lesson for Animation Bootcamp (Desk Unmessed) to take an inventory of where I'm at. I animated one item, and then got to thinking... it'd be nice to use MCP here and connect Amazon Q or Claude Code and "repeat the animation" for the other shapes I just did.
>>>>>>> d24fd1d (docs: add project background and origin story)
- I explored what was out there and mostly found: https://github.com/Dakkshin/after-effects-mcp. But it was originally focused on Windows. I was able to use Claude Code to get it to run on macOS but I couldn't get  it to take commands.
- So I used Claude Code to create a BRD and design doc (pretty basic 1-2 sentence prompt: "Can you plan out how you’d create an MCP server for Adobe after effects? Maybe create a requirements doc and then technical design doc with instructions on how to implement?"). Then I copied the markdown files into a new folder and prompted to create an app. I asked why not "rust" but Adobe CEP is more JavaScript oriented so it made sense to stick with TypeScript. Original prompts were focused around just doing a script because CEP didn't work at first. So again I went back to Claude Desktop (Opus) and prompted with "Can we research how to create CEP plugins for adobe after effects? Currently not able to get them to load - maybe not signed? Can we create detailed steps on how to get this to work for running locally with Adobe After Effects 2025?". And used that markdown file as input to help with creating a more robust system.
- That worked, was able to finally load a CEP plugin. Btw earlier when I had to run a script I could not get sockets to work so Claude synthesized a file-based way to communicate. That seemed more reliable. So when switching over to CEP we went with that. There was a lot of copying of errors and prompting for guidance but fairly minimal human-based engineering. Mostly guidance. I used Amazon Q to power the client using just this in ~/.aws/amazonq/mcp.json:
```
    "ae-mcp": {
      "command": "node",
      "args": ["<path to>/ae-mcp/dist/stdio-server.js"],
      "env": {
        "AE_USE_FILE_BRIDGE": "true"
      }
    }
```
- And it worked. My wife thinks I should try to sell this (did interrupt one vacation day to be fair). Maybe in the future.
- You can use tail `ae-mcp-server.log` to check for logs. Haven't explored what it can do too much - maybe this weekend more...

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

### Expression Tools
- `set_expression` - Set an expression on a layer property (NOT add_expression)
- `get_expression` - Get the expression from a layer property
- `remove_expression` - Remove an expression from a property
- `enable_expression` - Enable or disable an expression
- `batch_set_expressions` - Set multiple expressions at once
- `add_wiggle_expression` - Add a wiggle expression to a property
- `add_loop_expression` - Add a loop expression to a property
- `link_properties_with_expression` - Link two properties together
- `add_expression_control` - Add expression control effects (slider, checkbox, etc.)

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

### Additional Guides
- [Expression Tools Guide](EXPRESSIONS.md) - Comprehensive guide for using expressions (IMPORTANT: use `set_expression`, not `add_expression`)
- [Layer Ordering Guide](LAYER_ORDERING.md) - Understanding After Effects layer stacking

## License

MIT License - see LICENSE file for details
