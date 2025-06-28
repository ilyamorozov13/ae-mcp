import { ScriptGeneratorModule } from './types';
import { helpers } from './helpers';

export const renderGenerators: ScriptGeneratorModule = {
  addToRenderQueue: (params: {
    compId: number;
    outputPath: string;
    outputModule?: string;
    renderSettings?: string;
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var item = app.project.renderQueue.items.add(comp);
    var outputModule = item.outputModule(1);
    
    var file = new File("${helpers.escapeString(params.outputPath)}");
    outputModule.file = file;
    
    ${params.outputModule ? `
      try {
        var template = "${helpers.escapeString(params.outputModule)}";
        outputModule.applyTemplate(template);
      } catch (templateError) {
        // Template doesn't exist, provide helpful error message
        throw new Error("Invalid output module template: '" + template + "'. Common templates include: 'Lossless', 'High Quality', 'HDTV 1080 29.97', 'H.264 - Match Render Settings', etc. Check Edit > Templates > Output Module for available templates in your AE installation.");
      }
    ` : ''}
    
    ${params.renderSettings ? `
      try {
        item.applyTemplate("${helpers.escapeString(params.renderSettings)}");
      } catch (templateError) {
        throw new Error("Invalid render settings template: '${helpers.escapeString(params.renderSettings)}'");
      }
    ` : ''}
    
    return {
      success: true,
      data: {
        index: item.index,
        status: item.status,
        outputPath: file.fsName
      }
    };
  `,
  
  startRender: () => `
    if (app.project.renderQueue.numItems === 0) {
      throw new Error("Render queue is empty");
    }
    
    app.project.renderQueue.render();
    
    return {
      success: true,
      data: {
        message: "Render started"
      }
    };
  `,
  
  pauseRender: () => `
    app.project.renderQueue.pauseRendering(true);
    
    return {
      success: true,
      data: {
        message: "Render paused"
      }
    };
  `,
  
  stopRender: () => `
    app.project.renderQueue.stopRendering();
    
    return {
      success: true,
      data: {
        message: "Render stopped"
      }
    };
  `,
  
  getRenderQueue: () => `
    var items = [];
    for (var i = 1; i <= app.project.renderQueue.numItems; i++) {
      var item = app.project.renderQueue.item(i);
      items.push({
        index: item.index,
        comp: item.comp.name,
        status: item.status,
        startTime: item.startTime,
        elapsedSeconds: item.elapsedSeconds
      });
    }
    
    return {
      success: true,
      data: {
        numItems: app.project.renderQueue.numItems,
        items: items
      }
    };
  `,
  
  clearRenderQueue: (params: { confirmClear: boolean }) => `
    if (!${params.confirmClear}) {
      throw new Error("Clear not confirmed. Set confirmClear to true.");
    }
    
    // Remove all items from render queue
    while (app.project.renderQueue.numItems > 0) {
      app.project.renderQueue.item(1).remove();
    }
    
    return {
      success: true,
      data: {
        message: "Render queue cleared"
      }
    };
  `,
  
  exportFrame: (params: { compId: number; time: number; outputPath: string }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    // Set comp time to export frame
    comp.time = ${params.time};
    
    // Add to render queue
    var item = app.project.renderQueue.items.add(comp);
    var outputModule = item.outputModule(1);
    
    // Configure for single frame
    item.timeSpanStart = ${params.time};
    item.timeSpanDuration = comp.frameDuration;
    
    // Set output file
    var file = new File("${helpers.escapeString(params.outputPath)}");
    outputModule.file = file;
    
    // Apply still image format
    var ext = file.name.substr(file.name.lastIndexOf('.') + 1).toLowerCase();
    if (ext === 'png') {
      outputModule.applyTemplate("PNG Sequence");
    } else if (ext === 'jpg' || ext === 'jpeg') {
      outputModule.applyTemplate("JPEG Sequence");
    }
    
    return {
      success: true,
      data: {
        index: item.index,
        outputPath: file.fsName,
        time: ${params.time}
      }
    };
  `,
  
  batchRender: (params: { 
    compIds: number[]; 
    outputDirectory: string; 
    outputFormat?: string; 
    outputModule?: string 
  }) => `
    var results = [];
    var compIds = [${params.compIds.join(',')}];
    var outputDir = "${helpers.escapeString(params.outputDirectory)}";
    var format = "${params.outputFormat || 'mp4'}";
    
    // Ensure directory exists
    var folder = new Folder(outputDir);
    if (!folder.exists) {
      folder.create();
    }
    
    for (var i = 0; i < compIds.length; i++) {
      var comp = app.project.itemByID(compIds[i]);
      if (!comp || !(comp instanceof CompItem)) {
        results.push({
          compId: compIds[i],
          success: false,
          error: "Composition not found"
        });
        continue;
      }
      
      var item = app.project.renderQueue.items.add(comp);
      var outputModule = item.outputModule(1);
      
      // Generate output filename
      var filename = comp.name.replace(/[^a-zA-Z0-9_-]/g, '_') + "." + format;
      var file = new File(outputDir + "/" + filename);
      outputModule.file = file;
      
      ${params.outputModule ? `
        try {
          outputModule.applyTemplate("${helpers.escapeString(params.outputModule)}");
        } catch (e) {
          // Use default if template fails
        }
      ` : ''}
      
      results.push({
        compId: comp.id,
        compName: comp.name,
        success: true,
        outputPath: file.fsName,
        queueIndex: item.index
      });
    }
    
    return {
      success: true,
      data: {
        totalComps: compIds.length,
        queuedComps: results.filter(function(r) { return r.success; }).length,
        results: results
      }
    };
  `
};