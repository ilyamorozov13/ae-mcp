# Example Usage with Claude Desktop

## 1. Configure Claude Desktop

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "adobe-after-effects": {
      "command": "node",
      "args": ["/Users/yourname/ae-mcp/dist/index.js"],
      "env": {
        "MCP_MODE": "stdio",
        "AE_BRIDGE_PORT": "8080"
      }
    }
  }
}
```

## 2. Start After Effects

1. Open Adobe After Effects
2. Go to Window > Extensions > AE MCP Bridge
3. Click "Connect" in the panel (it should connect to localhost:8080)
4. The status should show "Connected"

## 3. Use in Claude Desktop

Now you can use natural language commands like:

### Project Management
- "Create a new After Effects project called 'My Animation'"
- "Save the project to /Users/me/Documents/myproject.aep"
- "Import the video file at /Users/me/Videos/background.mp4"

### Composition Creation
- "Create a new composition called 'Main' that's 1920x1080, 30fps, 10 seconds long"
- "Create a square composition called 'Social Media' that's 1080x1080"

### Layer Operations
- "Add a solid red layer to the current composition"
- "Add text that says 'Hello World' to the composition"
- "Move the layer to position 960, 540"
- "Scale the layer to 150%"
- "Set the opacity to 75%"

### Animation
- "Set a position keyframe at 0 seconds"
- "Move to 2 seconds and set position to 1500, 540"
- "Create a fade in animation from 0 to 1 second"

### Rendering
- "Add the current composition to the render queue"
- "Set output to /Users/me/Renders/output.mp4"
- "Start rendering"

## 4. Check Resources

You can also ask Claude to check the current state:
- "What's in the current After Effects project?"
- "List all compositions"
- "Show me the render queue status"

## Troubleshooting

If commands aren't working:
1. Check the CEP panel in AE shows "Connected"
2. Look at the activity log in the CEP panel
3. Check `ae-mcp-server.log` for errors
4. Restart Claude Desktop after changing the config