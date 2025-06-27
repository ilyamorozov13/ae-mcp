export const projectTools = [
  {
    name: "create_project",
    description: "Create a new After Effects project",
    inputSchema: {
      type: "object",
      properties: {
        name: { 
          type: "string", 
          description: "Project name" 
        },
        settings: {
          type: "object",
          properties: {
            frameRate: { 
              type: "number", 
              default: 30,
              description: "Default frame rate for new compositions" 
            },
            resolution: {
              type: "object",
              properties: {
                width: { 
                  type: "number", 
                  default: 1920,
                  description: "Default width for new compositions" 
                },
                height: { 
                  type: "number", 
                  default: 1080,
                  description: "Default height for new compositions" 
                }
              }
            }
          }
        }
      },
      required: ["name"]
    }
  },
  
  {
    name: "open_project",
    description: "Open an existing After Effects project file",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { 
          type: "string", 
          description: "Absolute path to the .aep file" 
        }
      },
      required: ["filePath"]
    }
  },
  
  {
    name: "save_project",
    description: "Save the current After Effects project",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { 
          type: "string", 
          description: "Optional path to save the project. If not provided, saves to current location" 
        }
      }
    }
  },
  
  {
    name: "close_project",
    description: "Close the current After Effects project",
    inputSchema: {
      type: "object",
      properties: {
        saveChanges: { 
          type: "boolean", 
          default: false,
          description: "Whether to save changes before closing" 
        }
      }
    }
  },
  
  {
    name: "get_project_info",
    description: "Get information about the current After Effects project",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  
  {
    name: "import_footage",
    description: "Import footage (video, image, or audio) into the project",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { 
          type: "string", 
          description: "Path to the media file to import" 
        },
        folderName: { 
          type: "string", 
          description: "Optional folder name to organize the imported footage" 
        }
      },
      required: ["filePath"]
    }
  }
];