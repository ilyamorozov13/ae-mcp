export const layerTools = [
  {
    name: "add_solid_layer",
    description: "Add a solid color layer to a composition. Note: New layers are added on TOP (Layer 1). For backgrounds, create them last or use reorder_layers.",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        name: { 
          type: "string", 
          default: "Solid",
          description: "Name of the layer" 
        },
        color: {
          type: "array",
          items: { type: "number" },
          minItems: 3,
          maxItems: 3,
          default: [1, 1, 1],
          description: "RGB color values (0-1)"
        },
        width: { 
          type: "number", 
          description: "Width in pixels (defaults to comp width)" 
        },
        height: { 
          type: "number", 
          description: "Height in pixels (defaults to comp height)" 
        }
      },
      required: ["compId"]
    }
  },
  
  {
    name: "add_text_layer",
    description: "Add a text layer to a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        text: { 
          type: "string", 
          description: "Text content" 
        },
        name: { 
          type: "string", 
          description: "Name of the layer" 
        }
      },
      required: ["compId", "text"]
    }
  },
  
  {
    name: "add_shape_layer",
    description: "Add a shape layer to a composition with customizable properties",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        name: { 
          type: "string", 
          default: "Shape Layer",
          description: "Name of the layer" 
        },
        shapeType: { 
          type: "string", 
          enum: ["rectangle", "ellipse", "polygon", "star", "custom"],
          default: "rectangle",
          description: "Type of shape to create" 
        },
        properties: {
          type: "object",
          description: "Shape properties",
          properties: {
            size: {
              type: "array",
              items: { type: "number" },
              minItems: 2,
              maxItems: 2,
              default: [100, 100],
              description: "Size [width, height] for rectangle/ellipse"
            },
            fillColor: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 4,
              default: [1, 0, 0],
              description: "Fill color [R, G, B] or [R, G, B, A] (0-1)"
            },
            strokeColor: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 4,
              description: "Stroke color [R, G, B] or [R, G, B, A] (0-1)"
            },
            strokeWidth: {
              type: "number",
              default: 0,
              description: "Stroke width in pixels"
            },
            points: {
              type: "number",
              default: 5,
              minimum: 3,
              maximum: 100,
              description: "Number of points for polygon/star"
            },
            innerRadius: {
              type: "number",
              default: 50,
              description: "Inner radius for star shapes"
            },
            outerRadius: {
              type: "number",
              default: 100,
              description: "Outer radius for polygon/star shapes"
            },
            cornerRadius: {
              type: "number",
              default: 0,
              description: "Corner radius for rounded rectangles"
            },
            position: {
              type: "array",
              items: { type: "number" },
              minItems: 2,
              maxItems: 3,
              description: "Initial position [x, y] or [x, y, z]"
            },
            scale: {
              type: "array",
              items: { type: "number" },
              minItems: 2,
              maxItems: 3,
              default: [100, 100],
              description: "Initial scale [x, y] or [x, y, z] as percentages"
            },
            rotation: {
              type: "number",
              default: 0,
              description: "Initial rotation in degrees"
            },
            opacity: {
              type: "number",
              minimum: 0,
              maximum: 100,
              default: 100,
              description: "Initial opacity (0-100)"
            }
          }
        }
      },
      required: ["compId"]
    }
  },
  
  {
    name: "modify_layer_properties",
    description: "Modify transform properties of a layer",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer (1-based)" 
        },
        properties: {
          type: "object",
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
      required: ["compId", "layerIndex", "properties"]
    }
  },
  
  {
    name: "duplicate_layer",
    description: "Duplicate a layer within a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer to duplicate" 
        }
      },
      required: ["compId", "layerIndex"]
    }
  },
  
  {
    name: "delete_layer",
    description: "Delete a layer from a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer to delete" 
        }
      },
      required: ["compId", "layerIndex"]
    }
  },
  
  {
    name: "reorder_layers",
    description: "Change the order of layers in a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Current index of the layer to move" 
        },
        newIndex: { 
          type: "number", 
          description: "New index position for the layer" 
        }
      },
      required: ["compId", "layerIndex", "newIndex"]
    }
  },
  
  {
    name: "set_keyframe",
    description: "Set a keyframe for a layer property",
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
          description: "Value for the keyframe (number or array depending on property)" 
        }
      },
      required: ["compId", "layerIndex", "property", "time", "value"]
    }
  },
  
  {
    name: "apply_effect",
    description: "Apply an effect to a layer",
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
        effectName: { 
          type: "string", 
          description: "Name of the effect to apply (e.g., 'Gaussian Blur', 'Color Correction')" 
        }
      },
      required: ["compId", "layerIndex", "effectName"]
    }
  }
];