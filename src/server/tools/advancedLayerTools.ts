export const advancedLayerTools = [
  {
    name: "add_null_layer",
    description: "Add a null object layer to a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        name: { 
          type: "string", 
          default: "Null Object",
          description: "Name of the null layer" 
        },
        is3D: {
          type: "boolean",
          default: false,
          description: "Create as 3D layer"
        }
      },
      required: ["compId"]
    }
  },

  {
    name: "add_adjustment_layer",
    description: "Add an adjustment layer to a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        name: { 
          type: "string", 
          default: "Adjustment Layer",
          description: "Name of the adjustment layer" 
        }
      },
      required: ["compId"]
    }
  },

  {
    name: "add_camera_layer",
    description: "Add a camera layer to a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        name: { 
          type: "string", 
          default: "Camera",
          description: "Name of the camera layer" 
        },
        preset: {
          type: "string",
          enum: ["15mm", "20mm", "24mm", "28mm", "35mm", "50mm", "80mm", "135mm", "200mm", "Custom"],
          default: "50mm",
          description: "Camera lens preset"
        },
        focalLength: {
          type: "number",
          description: "Focal length in mm (for custom preset)"
        }
      },
      required: ["compId"]
    }
  },

  {
    name: "add_light_layer",
    description: "Add a light layer to a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        name: { 
          type: "string", 
          default: "Light",
          description: "Name of the light layer" 
        },
        lightType: {
          type: "string",
          enum: ["parallel", "spot", "point", "ambient"],
          default: "point",
          description: "Type of light"
        },
        color: {
          type: "array",
          items: { type: "number" },
          minItems: 3,
          maxItems: 3,
          default: [1, 1, 1],
          description: "RGB color values (0-1)"
        },
        intensity: {
          type: "number",
          minimum: 0,
          maximum: 200,
          default: 100,
          description: "Light intensity percentage"
        }
      },
      required: ["compId"]
    }
  },

  {
    name: "set_layer_parent",
    description: "Set parent-child relationship between layers",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        childLayerIndex: { 
          type: "number", 
          description: "Index of the child layer" 
        },
        parentLayerIndex: { 
          type: "number", 
          description: "Index of the parent layer (null to remove parent)" 
        }
      },
      required: ["compId", "childLayerIndex"]
    }
  },

  {
    name: "set_layer_blend_mode",
    description: "Set the blending mode of a layer",
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
        blendMode: {
          type: "string",
          enum: [
            "normal", "dissolve", "darken", "multiply", "colorBurn", "linearBurn", "darkerColor",
            "add", "lighten", "screen", "colorDodge", "linearDodge", "lighterColor",
            "overlay", "softLight", "hardLight", "linearLight", "vividLight", "pinLight", "hardMix",
            "difference", "exclusion", "subtract", "divide",
            "hue", "saturation", "color", "luminosity"
          ],
          description: "Blending mode"
        }
      },
      required: ["compId", "layerIndex", "blendMode"]
    }
  },

  {
    name: "set_track_matte",
    description: "Set track matte for a layer",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        layerIndex: { 
          type: "number", 
          description: "Index of the layer to apply matte to" 
        },
        matteType: {
          type: "string",
          enum: ["none", "alpha", "alphaInverted", "luma", "lumaInverted"],
          description: "Type of track matte"
        }
      },
      required: ["compId", "layerIndex", "matteType"]
    }
  },

  {
    name: "set_layer_3d",
    description: "Enable or disable 3D for a layer",
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
        is3D: {
          type: "boolean",
          description: "Enable 3D for the layer"
        }
      },
      required: ["compId", "layerIndex", "is3D"]
    }
  },

  {
    name: "modify_layer_3d_properties",
    description: "Modify 3D properties of a layer",
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
        properties: {
          type: "object",
          properties: {
            orientation: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 3,
              description: "3D orientation [x, y, z] in degrees"
            },
            xRotation: {
              type: "number",
              description: "X rotation in degrees"
            },
            yRotation: {
              type: "number",
              description: "Y rotation in degrees"
            },
            zRotation: {
              type: "number",
              description: "Z rotation in degrees"
            },
            materialOptions: {
              type: "object",
              properties: {
                castsShadows: {
                  type: "boolean",
                  description: "Layer casts shadows"
                },
                acceptsShadows: {
                  type: "boolean",
                  description: "Layer accepts shadows"
                },
                acceptsLights: {
                  type: "boolean",
                  description: "Layer is affected by lights"
                },
                ambientCoefficient: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Ambient light coefficient"
                },
                diffuseCoefficient: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Diffuse light coefficient"
                },
                specularCoefficient: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Specular light coefficient"
                },
                shininess: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Specular shininess"
                }
              }
            }
          }
        }
      },
      required: ["compId", "layerIndex", "properties"]
    }
  },

  {
    name: "set_layer_quality",
    description: "Set the quality/sampling of a layer",
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
        quality: {
          type: "string",
          enum: ["best", "draft", "wireframe"],
          description: "Layer quality setting"
        }
      },
      required: ["compId", "layerIndex", "quality"]
    }
  },

  {
    name: "set_motion_blur",
    description: "Configure motion blur for a layer",
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
        enabled: {
          type: "boolean",
          description: "Enable motion blur for the layer"
        },
        adjustmentLayer: {
          type: "boolean",
          description: "Apply motion blur to adjustment layer"
        }
      },
      required: ["compId", "layerIndex", "enabled"]
    }
  },

  {
    name: "set_layer_visibility",
    description: "Control layer visibility settings",
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
        visible: {
          type: "boolean",
          description: "Layer visibility"
        },
        solo: {
          type: "boolean",
          description: "Solo the layer"
        },
        shy: {
          type: "boolean",
          description: "Make layer shy"
        },
        locked: {
          type: "boolean",
          description: "Lock the layer"
        }
      },
      required: ["compId", "layerIndex"]
    }
  },

  {
    name: "set_time_remapping",
    description: "Enable time remapping for a layer",
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
        enabled: {
          type: "boolean",
          description: "Enable time remapping"
        }
      },
      required: ["compId", "layerIndex", "enabled"]
    }
  },

  {
    name: "animate_time_remap",
    description: "Set time remap keyframes for a layer (automatically enables time remapping)",
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
        keyframes: {
          type: "array",
          description: "Array of time remap keyframes",
          items: {
            type: "object",
            properties: {
              time: {
                type: "number",
                description: "Time in seconds"
              },
              value: {
                type: "number",
                description: "Remapped time value in seconds"
              }
            },
            required: ["time", "value"]
          }
        },
        clearExisting: {
          type: "boolean",
          default: true,
          description: "Clear existing keyframes before adding new ones"
        }
      },
      required: ["compId", "layerIndex", "keyframes"]
    }
  },

  {
    name: "get_layer_info",
    description: "Get detailed information about a layer",
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
        }
      },
      required: ["compId", "layerIndex"]
    }
  }
];