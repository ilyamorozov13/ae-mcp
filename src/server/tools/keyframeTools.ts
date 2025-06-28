export const keyframeTools = [
  {
    name: "set_keyframe_advanced",
    description: "Set a keyframe with interpolation options",
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
        },
        time: { 
          type: "number", 
          description: "Time in seconds" 
        },
        value: { 
          description: "Value for the keyframe (number or array depending on property)" 
        },
        interpolation: {
          type: "object",
          properties: {
            temporalEase: {
              type: "string",
              enum: ["linear", "easeIn", "easeOut", "easeInOut", "hold", "custom"],
              default: "linear",
              description: "Temporal interpolation type"
            },
            spatialInterpolation: {
              type: "string",
              enum: ["linear", "bezier", "auto"],
              default: "linear",
              description: "Spatial interpolation for position properties"
            },
            customEase: {
              type: "object",
              description: "Custom ease values (for custom temporal ease)",
              properties: {
                easeIn: {
                  type: "object",
                  properties: {
                    speed: { type: "number", description: "Speed value (0-100)" },
                    influence: { type: "number", description: "Influence percentage (0-100)" }
                  }
                },
                easeOut: {
                  type: "object",
                  properties: {
                    speed: { type: "number", description: "Speed value (0-100)" },
                    influence: { type: "number", description: "Influence percentage (0-100)" }
                  }
                }
              }
            }
          }
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "time", "value"]
    }
  },

  {
    name: "apply_easy_ease",
    description: "Apply Easy Ease to selected keyframes",
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
        keyframeIndices: {
          type: "array",
          items: { type: "number" },
          description: "Indices of keyframes to apply easy ease to (1-based)"
        },
        easeType: {
          type: "string",
          enum: ["ease", "easeIn", "easeOut"],
          default: "ease",
          description: "Type of easy ease"
        }
      },
      required: ["compId", "layerIndex", "propertyPath"]
    }
  },

  {
    name: "set_keyframe_velocity",
    description: "Set velocity (speed graph) for keyframes",
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
        keyframeIndex: {
          type: "number",
          description: "Index of the keyframe (1-based)"
        },
        incomingVelocity: {
          type: "number",
          description: "Incoming velocity"
        },
        outgoingVelocity: {
          type: "number",
          description: "Outgoing velocity"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "keyframeIndex"]
    }
  },

  {
    name: "set_temporal_ease",
    description: "Set temporal ease (bezier handles) for keyframes",
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
        keyframeIndex: {
          type: "number",
          description: "Index of the keyframe (1-based)"
        },
        easeIn: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speed: { type: "number", description: "Speed value" },
              influence: { type: "number", description: "Influence percentage (0-100)" }
            }
          },
          description: "Ease in values (array for multi-dimensional properties)"
        },
        easeOut: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speed: { type: "number", description: "Speed value" },
              influence: { type: "number", description: "Influence percentage (0-100)" }
            }
          },
          description: "Ease out values (array for multi-dimensional properties)"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "keyframeIndex"]
    }
  },

  {
    name: "set_spatial_tangent",
    description: "Set spatial tangents for position keyframes (motion path)",
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
        keyframeIndex: {
          type: "number",
          description: "Index of the position keyframe (1-based)"
        },
        inTangent: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 3,
          description: "Incoming tangent [x, y] or [x, y, z]"
        },
        outTangent: {
          type: "array",
          items: { type: "number" },
          minItems: 2,
          maxItems: 3,
          description: "Outgoing tangent [x, y] or [x, y, z]"
        }
      },
      required: ["compId", "layerIndex", "keyframeIndex"]
    }
  },

  {
    name: "set_keyframe_interpolation_type",
    description: "Set interpolation type for keyframes",
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
        keyframeIndex: {
          type: "number",
          description: "Index of the keyframe (1-based)"
        },
        inType: {
          type: "string",
          enum: ["linear", "bezier", "hold", "auto"],
          description: "Incoming interpolation type"
        },
        outType: {
          type: "string",
          enum: ["linear", "bezier", "hold", "auto"],
          description: "Outgoing interpolation type"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "keyframeIndex"]
    }
  },

  {
    name: "create_animation_curve",
    description: "Create an animation with custom curve",
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
        keyframes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time: { type: "number", description: "Time in seconds" },
              value: { description: "Value at this time" },
              easeIn: {
                type: "object",
                properties: {
                  speed: { type: "number" },
                  influence: { type: "number" }
                },
                description: "Ease in parameters"
              },
              easeOut: {
                type: "object",
                properties: {
                  speed: { type: "number" },
                  influence: { type: "number" }
                },
                description: "Ease out parameters"
              }
            },
            required: ["time", "value"]
          },
          description: "Array of keyframes with easing"
        },
        clearExisting: {
          type: "boolean",
          default: true,
          description: "Clear existing keyframes first"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "keyframes"]
    }
  },

  {
    name: "copy_keyframes",
    description: "Copy keyframes from one property to another",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        sourceLayer: { 
          type: "number", 
          description: "Source layer index" 
        },
        sourceProperty: { 
          type: "string", 
          description: "Source property path" 
        },
        targetLayer: { 
          type: "number", 
          description: "Target layer index" 
        },
        targetProperty: { 
          type: "string", 
          description: "Target property path" 
        },
        timeOffset: {
          type: "number",
          default: 0,
          description: "Time offset in seconds"
        },
        reverseKeyframes: {
          type: "boolean",
          default: false,
          description: "Reverse the keyframe order"
        }
      },
      required: ["compId", "sourceLayer", "sourceProperty", "targetLayer", "targetProperty"]
    }
  },

  {
    name: "offset_keyframes",
    description: "Offset keyframes in time",
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
        offset: {
          type: "number",
          description: "Time offset in seconds (positive or negative)"
        },
        keyframeIndices: {
          type: "array",
          items: { type: "number" },
          description: "Specific keyframes to offset (optional, all if not specified)"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "offset"]
    }
  },

  {
    name: "scale_keyframe_timing",
    description: "Scale the timing of keyframes (stretch or compress animation)",
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
        scaleFactor: {
          type: "number",
          description: "Scale factor (2 = double duration, 0.5 = half duration)"
        },
        anchorTime: {
          type: "number",
          default: 0,
          description: "Time to anchor the scaling around"
        }
      },
      required: ["compId", "layerIndex", "propertyPath", "scaleFactor"]
    }
  },

  {
    name: "reverse_keyframes",
    description: "Reverse the order of keyframes",
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
    name: "apply_animation_preset",
    description: "Apply predefined animation presets",
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
        preset: {
          type: "string",
          enum: ["fadeIn", "fadeOut", "slideInLeft", "slideInRight", "slideInTop", "slideInBottom", 
                 "scaleIn", "scaleOut", "rotateIn", "bounce", "elastic", "overshoot"],
          description: "Animation preset to apply"
        },
        duration: {
          type: "number",
          default: 1,
          description: "Animation duration in seconds"
        },
        startTime: {
          type: "number",
          description: "Start time (defaults to current time)"
        },
        properties: {
          type: "array",
          items: {
            type: "string",
            enum: ["position", "scale", "rotation", "opacity"]
          },
          description: "Which properties to animate (defaults based on preset)"
        }
      },
      required: ["compId", "layerIndex", "preset"]
    }
  }
];