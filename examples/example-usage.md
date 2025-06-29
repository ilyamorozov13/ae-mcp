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

### Shape Layer Creation
- "Add a blue circle shape layer"
- "Create a rounded rectangle with 20px corner radius, yellow fill, and black stroke"
- "Add a 6-pointed star shape with purple fill and 5px orange stroke"
- "Create a triangle (3-point polygon) with gradient fill"

### Advanced Shape Examples
```javascript
// Create a stylized star with custom properties
{
  "tool": "add_shape_layer",
  "params": {
    "compId": 1,
    "name": "Fancy Star",
    "shapeType": "star",
    "properties": {
      "points": 8,
      "innerRadius": 30,
      "outerRadius": 80,
      "fillColor": [0.2, 0.6, 1.0],  // Light blue
      "strokeColor": [1.0, 0.8, 0.0], // Gold
      "strokeWidth": 3,
      "position": [960, 540],
      "rotation": 22.5,
      "scale": [150, 150]
    }
  }
}

// Create multiple shapes in batch
{
  "tool": "batch_create_layers",
  "params": {
    "compId": 1,
    "layers": [
      {
        "type": "shape",
        "name": "Background Circle",
        "properties": {
          "shapeType": "ellipse",
          "size": [500, 500],
          "fillColor": [0.1, 0.1, 0.1],
          "position": [960, 540],
          "opacity": 50
        }
      },
      {
        "type": "shape",
        "name": "Inner Diamond",
        "properties": {
          "shapeType": "polygon",
          "points": 4,
          "outerRadius": 150,
          "fillColor": [1, 0.5, 0],
          "strokeColor": [1, 1, 1],
          "strokeWidth": 2,
          "position": [960, 540],
          "rotation": 45
        }
      },
      {
        "type": "shape",
        "name": "Accent Star",
        "properties": {
          "shapeType": "star",
          "points": 5,
          "innerRadius": 40,
          "outerRadius": 100,
          "fillColor": [1, 1, 0],
          "position": [960, 540]
        }
      }
    ]
  }
}
```

### Layer Ordering - IMPORTANT!
In After Effects, Layer 1 is on TOP. When creating backgrounds:
- **Create backgrounds LAST** so they appear at the bottom
- Or use `reorder_layers` to move backgrounds to the bottom
- See [LAYER_ORDERING.md](../LAYER_ORDERING.md) for detailed guide

### Batch Modify Layer Properties
- "Move layers 1, 2, and 3 to different positions"
- "Scale multiple layers at once"
- "Apply different rotations to a group of layers"

```javascript
// Example: Arrange shapes in a circle
{
  "tool": "batch_modify_layer_properties",
  "params": {
    "compId": 1,
    "modifications": [
      {
        "layerIndex": 1,
        "properties": {
          "position": [960, 340],
          "rotation": 0
        }
      },
      {
        "layerIndex": 2,
        "properties": {
          "position": [1160, 540],
          "rotation": 90
        }
      },
      {
        "layerIndex": 3,
        "properties": {
          "position": [960, 740],
          "rotation": 180
        }
      },
      {
        "layerIndex": 4,
        "properties": {
          "position": [760, 540],
          "rotation": 270
        }
      }
    ]
  }
}
```

### Animation
- "Set a position keyframe at 0 seconds"
- "Move to 2 seconds and set position to 1500, 540"
- "Create a fade in animation from 0 to 1 second"

### Complete Example: Title Card with Background (Correct Order)

```javascript
// Create a professional title card with proper layer ordering
{
  "tool": "batch_execute",
  "params": {
    "commands": [
      // 1. Create foreground elements FIRST
      {
        "tool": "add_text_layer_advanced",
        "params": {
          "compId": 1,
          "text": "AWESOME PROJECT",
          "name": "Main Title",
          "position": [960, 400],
          "sourceText": {
            "fontSize": 80,
            "font": "Arial",
            "fillColor": [1, 1, 1],
            "justification": "center"
          }
        }
      },
      {
        "tool": "add_text_layer_advanced",
        "params": {
          "compId": 1,
          "text": "Created with AE-MCP",
          "name": "Subtitle",
          "position": [960, 500],
          "sourceText": {
            "fontSize": 30,
            "font": "Arial",
            "fillColor": [0.8, 0.8, 0.8],
            "justification": "center"
          }
        }
      },
      {
        "tool": "add_shape_layer",
        "params": {
          "compId": 1,
          "name": "Divider Line",
          "shapeType": "rectangle",
          "properties": {
            "size": [300, 2],
            "fillColor": [1, 0.8, 0],
            "position": [960, 450]
          }
        }
      },
      // 2. Create background LAST - it will be at the bottom!
      {
        "tool": "add_solid_layer",
        "params": {
          "compId": 1,
          "name": "Background",
          "color": [0.1, 0.1, 0.2],
          "width": 1920,
          "height": 1080
        }
      }
    ]
  }
}
```

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