export const compositionTools = [
  {
    name: "create_composition",
    description: "Create a new composition in the current project",
    inputSchema: {
      type: "object",
      properties: {
        name: { 
          type: "string", 
          description: "Name of the composition" 
        },
        width: { 
          type: "number", 
          default: 1920,
          description: "Width in pixels" 
        },
        height: { 
          type: "number", 
          default: 1080,
          description: "Height in pixels" 
        },
        duration: { 
          type: "number", 
          default: 10,
          description: "Duration in seconds" 
        },
        frameRate: { 
          type: "number", 
          default: 30,
          description: "Frame rate (fps)" 
        }
      },
      required: ["name"]
    }
  },
  
  {
    name: "modify_composition",
    description: "Modify properties of an existing composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition to modify" 
        },
        properties: {
          type: "object",
          properties: {
            name: { 
              type: "string", 
              description: "New name for the composition" 
            },
            width: { 
              type: "number", 
              description: "New width in pixels" 
            },
            height: { 
              type: "number", 
              description: "New height in pixels" 
            },
            duration: { 
              type: "number", 
              description: "New duration in seconds" 
            },
            backgroundColor: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 3,
              description: "Background color as RGB values (0-1)"
            }
          }
        }
      },
      required: ["compId", "properties"]
    }
  },
  
  {
    name: "duplicate_composition",
    description: "Duplicate an existing composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition to duplicate" 
        },
        newName: { 
          type: "string", 
          description: "Name for the duplicated composition" 
        }
      },
      required: ["compId", "newName"]
    }
  },
  
  {
    name: "delete_composition",
    description: "Delete a composition from the project",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition to delete" 
        },
        confirmDelete: { 
          type: "boolean", 
          default: false,
          description: "Must be true to confirm deletion" 
        }
      },
      required: ["compId", "confirmDelete"]
    }
  },
  
  {
    name: "list_compositions",
    description: "List all compositions in the current project",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  
  {
    name: "get_composition_info",
    description: "Get detailed information about a specific composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        }
      },
      required: ["compId"]
    }
  }
];