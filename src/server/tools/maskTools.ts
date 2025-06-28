export const maskTools = [
  {
    name: "add_mask",
    description: "Add a mask to a layer",
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
        name: {
          type: "string",
          default: "Mask",
          description: "Name for the mask"
        },
        maskShape: {
          type: "object",
          description: "Initial mask shape",
          properties: {
            vertices: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] vertex positions"
            },
            inTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] in tangent positions"
            },
            outTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] out tangent positions"
            },
            closed: {
              type: "boolean",
              default: true,
              description: "Whether the mask path is closed"
            }
          }
        }
      },
      required: ["compId", "layerIndex"]
    }
  },

  {
    name: "add_rectangular_mask",
    description: "Add a rectangular mask to a layer",
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
        name: {
          type: "string",
          default: "Rectangle Mask",
          description: "Name for the mask"
        },
        bounds: {
          type: "object",
          properties: {
            left: { type: "number", description: "Left edge position" },
            top: { type: "number", description: "Top edge position" },
            width: { type: "number", description: "Rectangle width" },
            height: { type: "number", description: "Rectangle height" }
          },
          required: ["left", "top", "width", "height"]
        },
        roundness: {
          type: "number",
          default: 0,
          description: "Corner roundness"
        }
      },
      required: ["compId", "layerIndex", "bounds"]
    }
  },

  {
    name: "add_elliptical_mask",
    description: "Add an elliptical mask to a layer",
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
        name: {
          type: "string",
          default: "Ellipse Mask",
          description: "Name for the mask"
        },
        center: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
          description: "Center position [x, y]"
        },
        radius: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 2,
          description: "Radius [width, height]"
        }
      },
      required: ["compId", "layerIndex", "center", "radius"]
    }
  },

  {
    name: "modify_mask_path",
    description: "Modify the path of an existing mask",
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
        maskIndex: { 
          type: "number", 
          description: "Index of the mask" 
        },
        maskShape: {
          type: "object",
          description: "New mask shape",
          properties: {
            vertices: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] vertex positions"
            },
            inTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] in tangent positions"
            },
            outTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] out tangent positions"
            },
            closed: {
              type: "boolean",
              description: "Whether the mask path is closed"
            }
          }
        },
        setKeyframe: {
          type: "boolean",
          default: false,
          description: "Whether to set a keyframe at current time"
        }
      },
      required: ["compId", "layerIndex", "maskIndex", "maskShape"]
    }
  },

  {
    name: "set_mask_properties",
    description: "Set properties of a mask",
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
        maskIndex: { 
          type: "number", 
          description: "Index of the mask" 
        },
        properties: {
          type: "object",
          properties: {
            maskMode: {
              type: "string",
              enum: ["none", "add", "subtract", "intersect", "lighten", "darken", "difference"],
              description: "Mask blending mode"
            },
            inverted: {
              type: "boolean",
              description: "Invert the mask"
            },
            maskFeather: {
              type: "array",
              items: { type: "number" },
              minItems: 2,
              maxItems: 2,
              description: "Feather amount [x, y]"
            },
            maskOpacity: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Mask opacity (0-100)"
            },
            maskExpansion: {
              type: "number",
              description: "Mask expansion in pixels"
            },
            locked: {
              type: "boolean",
              description: "Lock the mask"
            }
          }
        }
      },
      required: ["compId", "layerIndex", "maskIndex", "properties"]
    }
  },

  {
    name: "delete_mask",
    description: "Delete a mask from a layer",
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
        maskIndex: { 
          type: "number", 
          description: "Index of the mask to delete" 
        }
      },
      required: ["compId", "layerIndex", "maskIndex"]
    }
  },

  {
    name: "get_mask_info",
    description: "Get information about masks on a layer",
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
        maskIndex: { 
          type: "number", 
          description: "Optional specific mask index" 
        }
      },
      required: ["compId", "layerIndex"]
    }
  },

  {
    name: "animate_mask_path",
    description: "Animate a mask path with keyframes",
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
        maskIndex: { 
          type: "number", 
          description: "Index of the mask" 
        },
        keyframes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { 
                type: "number", 
                description: "Time in seconds" 
              },
              maskShape: {
                type: "object",
                description: "Mask shape at this keyframe",
                properties: {
                  vertices: {
                    type: "array",
                    items: {
                      type: "array",
                      items: { type: "number" },
                      minItems: 2,
                      maxItems: 2
                    }
                  },
                  inTangents: {
                    type: "array",
                    items: {
                      type: "array",
                      items: { type: "number" },
                      minItems: 2,
                      maxItems: 2
                    }
                  },
                  outTangents: {
                    type: "array",
                    items: {
                      type: "array",
                      items: { type: "number" },
                      minItems: 2,
                      maxItems: 2
                    }
                  }
                },
                required: ["vertices"]
              }
            },
            required: ["time", "maskShape"]
          },
          description: "Array of keyframe data"
        }
      },
      required: ["compId", "layerIndex", "maskIndex", "keyframes"]
    }
  },

  {
    name: "add_shape_path",
    description: "Add a path to a shape layer",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the shape layer" 
        },
        groupName: {
          type: "string",
          description: "Name of the shape group (optional)"
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
              description: "Array of [x, y] vertex positions"
            },
            inTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] in tangent positions"
            },
            outTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] out tangent positions"
            },
            closed: {
              type: "boolean",
              default: false,
              description: "Whether the path is closed"
            }
          },
          required: ["vertices"]
        },
        fillColor: {
          type: "array",
          items: { type: "number" },
          minItems: 3,
          maxItems: 4,
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
        }
      },
      required: ["compId", "layerIndex", "path"]
    }
  },

  {
    name: "modify_shape_path",
    description: "Modify an existing shape path",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the shape layer" 
        },
        pathPropertyPath: {
          type: "string",
          description: "Property path to the shape path (e.g., 'Contents.Shape 1.Path 1')"
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
              description: "Array of [x, y] vertex positions"
            },
            inTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] in tangent positions"
            },
            outTangents: {
              type: "array",
              items: {
                type: "array",
                items: { type: "number" },
                minItems: 2,
                maxItems: 2
              },
              description: "Array of [x, y] out tangent positions"
            },
            closed: {
              type: "boolean",
              description: "Whether the path is closed"
            }
          }
        },
        setKeyframe: {
          type: "boolean",
          default: false,
          description: "Whether to set a keyframe at current time"
        }
      },
      required: ["compId", "layerIndex", "pathPropertyPath", "path"]
    }
  },

  {
    name: "create_shape_from_path",
    description: "Create a shape layer from a custom path",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        name: {
          type: "string",
          default: "Shape Path",
          description: "Name for the shape layer"
        },
        paths: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name for this path"
              },
              vertices: {
                type: "array",
                items: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2
                },
                description: "Array of [x, y] vertex positions"
              },
              inTangents: {
                type: "array",
                items: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2
                },
                description: "Array of [x, y] in tangent positions"
              },
              outTangents: {
                type: "array",
                items: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2
                },
                description: "Array of [x, y] out tangent positions"
              },
              closed: {
                type: "boolean",
                default: false,
                description: "Whether the path is closed"
              },
              fillColor: {
                type: "array",
                items: { type: "number" },
                minItems: 3,
                maxItems: 4,
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
                description: "Stroke width in pixels"
              }
            },
            required: ["vertices"]
          },
          description: "Array of paths to create"
        }
      },
      required: ["compId", "paths"]
    }
  },

  {
    name: "convert_mask_to_shape",
    description: "Convert a mask to a shape layer path",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer with mask" 
        },
        maskIndex: { 
          type: "number", 
          description: "Index of the mask to convert" 
        },
        createNewLayer: {
          type: "boolean",
          default: true,
          description: "Create a new shape layer (vs add to existing)"
        },
        targetLayerIndex: {
          type: "number",
          description: "Target shape layer index (if not creating new)"
        }
      },
      required: ["compId", "layerIndex", "maskIndex"]
    }
  }
];