import { ScriptGeneratorModule } from './types.js';
import { helpers } from './helpers.js';

export const compositionGenerators: ScriptGeneratorModule = {
  createComposition: (params: {
    name: string;
    width?: number;
    height?: number;
    frameRate?: number;
    duration?: number;
  }) => `
    var comp = app.project.items.addComp(
      "${helpers.escapeString(params.name)}",
      ${params.width !== undefined ? params.width : 1920},
      ${params.height !== undefined ? params.height : 1080},
      1.0,  // pixel aspect ratio
      ${params.duration !== undefined ? params.duration : 10},
      ${params.frameRate !== undefined ? params.frameRate : 30}
    );
    
    return {
      success: true,
      data: {
        id: comp.id,
        name: comp.name,
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        frameRate: comp.frameRate
      }
    };
  `,
  
  modifyComposition: (params: {
    compId: number;
    properties: {
      name?: string;
      width?: number;
      height?: number;
      duration?: number;
      backgroundColor?: number[];
    };
  }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    ${params.properties.name ? `comp.name = "${helpers.escapeString(params.properties.name)}";` : ''}
    ${params.properties.width ? `comp.width = ${params.properties.width};` : ''}
    ${params.properties.height ? `comp.height = ${params.properties.height};` : ''}
    ${params.properties.duration ? `comp.duration = ${params.properties.duration};` : ''}
    ${params.properties.backgroundColor ? `comp.bgColor = [${params.properties.backgroundColor.join(',')}];` : ''}
    
    return {
      success: true,
      data: {
        id: comp.id,
        name: comp.name,
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        frameRate: comp.frameRate
      }
    };
  `,
  
  duplicateComposition: (params: { compId: number; newName: string }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var duplicate = comp.duplicate();
    duplicate.name = "${helpers.escapeString(params.newName)}";
    
    return {
      success: true,
      data: {
        id: duplicate.id,
        name: duplicate.name,
        originalId: comp.id
      }
    };
  `,
  
  deleteComposition: (params: { compId: number; confirmDelete: boolean }) => `
    if (!${params.confirmDelete}) {
      throw new Error("Deletion not confirmed. Set confirmDelete to true.");
    }
    
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var name = comp.name;
    comp.remove();
    
    return {
      success: true,
      data: {
        deletedCompName: name,
        deletedCompId: ${params.compId}
      }
    };
  `,
  
  listCompositions: () => `
    var comps = [];
    for (var i = 1; i <= app.project.numItems; i++) {
      var item = app.project.item(i);
      if (item instanceof CompItem) {
        comps.push({
          id: item.id,
          name: item.name,
          width: item.width,
          height: item.height,
          duration: item.duration,
          frameRate: item.frameRate,
          numLayers: item.numLayers
        });
      }
    }
    
    return {
      success: true,
      data: {
        count: comps.length,
        compositions: comps
      }
    };
  `,
  
  getCompositionInfo: (params: { compId: number }) => `
    var comp = app.project.itemByID(${params.compId});
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error("Composition not found");
    }
    
    var layers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      layers.push({
        index: layer.index,
        name: layer.name,
        locked: layer.locked,
        shy: layer.shy,
        solo: layer.solo,
        enabled: layer.enabled,
        hasVideo: layer.hasVideo,
        active: layer.active,
        nullLayer: layer.nullLayer,
        threeDLayer: layer.threeDLayer,
        startTime: layer.startTime,
        inPoint: layer.inPoint,
        outPoint: layer.outPoint
      });
    }
    
    return {
      success: true,
      data: {
        id: comp.id,
        name: comp.name,
        width: comp.width,
        height: comp.height,
        pixelAspect: comp.pixelAspect,
        duration: comp.duration,
        frameRate: comp.frameRate,
        time: comp.time,
        bgColor: comp.bgColor,
        numLayers: comp.numLayers,
        layers: layers
      }
    };
  `
};