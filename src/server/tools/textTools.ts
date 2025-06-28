export const textTools = [
  {
    name: "add_text_layer_advanced",
    description: "Add a text layer with advanced formatting options",
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
        },
        sourceText: {
          type: "object",
          description: "Text document properties",
          properties: {
            font: {
              type: "string",
              description: "Font name (e.g., 'Arial', 'Helvetica')"
            },
            fontSize: {
              type: "number",
              default: 50,
              description: "Font size in pixels"
            },
            fillColor: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 3,
              default: [1, 1, 1],
              description: "Text color [R, G, B] (0-1)"
            },
            strokeColor: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 3,
              description: "Stroke color [R, G, B] (0-1)"
            },
            strokeWidth: {
              type: "number",
              default: 0,
              description: "Stroke width in pixels"
            },
            strokeOverFill: {
              type: "boolean",
              default: false,
              description: "Whether stroke appears over fill"
            },
            justification: {
              type: "string",
              enum: ["left", "center", "right", "justifyLeft", "justifyCenter", "justifyRight", "justifyAll"],
              default: "left",
              description: "Text justification"
            },
            tracking: {
              type: "number",
              default: 0,
              description: "Letter spacing (tracking)"
            },
            leading: {
              type: "number",
              description: "Line spacing (leading)"
            },
            baselineShift: {
              type: "number",
              default: 0,
              description: "Baseline shift"
            },
            verticalScale: {
              type: "number",
              default: 100,
              description: "Vertical scale percentage"
            },
            horizontalScale: {
              type: "number",
              default: 100,
              description: "Horizontal scale percentage"
            },
            smallCaps: {
              type: "boolean",
              default: false,
              description: "Enable small caps"
            },
            allCaps: {
              type: "boolean",
              default: false,
              description: "Enable all caps"
            }
          }
        },
        position: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 3,
          description: "Initial position [x, y] or [x, y, z]"
        },
        anchor: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 3,
          description: "Anchor point [x, y] or [x, y, z]"
        }
      },
      required: ["compId", "text"]
    }
  },

  {
    name: "modify_text_properties",
    description: "Modify text formatting properties",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the text layer" 
        },
        properties: {
          type: "object",
          description: "Text properties to modify",
          properties: {
            text: { type: "string", description: "New text content" },
            font: { type: "string", description: "Font name" },
            fontSize: { type: "number", description: "Font size in pixels" },
            fillColor: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 3,
              description: "Text color [R, G, B] (0-1)"
            },
            strokeColor: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 3,
              description: "Stroke color [R, G, B] (0-1)"
            },
            strokeWidth: { type: "number", description: "Stroke width in pixels" },
            strokeOverFill: { type: "boolean", description: "Whether stroke appears over fill" },
            justification: {
              type: "string",
              enum: ["left", "center", "right", "justifyLeft", "justifyCenter", "justifyRight", "justifyAll"],
              description: "Text justification"
            },
            tracking: { type: "number", description: "Letter spacing" },
            leading: { type: "number", description: "Line spacing" },
            baselineShift: { type: "number", description: "Baseline shift" },
            verticalScale: { type: "number", description: "Vertical scale percentage" },
            horizontalScale: { type: "number", description: "Horizontal scale percentage" },
            applyFill: { type: "boolean", description: "Enable/disable fill" },
            applyStroke: { type: "boolean", description: "Enable/disable stroke" }
          }
        }
      },
      required: ["compId", "layerIndex", "properties"]
    }
  },

  {
    name: "add_text_animator",
    description: "Add a text animator to animate individual characters",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the text layer" 
        },
        animatorName: {
          type: "string",
          default: "Animator",
          description: "Name for the animator"
        },
        properties: {
          type: "array",
          items: {
            type: "string",
            enum: ["position", "scale", "rotation", "opacity", "anchorPoint", "fillColor", "strokeColor", "strokeWidth", "tracking", "lineAnchor", "blur"]
          },
          description: "Properties to add to the animator"
        },
        selector: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["range", "wiggly", "expression"],
              default: "range",
              description: "Type of selector"
            },
            start: {
              type: "number",
              default: 0,
              description: "Start percentage (0-100)"
            },
            end: {
              type: "number",
              default: 100,
              description: "End percentage (0-100)"
            },
            offset: {
              type: "number",
              default: 0,
              description: "Offset percentage"
            },
            basedOn: {
              type: "string",
              enum: ["characters", "charactersExcludingSpaces", "words", "lines"],
              default: "characters",
              description: "What to base the selection on"
            }
          }
        }
      },
      required: ["compId", "layerIndex", "properties"]
    }
  },

  {
    name: "convert_text_to_shape",
    description: "Convert text layer to shape layer (create outlines)",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the text layer" 
        },
        keepOriginal: {
          type: "boolean",
          default: false,
          description: "Keep the original text layer"
        }
      },
      required: ["compId", "layerIndex"]
    }
  },

  {
    name: "create_text_on_path",
    description: "Create text that follows a path",
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
        path: {
          type: "object",
          properties: {
            vertices: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Path vertices [[x,y], [x,y], ...]"
            },
            inTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "In tangents for bezier curves"
            },
            outTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Out tangents for bezier curves"
            },
            closed: {
              type: "boolean",
              default: false,
              description: "Whether the path is closed"
            }
          },
          required: ["vertices"]
        },
        textProperties: {
          type: "object",
          description: "Text formatting properties (same as add_text_layer_advanced sourceText)"
        }
      },
      required: ["compId", "text", "path"]
    }
  }
];