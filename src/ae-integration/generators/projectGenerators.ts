import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const projectGenerators: ScriptGeneratorModule = {
  createProject: (params: { name: string; settings?: any }) => `
    var project = app.newProject();
    if (project) {
      project.name = "${helpers.escapeString(params.name)}";
      return {
        success: true,
        data: {
          name: project.name,
          file: project.file ? project.file.fsName : null,
          numItems: project.numItems
        }
      };
    }
    throw new Error("Failed to create project");
  `,
  
  openProject: (params: { filePath: string }) => `
    var file = new File("${helpers.escapeString(params.filePath)}");
    if (!file.exists) {
      throw new Error("File not found: " + file.fsName);
    }
    
    var project = app.open(file);
    
    return {
      success: true,
      data: {
        name: project.file ? project.file.name : "Untitled",
        file: project.file ? project.file.fsName : null,
        numItems: project.numItems
      }
    };
  `,
  
  saveProject: (params: { filePath?: string }) => `
    ${params.filePath ? `
      var file = new File("${helpers.escapeString(params.filePath)}");
      app.project.save(file);
    ` : `
      if (!app.project.file) {
        throw new Error("Project has no file path. Please provide a filePath parameter.");
      }
      app.project.save();
    `}
    
    return {
      success: true,
      data: {
        saved: true,
        file: app.project.file ? app.project.file.fsName : null
      }
    };
  `,
  
  closeProject: (params: { saveChanges?: boolean }) => `
    ${params.saveChanges ? `
      if (app.project.file) {
        app.project.save();
      }
    ` : ''}
    
    app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
    
    return {
      success: true,
      data: {
        closed: true
      }
    };
  `,
  
  getProjectInfo: () => `
    var items = [];
    for (var i = 1; i <= app.project.numItems; i++) {
      var item = app.project.item(i);
      var itemInfo = {
        id: item.id,
        name: item.name,
        type: item.typeName,
        comment: item.comment
      };
      
      if (item instanceof CompItem) {
        itemInfo.width = item.width;
        itemInfo.height = item.height;
        itemInfo.duration = item.duration;
        itemInfo.frameRate = item.frameRate;
        itemInfo.numLayers = item.numLayers;
      } else if (item instanceof FootageItem) {
        itemInfo.duration = item.duration;
        itemInfo.frameRate = item.frameRate;
        if (item.file) {
          itemInfo.file = item.file.fsName;
        }
      }
      
      items.push(itemInfo);
    }
    
    return {
      success: true,
      data: {
        file: app.project.file ? app.project.file.fsName : null,
        name: app.project.file ? app.project.file.name : "Untitled Project",
        numItems: app.project.numItems,
        items: items,
        selection: app.project.selection.length
      }
    };
  `,
  
  importFootage: (params: { filePath: string; folderName?: string }) => `
    var file = new File("${helpers.escapeString(params.filePath)}");
    if (!file.exists) {
      throw new Error("File not found: " + file.fsName);
    }
    
    var importOptions = new ImportOptions(file);
    var footage = app.project.importFile(importOptions);
    
    ${params.folderName ? `
      // Create or find folder
      var folder = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FolderItem && item.name === "${helpers.escapeString(params.folderName)}") {
          folder = item;
          break;
        }
      }
      
      if (!folder) {
        folder = app.project.items.addFolder("${helpers.escapeString(params.folderName)}");
      }
      
      footage.parentFolder = folder;
    ` : ''}
    
    return {
      success: true,
      data: {
        id: footage.id,
        name: footage.name,
        type: footage.typeName,
        duration: footage.duration,
        frameRate: footage.frameRate
      }
    };
  `
};