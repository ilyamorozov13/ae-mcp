export const expressionTools = [
  {
    name: "set_expression",
    description: "Set an expression on a layer property",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path (e.g., 'Transform.Position', 'Transform.Scale', 'Effects.Gaussian Blur.Blurriness')" 
        },
        expression: { 
          type: "string", 
          description: "The expression code to set" 
        },
        enabled: {
          type: "boolean",
          default: true,
          description: "Whether the expression should be enabled"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "expression"]
    }
  },

  {
    name: "get_expression",
    description: "Get the expression from a layer property",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path (e.g., 'Transform.Position', 'Transform.Scale')" 
        }
      },
      required: ["compId", "layerIndex", "propertyPath"]
    }
  },

  {
    name: "remove_expression",
    description: "Remove an expression from a layer property",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path" 
        }
      },
      required: ["compId", "layerIndex", "propertyPath"]
    }
  },

  {
    name: "enable_expression",
    description: "Enable or disable an expression on a property",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path" 
        },
        enabled: {
          type: "boolean",
          description: "Whether to enable or disable the expression"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "enabled"]
    }
  },

  {
    name: "batch_set_expressions",
    description: "Set multiple expressions at once for better performance",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        expressions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              layerIndex: { 
                type: "number", 
                description: "Index of the layer" 
              },
              propertyPath: { 
                type: "string", 
                description: "Property path" 
              },
              expression: { 
                type: "string", 
                description: "The expression code" 
              },
              enabled: {
                type: "boolean",
                default: true,
                description: "Whether the expression should be enabled"
              }
            },
            required: ["layerIndex", "propertyPath", "expression"]
          },
          description: "Array of expression configurations"
        }
      },
      required: ["compId", "expressions"]
    }
  },

  {
    name: "convert_keyframes_to_expression",
    description: "Convert keyframed animation to an expression",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path" 
        },
        expressionType: {
          type: "string",
          enum: ["linear", "ease", "bounce", "elastic", "custom"],
          default: "linear",
          description: "Type of expression to generate from keyframes"
        },
        customExpression: {
          type: "string",
          description: "Custom expression template (for custom type)"
        }
      },
      required: ["compId", "layerIndex", "propertyPath"]
    }
  },

  {
    name: "add_expression_control",
    description: "Add an expression control effect to a layer",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        controlType: {
          type: "string",
          enum: ["slider", "point", "angle", "checkbox", "color", "layer", "point3d"],
          description: "Type of expression control"
        },
        name: {
          type: "string",
          description: "Name for the control"
        },
        value: {
          description: "Initial value for the control"
        }
      },
      required: ["compId", "layerIndex", "controlType", "name"]
    }
  },

  {
    name: "link_properties_with_expression",
    description: "Link two properties together using an expression",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        sourceLayer: { 
          type: "number", 
          description: "Index of the source layer" 
        },
        sourceProperty: { 
          type: "string", 
          description: "Source property path" 
        },
        targetLayer: { 
          type: "number", 
          description: "Index of the target layer" 
        },
        targetProperty: { 
          type: "string", 
          description: "Target property path" 
        },
        linkType: {
          type: "string",
          enum: ["direct", "inverse", "offset", "multiply", "custom"],
          default: "direct",
          description: "Type of link between properties"
        },
        offsetValue: {
          description: "Offset value (for offset type)"
        },
        multiplier: {
          type: "number",
          default: 1,
          description: "Multiplier value (for multiply type)"
        },
        customExpression: {
          type: "string",
          description: "Custom expression (for custom type)"
        }
      },
      required: ["compId", "sourceLayer", "sourceProperty", "targetLayer", "targetProperty"]
    }
  },

  {
    name: "add_wiggle_expression",
    description: "Add a wiggle expression to a property",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path" 
        },
        frequency: {
          type: "number",
          default: 5,
          description: "Wiggle frequency (times per second)"
        },
        amplitude: {
          type: "number",
          default: 50,
          description: "Wiggle amplitude"
        },
        octaves: {
          type: "number",
          default: 1,
          description: "Number of octaves of noise"
        },
        ampMultiplier: {
          type: "number",
          default: 0.5,
          description: "Amplitude multiplier for each octave"
        },
        time: {
          type: "number",
          description: "Time offset"
        }
      },
      required: ["compId", "layerIndex", "propertyPath"]
    }
  },

  {
    name: "add_loop_expression",
    description: "Add a loop expression to a property",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path" 
        },
        loopType: {
          type: "string",
          enum: ["cycle", "pingpong", "offset", "continue"],
          default: "cycle",
          description: "Type of loop"
        },
        numKeyframes: {
          type: "number",
          default: 0,
          description: "Number of keyframes to loop (0 for all)"
        }
      },
      required: ["compId", "layerIndex", "propertyPath"]
    }
  },

  {
    name: "execute_script",
    description: "Execute a custom ExtendScript in After Effects. Do not call app.beginUndoGroup, app.endUndoGroup, or unpaired app.beginSuppressDialogs — nested undo groups crash AE on the next user edit.",
    inputSchema: {
      type: "object",
      properties: {
        script: { 
          type: "string", 
          description: "The ExtendScript code to execute" 
        },
        wrapInTransaction: {
          type: "boolean",
          default: false,
          description: "Do not enable. The MCP host already wraps commands in one undo group. Nested undo groups crash After Effects on the next user edit."
        },
        undoGroupName: {
          type: "string",
          default: "Script Execution",
          description: "Name for the undo group"
        }
      },
      required: ["script"]
    }
  },

  {
    name: "save_expression_preset",
    description: "Save an expression as a preset for reuse",
    inputSchema: {
      type: "object",
      properties: {
        name: { 
          type: "string", 
          description: "Name for the preset" 
        },
        category: {
          type: "string",
          default: "Custom",
          description: "Category for organizing presets"
        },
        expression: { 
          type: "string", 
          description: "The expression code" 
        },
        description: {
          type: "string",
          description: "Description of what the expression does"
        },
        parameters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              default: { type: "string" },
              description: { type: "string" }
            }
          },
          description: "Parameters that can be customized in the expression"
        }
      },
      required: ["name", "expression"]
    }
  },

  {
    name: "apply_expression_preset",
    description: "Apply a saved expression preset to a property",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer" 
        },
        propertyPath: { 
          type: "string", 
          description: "Property path" 
        },
        presetName: {
          type: "string",
          description: "Name of the preset to apply"
        },
        parameters: {
          type: "object",
          description: "Parameter values to customize the preset"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "presetName"]
    }
  }
];