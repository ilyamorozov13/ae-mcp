# Adobe After Effects MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Adobe After Effects through a standardized interface.

## Features

- **Project Management**: Create, open, save, and manage After Effects projects
- **Composition Operations**: Create and modify compositions with custom settings
- **Layer Management**: Add and manipulate various layer types (solid, text, shape)
- **Animation**: Set keyframes and create animations programmatically
- **Rendering**: Manage render queue and export compositions
- **Asset Management**: Import and organize footage

## Architecture

The system consists of three main components:

1. **MCP Server (Node.js)**: Handles MCP protocol communication and translates commands
2. **CEP Extension**: Runs inside After Effects to execute ExtendScript commands
3. **ExtendScript Bridge**: Executes commands within the After Effects context

## Installation

### Prerequisites

- Adobe After Effects CC 2020 or newer
- Node.js 18+
- CEP debugging enabled in After Effects

### Setup Steps

1. **Install the MCP Server**:
   ```bash
   npm install
   npm run build
   ```

2. **Install the CEP Extension**:
   - Copy the `ae-extension` folder to your After Effects extensions directory:
     - Windows: `%APPDATA%/Adobe/CEP/extensions/`
     - macOS: `~/Library/Application Support/Adobe/CEP/extensions/`

3. **Enable Script Access in After Effects**:
   - Go to Preferences > Scripting & Expressions
   - Enable "Allow Scripts to Write Files and Access Network"

4. **Enable CEP Debug Mode** (for development):
   - Windows: Create registry key `HKEY_CURRENT_USER\Software\Adobe\CSXS.9\PlayerDebugMode` = "1"
   - macOS: Run `defaults write com.adobe.CSXS.9 PlayerDebugMode 1`

## Usage

### Standard MCP Client (Claude Desktop, Cline, etc.)

1. **Configure your MCP client** using the configuration in `MCP_CONFIGURATION.md`
2. **Open After Effects** and find the "AE MCP Bridge" panel in Window > Extensions
3. **Connect the Extension** to localhost:8080 using the panel interface
4. **Start using** natural language commands in your MCP client

### Standalone HTTP Server (for testing)

1. **Start the HTTP server**:
   ```bash
   npm run server
   ```
2. **Connect After Effects** as described above
3. **Send JSON-RPC requests** to `http://localhost:3000/jsonrpc`

## Available Tools

### Project Management
- `create_project`: Create a new After Effects project
- `open_project`: Open an existing project file
- `save_project`: Save the current project
- `get_project_info`: Get information about the current project

### Composition Operations
- `create_composition`: Create a new composition
- `modify_composition`: Modify composition properties
- `list_compositions`: List all compositions in the project

### Layer Management
- `add_solid_layer`: Add a solid color layer
- `add_text_layer`: Add a text layer
- `modify_layer_properties`: Modify layer transform properties
- `set_keyframe`: Set keyframes for animation

### Rendering
- `add_to_render_queue`: Add a composition to the render queue
- `start_render`: Start rendering the queue
- `get_render_queue`: Get render queue status

## Development

### Building
```bash
npm run build
```

### Running in Development Mode
```bash
npm run dev
```

### Project Structure
```
ae-mcp/
├── src/                    # MCP server source code
│   ├── server/            # Server implementation
│   ├── ae-integration/    # After Effects communication
│   └── types/             # TypeScript definitions
├── ae-extension/          # CEP extension for After Effects
│   ├── CSXS/             # Extension manifest
│   └── js/               # Extension JavaScript
└── dist/                  # Compiled output
```

## Troubleshooting

### Connection Issues
- Ensure After Effects has network access enabled
- Check that the CEP extension is properly installed
- Verify the MCP server is running on the correct port

### Script Execution Errors
- Enable "Allow Scripts to Write Files and Access Network" in AE preferences
- Check the After Effects version compatibility
- Review the activity log in the CEP panel

## License

MIT