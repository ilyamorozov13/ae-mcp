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
    description: "Create multiple layers at once. IMPORTANT: Layers are created in order - first item becomes Layer 1 (top), last item becomes bottom layer. Create backgrounds LAST!",
    inputSchema: {
      type: "object",
      properties: {
        compId: {
          type: "number",
          description: "ID of the composition"
        },
        layers: {
          type: "array",
          description: "Array of layer definitions. Order matters! First = top layer, Last = bottom layer. Put backgrounds at the END of array.",
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
                  text: { type: "string" },
                  // Shape-specific properties
                  shapeType: { type: "string", enum: ["rectangle", "ellipse", "polygon", "star"] },
                  size: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
                  fillColor: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 4 },
                  strokeColor: { type: "array", items: { type: "number" }, minItems: 3, maxItems: 4 },
                  strokeWidth: { type: "number" },
                  points: { type: "number" },
                  innerRadius: { type: "number" },
                  outerRadius: { type: "number" },
                  cornerRadius: { type: "number" }
                }
              }
            },
            required: ["type", "name"]
          }
        }
      },
      required: ["compId", "layers"]
    }
  },

  {
    name: "batch_modify_layer_properties",
    description: "Modify properties of multiple layers at once for better performance",
    inputSchema: {
      type: "object",
      properties: {
        compId: {
          type: "number",
          description: "ID of the composition"
        },
        modifications: {
          type: "array",
          description: "Array of layer modifications",
          items: {
            type: "object",
            properties: {
              layerIndex: {
                type: "number",
                description: "Index of the layer to modify (1-based)"
              },
              properties: {
                type: "object",
                description: "Properties to modify",
                properties: {
                  position: {
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 3,
                    description: "Position [x, y] or [x, y, z]"
                  },
                  scale: {
                    type: "array",
                    items: { type: "number" },
                    minItems: 2,
                    maxItems: 3,
                    description: "Scale [x, y] or [x, y, z] as percentages"
                  },
                  rotation: { 
                    type: "number", 
                    description: "Rotation in degrees" 
                  },
                  opacity: { 
                    type: "number", 
                    minimum: 0,
                    maximum: 100,
                    description: "Opacity (0-100)" 
                  }
                }
              }
            },
            required: ["layerIndex", "properties"]
          }
        }
      },
      required: ["compId", "modifications"]
    }
  }
];