export const batchTools = [
  {
    name: "batch_execute",
    description: "Execute multiple commands in parallel. Commands are sent to After Effects simultaneously for faster processing.",
    inputSchema: {
      type: "object",
      properties: {
        commands: {
          type: "array",
          description: "Array of commands to execute",
          items: {
            type: "object",
            properties: {
              tool: {
                type: "string",
                description: "Tool name to execute"
              },
              params: {
                type: "object",
                description: "Parameters for the tool"
              },
              id: {
                type: "string",
                description: "Optional ID to track this command"
              }
            },
            required: ["tool", "params"]
          }
        },
        sequential: {
          type: "boolean",
          description: "If true, executes commands sequentially instead of in parallel",
          default: false
        }
      },
      required: ["commands"]
    }
  },
  
  {
    name: "batch_keyframes",
    description: "Set multiple keyframes at once for better performance",
    inputSchema: {
      type: "object",
      properties: {
        compId: {
          type: "number",
          description: "ID of the composition"
        },
        keyframes: {
          type: "array",
          description: "Array of keyframe data",
          items: {
            type: "object",
            properties: {
              layerIndex: {
                type: "number",
                description: "Index of the layer"
              },
              property: {
                type: "string",
                enum: ["Position", "Scale", "Rotation", "Opacity"],
                description: "Property to animate"
              },
              time: {
                type: "number",
                description: "Time in seconds"
              },
              value: {
                description: "Value for the keyframe"
              }
            },
            required: ["layerIndex", "property", "time", "value"]
          }
        }
      },
      required: ["compId", "keyframes"]
    }
  },
  
  {
    name: "batch_create_layers",
    description: "Create multiple layers at once",
    inputSchema: {
      type: "object",
      properties: {
        compId: {
          type: "number",
          description: "ID of the composition"
        },
        layers: {
          type: "array",
          description: "Array of layer definitions",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["solid", "text", "shape", "null", "adjustment"],
                description: "Type of layer to create"
              },
              name: {
                type: "string",
                description: "Name for the layer"
              },
              properties: {
                type: "object",
                description: "Initial properties for the layer",
                properties: {
                  position: { type: "array", items: { type: "number" } },
                  scale: { type: "array", items: { type: "number" } },
                  rotation: { type: "number" },
                  opacity: { type: "number" },
                  color: { type: "array", items: { type: "number" } },
                  text: { type: "string" }
                }
              }
            },
            required: ["type", "name"]
          }
        }
      },
      required: ["compId", "layers"]
    }
  }
];