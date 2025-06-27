export const renderTools = [
  {
    name: "add_to_render_queue",
    description: "Add a composition to the render queue",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition to render" 
        },
        outputPath: { 
          type: "string", 
          description: "Output file path for the rendered video" 
        },
        outputModule: { 
          type: "string", 
          description: "Output module template name (e.g., 'H.264', 'Lossless')" 
        },
        renderSettings: { 
          type: "string", 
          description: "Render settings template name (e.g., 'Best Settings', 'Draft Settings')" 
        }
      },
      required: ["compId", "outputPath"]
    }
  },
  
  {
    name: "start_render",
    description: "Start rendering all items in the render queue",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  
  {
    name: "pause_render",
    description: "Pause the current render process",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  
  {
    name: "stop_render",
    description: "Stop the current render process",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  
  {
    name: "get_render_queue",
    description: "Get the status of all items in the render queue",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  
  {
    name: "clear_render_queue",
    description: "Remove all items from the render queue",
    inputSchema: {
      type: "object",
      properties: {
        confirmClear: { 
          type: "boolean", 
          default: false,
          description: "Must be true to confirm clearing the queue" 
        }
      },
      required: ["confirmClear"]
    }
  },
  
  {
    name: "export_frame",
    description: "Export a single frame from a composition",
    inputSchema: {
      type: "object",
      properties: {
        compId: { 
          type: "number", 
          description: "ID of the composition" 
        },
        time: { 
          type: "number", 
          description: "Time in seconds of the frame to export" 
        },
        outputPath: { 
          type: "string", 
          description: "Output file path for the image (PNG or JPEG)" 
        }
      },
      required: ["compId", "time", "outputPath"]
    }
  },
  
  {
    name: "batch_render",
    description: "Add multiple compositions to render queue with same settings",
    inputSchema: {
      type: "object",
      properties: {
        compIds: { 
          type: "array",
          items: { type: "number" },
          description: "Array of composition IDs to render" 
        },
        outputDirectory: { 
          type: "string", 
          description: "Directory where all renders will be saved" 
        },
        outputFormat: { 
          type: "string", 
          default: "mp4",
          description: "Output format extension (mp4, mov, avi)" 
        },
        outputModule: { 
          type: "string", 
          description: "Output module template to use for all renders" 
        }
      },
      required: ["compIds", "outputDirectory"]
    }
  }
];